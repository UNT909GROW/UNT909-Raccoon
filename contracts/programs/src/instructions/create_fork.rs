//! ===========================================================================
//! Unit09 – Create Fork Instruction
//! Path: contracts/unit09-program/programs/unit09_program/src/instructions/create_fork.rs
//!
//! This instruction creates a new `Fork` – a variant of the Unit09 AI
//! configured with its own metadata, tags, and lineage.
//!
//! Conceptually, a fork is a branch in the Unit09 “personality tree”:
//! - each fork can have a parent (another fork or a root identity)
//! - each fork has an owner that can update its metadata and flags
//! - forks can be used by off-chain workers as different Unit09 profiles
//!
//! On success this instruction:
//! - initializes a `Fork` PDA
//! - sets parent, depth, label, metadata URI, tags
//! - marks the fork as active
//! - emits `ForkCreated` event
//!
//! Guards:
//! - lifecycle must allow writes (`Lifecycle::assert_writes_allowed`)
//! - global config must be active (`Config::assert_active`)
//! - any signer can become a fork owner by calling this instruction
//!
//! PDA layout:
//! - Fork:
//!     seeds = [FORK_SEED.as_bytes(), args.fork_key.as_ref()]
//!     bump  = fork.bump
//!
//! ===========================================================================

use anchor_lang::prelude::*;

use crate::constants::*;
use crate::errors::Unit09Error;
use crate::events::ForkCreated;
use crate::state::{Config, Fork, Lifecycle};

/// Arguments for the `create_fork` instruction.
///
/// The caller chooses a `fork_key` used to derive the PDA.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct CreateForkArgs {
    /// Arbitrary key used with `FORK_SEED` to derive the `Fork` PDA.
    ///
    /// Example sources:
    /// - a random key generated locally
    /// - hash of a configuration manifest
    /// - hash of a narrative / storyline ID
    pub fork_key: Pubkey,

    /// Optional parent fork or root identity.
    ///
    /// If `None` and `is_root == true`, the parent is set to `Pubkey::default()`.
    /// If `None` and `is_root == false`, the parent is also set to default but
    /// you may interpret this as “detached” in off-chain tooling.
    pub parent: Option<Pubkey>,

    /// Human-readable label for this fork.
    ///
    /// Example: "unit09-lab-alpha", "wasteland-storyline-1"
    pub label: String,

    /// Off-chain metadata URI describing this fork.
    ///
    /// Example: a JSON manifest including:
    /// - story context
    /// - behavioral parameters
    /// - worker configuration
    pub metadata_uri: String,

    /// Tags for discovery and analytics.
    ///
    /// Example: "story,alpha,high-risk"
    pub tags: String,

    /// Whether this fork should be treated as a root-level branch.
    pub is_root: bool,

    /// Optional explicit depth in the fork tree.
    ///
    /// If `None`:
    /// - depth defaults to 0 when `is_root == true`
    /// - depth defaults to 1 when `is_root == false`
    pub depth: Option<u16>,
}

/// Accounts required for the `create_fork` instruction.
#[derive(Accounts)]
pub struct CreateFork<'info> {
    /// Payer for the newly created `Fork` account.
    #[account(mut)]
    pub payer: Signer<'info>,

    /// Owner of the new fork.
    ///
    /// This key will be stored as `Fork::owner` and will be required for
    /// subsequent updates to this fork (for example via `update_fork_state`).
    #[account(mut)]
    pub owner: Signer<'info>,

    /// Global configuration account.
    #[account(
        mut,
        seeds = [CONFIG_SEED.as_bytes()],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    /// Lifecycle account controlling global phases and freezes.
    #[account(
        mut,
        seeds = [LIFECYCLE_SEED.as_bytes()],
        bump = lifecycle.bump,
    )]
    pub lifecycle: Account<'info, Lifecycle>,

    /// Fork account to be created.
    ///
    /// PDA:
    ///   seeds = [
    ///       FORK_SEED.as_bytes(),
    ///       args.fork_key.as_ref(),
    ///   ]
    ///   bump  = fork.bump
    #[account(
        init,
        payer = payer,
        space = Fork::LEN,
        seeds = [
            FORK_SEED.as_bytes(),
            args.fork_key.as_ref(),
        ],
        bump,
    )]
    pub fork: Account<'info, Fork>,

    /// System program.
    pub system_program: Program<'info, System>,

    /// Rent sysvar.
    pub rent: Sysvar<'info, Rent>,

    /// Clock sysvar for timestamps.
    pub clock: Sysvar<'info, Clock>,
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/// Entry point for the `create_fork` instruction.
///
/// Steps:
/// 1. Ensure lifecycle allows writes and config is active.
/// 2. Validate label, metadata URI, and tags length.
/// 3. Derive parent and depth values.
/// 4. Initialize `Fork` account via `Fork::init`.
/// 5. Emit `ForkCreated` event.
pub fn handle(ctx: Context<CreateFork>, args: CreateForkArgs) -> Result<()> {
    let CreateFork {
        payer: _,
        owner,
        mut config,
        mut lifecycle,
        mut fork,
        system_program: _,
        rent: _,
        clock,
    } = ctx.accounts;

    let clock_ref: &Clock = clock;

    // -----------------------------------------------------------------------
    // Lifecycle and configuration guards
    // -----------------------------------------------------------------------

    lifecycle.assert_writes_allowed()?;
    config.assert_active()?;

    // -----------------------------------------------------------------------
    // Early validation
    // -----------------------------------------------------------------------

    // Label
    if args.label.is_empty() {
        return err!(Unit09Error::StringEmpty);
    }
    if args.label.len() > Fork::MAX_LABEL_LEN {
        return err!(Unit09Error::StringTooLong);
    }

    // Metadata URI
    if args.metadata_uri.is_empty() {
        return err!(Unit09Error::StringEmpty);
    }
    if args.metadata_uri.len() > Fork::MAX_METADATA_URI_LEN {
        return err!(Unit09Error::StringTooLong);
    }

    // Tags (optional, can be empty)
    if args.tags.len() > Fork::MAX_TAGS_LEN {
        return err!(Unit09Error::StringTooLong);
    }

    // -----------------------------------------------------------------------
    // Derive PDA bump from Anchor context
    // -----------------------------------------------------------------------

    let fork_bump = *ctx.bumps.get("fork").ok_or(Unit09Error::InternalError)?;

    // -----------------------------------------------------------------------
    // Compute parent and depth
    // -----------------------------------------------------------------------

    let parent = args.parent.unwrap_or_else(Pubkey::default);

    // If depth is not provided:
    // - for root forks: depth = 0
    // - for non-root forks: depth = 1
    let depth = match args.depth {
        Some(d) => d,
        None => {
            if args.is_root {
                0u16
            } else {
                1u16
            }
        }
    };

    // -----------------------------------------------------------------------
    // Initialize Fork account
    // -----------------------------------------------------------------------

    fork.init(
        args.fork_key,
        parent,
        owner.key(),
        args.label,
        args.metadata_uri,
        args.tags,
        args.is_root,
        depth,
        fork_bump,
        clock_ref,
    )?;

    // -----------------------------------------------------------------------
    // Emit ForkCreated event
    // -----------------------------------------------------------------------

    emit!(ForkCreated {
        fork: fork.key(),
        owner: fork.owner,
        parent: fork.parent,
        is_root: fork.is_root,
        depth: fork.depth,
        created_at: fork.created_at,
    });

    Ok(())
}
