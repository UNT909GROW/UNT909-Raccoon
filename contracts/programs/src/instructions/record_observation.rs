//! ===========================================================================
//! Unit09 – Record Observation Instruction
//! Path: contracts/unit09-program/programs/unit09_program/src/instructions/record_observation.rs
//!
//! This instruction records a single observation run over a tracked repository.
//!
//! An "observation" represents Unit09 (or an external worker) scanning a repo
//! and extracting structured information such as:
//! - approximate lines of code
//! - number of files processed
//! - number of modules detected or updated
//! - commit or revision identifier
//!
//! On success this instruction:
//! - updates per-repo observation stats on the `Repo` account
//! - aggregates metrics into the global `Metrics` account
//! - emits an `ObservationRecorded` event for indexers and dashboards
//!
//! Guards:
//! - lifecycle must allow writes (`Lifecycle::assert_writes_allowed`)
//! - global config must be active (`Config::assert_active`)
//! - repo must be active and allow observation (`Repo::assert_observable`)
//! - any signer may perform an observation if the repo allows it
//!
//! Typical usage (off-chain worker):
//! - run analysis on a repo at a particular commit
//! - call `record_observation` with summarized metrics
//! - use emitted events and updated accounts for dashboards
//!
//! ===========================================================================

use anchor_lang::prelude::*;

use crate::constants::*;
use crate::errors::Unit09Error;
use crate::events::ObservationRecorded;
use crate::state::{Config, Lifecycle, Metrics, Repo};

/// Arguments for the `record_observation` instruction.
///
/// The caller provides summarized metrics for a given run. These are
/// validated and then applied to both the `Repo` and `Metrics` accounts.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct RecordObservationArgs {
    /// Approximate total lines of code processed in this observation.
    pub lines_of_code: u64,

    /// Total number of files processed.
    pub files_processed: u32,

    /// Number of modules detected, updated, or touched during this run.
    pub modules_touched: u32,

    /// Optional commit or revision identifier for this observation.
    ///
    /// Examples:
    /// - "9f2a1c7"
    /// - "main@2025-01-01T12:00:00Z"
    pub revision: String,

    /// Optional note or short description of what this observation did.
    ///
    /// Examples:
    /// - "full tree scan"
    /// - "incremental diff since last observation"
    /// - "hot path refactor analysis"
    pub note: String,
}

/// Accounts required for the `record_observation` instruction.
#[derive(Accounts)]
pub struct RecordObservation<'info> {
    /// Signer performing the observation.
    ///
    /// This may be:
    /// - a human operator
    /// - a dedicated worker wallet
    /// - a service account
    #[account(mut)]
    pub observer: Signer<'info>,

    /// Global configuration account.
    #[account(
        mut,
        seeds = [CONFIG_SEED.as_bytes()],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    /// Lifecycle account controlling global write permissions.
    #[account(
        mut,
        seeds = [LIFECYCLE_SEED.as_bytes()],
        bump = lifecycle.bump,
    )]
    pub lifecycle: Account<'info, Lifecycle>,

    /// Global metrics account that aggregates deployment-wide counters.
    #[account(
        mut,
        seeds = [METRICS_SEED.as_bytes()],
        bump = metrics.bump,
    )]
    pub metrics: Account<'info, Metrics>,

    /// Repository being observed.
    ///
    /// PDA:
    ///   seeds = [REPO_SEED.as_bytes(), repo.repo_key.as_ref()]
    ///   bump  = repo.bump
    #[account(
        mut,
        seeds = [
            REPO_SEED.as_bytes(),
            repo.repo_key.as_ref(),
        ],
        bump = repo.bump,
    )]
    pub repo: Account<'info, Repo>,

    /// System program.
    pub system_program: Program<'info, System>,

    /// Clock sysvar for timestamps.
    pub clock: Sysvar<'info, Clock>,
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/// Entry point for the `record_observation` instruction.
///
/// Steps:
/// 1. Enforce lifecycle and config guards.
/// 2. Enforce that the repo is active and observable.
/// 3. Validate numeric fields against configured bounds.
/// 4. Apply per-repo observation update.
/// 5. Aggregate values into global metrics.
/// 6. Emit `ObservationRecorded` event.
pub fn handle(ctx: Context<RecordObservation>, args: RecordObservationArgs) -> Result<()> {
    let RecordObservation {
        observer,
        mut config,
        mut lifecycle,
        mut metrics,
        mut repo,
        system_program: _,
        clock,
    } = ctx.accounts;

    let clock_ref: &Clock = clock;

    // -----------------------------------------------------------------------
    // Lifecycle and configuration guards
    // -----------------------------------------------------------------------

    lifecycle.assert_writes_allowed()?;
    config.assert_active()?;

    // Ensure repository is active and allows observation.
    repo.assert_active()?;
    repo.assert_observable()?;

    // -----------------------------------------------------------------------
    // Early validation on numeric fields
    // -----------------------------------------------------------------------

    if args.lines_of_code == 0 {
        return err!(Unit09Error::ValueOutOfRange);
    }
    if args.lines_of_code > MAX_LOC_PER_OBSERVATION {
        return err!(Unit09Error::ObservationDataTooLarge);
    }

    if args.files_processed == 0 {
        return err!(Unit09Error::ValueOutOfRange);
    }
    if args.files_processed as u64 > MAX_FILES_PER_OBSERVATION as u64 {
        return err!(Unit09Error::ObservationDataTooLarge);
    }

    // `modules_touched` can be zero (for example, metadata-only runs), but
    // we still enforce an upper bound to avoid nonsensical values.
    if args.modules_touched as u64 > MAX_MODULES_PER_OBSERVATION as u64 {
        return err!(Unit09Error::ObservationDataTooLarge);
    }

    // -----------------------------------------------------------------------
    // Basic validation on string fields
    // -----------------------------------------------------------------------

    if args.revision.len() > Repo::MAX_REVISION_LEN {
        return err!(Unit09Error::StringTooLong);
    }

    if args.note.len() > Repo::MAX_OBSERVATION_NOTE_LEN {
        return err!(Unit09Error::StringTooLong);
    }

    // -----------------------------------------------------------------------
    // Apply per-repo observation update
    // -----------------------------------------------------------------------

    repo.record_observation(
        args.lines_of_code,
        args.files_processed,
        args.modules_touched,
        args.revision.clone(),
        args.note.clone(),
        observer.key(),
        clock_ref,
    )?;

    // -----------------------------------------------------------------------
    // Aggregate into global metrics
    // -----------------------------------------------------------------------

    metrics.record_observation(args.lines_of_code, args.files_processed, clock_ref)?;
    metrics.updated_at = clock_ref.unix_timestamp;

    // -----------------------------------------------------------------------
    // Emit ObservationRecorded event
    // -----------------------------------------------------------------------

    emit!(ObservationRecorded {
        repo: repo.key(),
        observer: observer.key(),
        lines_of_code: args.lines_of_code,
        files_processed: args.files_processed,
        modules_touched: args.modules_touched,
        revision: args.revision,
        note: args.note,
        observed_at: repo.last_observed_at,
    });

    Ok(())
}
