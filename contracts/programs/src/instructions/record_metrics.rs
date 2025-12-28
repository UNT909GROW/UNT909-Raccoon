//! ===========================================================================
//! Unit09 – Record Metrics Instruction
//! Path: contracts/unit09-program/programs/unit09_program/src/instructions/record_metrics.rs
//!
//! This instruction allows an authorized admin to reconcile and override the
//! global aggregate metrics stored in the `Metrics` account.
//!
//! It is intended for:
//! - maintenance operations
//! - reconciliation with off-chain analytics
//! - correcting counters after migrations or data fixes
//!
//! Important:
//! - This instruction does NOT mutate per-repo or per-module state.
//!   It only updates the global `Metrics` aggregates.
//! - Only the current `Config::admin` is allowed to call this instruction.
//! - All fields in `RecordMetricsArgs` are optional. `None` means
//!   "do not change this value".
//!
//! On success this instruction:
//! - calls `Metrics::adjust_aggregate` with the provided values
//! - updates `metrics.updated_at` using the current clock
//! - emits a `MetricsReconciled` event for indexers and dashboards
//!
//! ===========================================================================

use anchor_lang::prelude::*;

use crate::errors::Unit09Error;
use crate::events::MetricsReconciled;
use crate::state::{Config, Lifecycle, Metrics};

/// Arguments for the `record_metrics` instruction.
///
/// Each field is optional. When a value is `Some`, it replaces the existing
/// value on the `Metrics` account. When a value is `None`, the existing value
/// is kept as-is.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct RecordMetricsArgs {
    /// Optional new total number of repositories.
    pub total_repos: Option<u64>,

    /// Optional new total number of modules.
    pub total_modules: Option<u64>,

    /// Optional new total number of forks.
    pub total_forks: Option<u64>,

    /// Optional new total number of observation runs.
    pub total_observations: Option<u64>,

    /// Optional new aggregate lines of code processed.
    pub total_lines_of_code: Option<u64>,

    /// Optional new aggregate number of files processed.
    pub total_files_processed: Option<u64>,
}

/// Accounts required for the `record_metrics` instruction.
#[derive(Accounts)]
pub struct RecordMetrics<'info> {
    /// Admin signer that is authorized to reconcile metrics.
    ///
    /// Must match `config.admin`.
    #[account(mut)]
    pub admin: Signer<'info>,

    /// Global configuration account.
    ///
    /// Used to verify the admin authority, and optionally to ensure the
    /// deployment is still considered active.
    #[account(
        mut,
        seeds = [crate::constants::CONFIG_SEED.as_bytes()],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    /// Lifecycle account controlling global write permissions.
    #[account(
        mut,
        seeds = [crate::constants::LIFECYCLE_SEED.as_bytes()],
        bump = lifecycle.bump,
    )]
    pub lifecycle: Account<'info, Lifecycle>,

    /// Global metrics account.
    #[account(
        mut,
        seeds = [crate::constants::METRICS_SEED.as_bytes()],
        bump = metrics.bump,
    )]
    pub metrics: Account<'info, Metrics>,

    /// System program.
    pub system_program: Program<'info, System>,

    /// Clock sysvar used for timestamps.
    pub clock: Sysvar<'info, Clock>,
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/// Entry point for the `record_metrics` instruction.
///
/// Steps:
/// 1. Ensure lifecycle allows writes.
/// 2. Verify `admin` matches `config.admin`.
/// 3. Optionally ensure config is active.
/// 4. Perform light validation on provided values.
/// 5. Call `Metrics::adjust_aggregate`.
/// 6. Emit `MetricsReconciled` event.
pub fn handle(ctx: Context<RecordMetrics>, args: RecordMetricsArgs) -> Result<()> {
    let RecordMetrics {
        admin,
        mut config,
        mut lifecycle,
        mut metrics,
        system_program: _,
        clock,
    } = ctx.accounts;

    let clock_ref: &Clock = clock;

    // -----------------------------------------------------------------------
    // Lifecycle and config guards
    // -----------------------------------------------------------------------

    // Ensure writes are allowed at the lifecycle level.
    lifecycle.assert_writes_allowed()?;

    // Ensure the caller is the current admin.
    config.assert_admin(admin)?;

    // Optionally ensure the deployment is marked active; you may relax this
    // if you want to allow metrics reconciliation even in inactive states.
    config.assert_active()?;

    // -----------------------------------------------------------------------
    // Light validation on provided values
    // -----------------------------------------------------------------------
    //
    // We only apply basic sanity checks to avoid obviously invalid values
    // (such as u64::MAX). More complex consistency rules should be enforced
    // by off-chain tooling before calling this instruction.

    if let Some(v) = args.total_repos {
        if v == u64::MAX {
            return err!(Unit09Error::ValueOutOfRange);
        }
    }

    if let Some(v) = args.total_modules {
        if v == u64::MAX {
            return err!(Unit09Error::ValueOutOfRange);
        }
    }

    if let Some(v) = args.total_forks {
        if v == u64::MAX {
            return err!(Unit09Error::ValueOutOfRange);
        }
    }

    if let Some(v) = args.total_observations {
        if v == u64::MAX {
            return err!(Unit09Error::ValueOutOfRange);
        }
    }

    if let Some(v) = args.total_lines_of_code {
        if v == u64::MAX {
            return err!(Unit09Error::ValueOutOfRange);
        }
    }

    if let Some(v) = args.total_files_processed {
        if v == u64::MAX {
            return err!(Unit09Error::ValueOutOfRange);
        }
    }

    // -----------------------------------------------------------------------
    // Apply adjustments to Metrics
    // -----------------------------------------------------------------------

    metrics.adjust_aggregate(
        args.total_repos,
        args.total_modules,
        args.total_forks,
        args.total_observations,
        args.total_lines_of_code,
        args.total_files_processed,
        clock_ref,
    )?;

    // `adjust_aggregate` already sets `updated_at`, but we make sure to keep
    // it aligned here in case implementations change.
    metrics.updated_at = clock_ref.unix_timestamp;

    // -----------------------------------------------------------------------
    // Emit MetricsReconciled event
    // -----------------------------------------------------------------------

    emit!(MetricsReconciled {
        admin: config.admin,
        total_repos: metrics.total_repos,
        total_modules: metrics.total_modules,
        total_forks: metrics.total_forks,
        total_observations: metrics.total_observations,
        total_lines_of_code: metrics.total_lines_of_code,
        total_files_processed: metrics.total_files_processed,
        updated_at: metrics.updated_at,
    });

    Ok(())
}
