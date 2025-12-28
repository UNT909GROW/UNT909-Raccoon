//! ===========================================================================
//! Unit09 – Instruction Module Root
//! Path: contracts/unit09-program/programs/unit09_program/src/instructions/mod.rs
//!
//! This module wires together all instruction handlers for the Unit09 program.
//!
//! Structure:
//! - Each instruction lives in its own file (initialize.rs, set_config.rs, ...)
//! - Each file exposes:
//!       * a `Context<...>` type
//!       * an `Args` struct where needed
//!       * a `handle(...)` function that performs the instruction logic
//! - This `mod.rs`:
//!       * declares the submodules
//!       * re-exports the public types
//!       * provides thin wrapper functions with stable names
//!
//! The `#[program]` module in `lib.rs` is expected to call these wrapper
//! functions so that all business logic remains isolated inside the
//! instruction-specific modules.
//!
//! Example (in lib.rs):
//!
//! ```ignore
//! #[program]
//! pub mod unit09_program {
//!     use super::*;
//!
//!     pub fn initialize(ctx: Context<Initialize>, args: InitializeArgs) -> Result<()> {
//!         instructions::initialize(ctx, args)
//!     }
//! }
//! ```
//!
//! ===========================================================================

use anchor_lang::prelude::*;

// ---------------------------------------------------------------------------
// Submodules
// ---------------------------------------------------------------------------

pub mod initialize;
pub mod set_config;
pub mod register_repo;
pub mod update_repo;
pub mod register_module;
pub mod update_module;
pub mod link_module_to_repo;
pub mod create_fork;
pub mod update_fork_state;
pub mod record_observation;
pub mod record_metrics;
pub mod set_metadata;

// ---------------------------------------------------------------------------
// Public Re-exports
// ---------------------------------------------------------------------------

// Initialize
pub use initialize::{Initialize, InitializeArgs};

// Config
pub use set_config::{SetConfig, SetConfigArgs};

// Repositories
pub use register_repo::{RegisterRepo, RegisterRepoArgs};
pub use update_repo::{UpdateRepo, UpdateRepoArgs};

// Modules
pub use register_module::{RegisterModule, RegisterModuleArgs};
pub use update_module::{UpdateModule, UpdateModuleArgs};
pub use link_module_to_repo::{LinkModuleToRepo, LinkModuleToRepoArgs};

// Forks
pub use create_fork::{CreateFork, CreateForkArgs};
pub use update_fork_state::{UpdateForkState, UpdateForkStateArgs};

// Observations / Metrics
pub use record_observation::{RecordObservation, RecordObservationArgs};
pub use record_metrics::{RecordMetrics, RecordMetricsArgs};

// Metadata
pub use set_metadata::{SetMetadata, SetMetadataArgs};

// ---------------------------------------------------------------------------
// Instruction Routing Wrappers
// ---------------------------------------------------------------------------
//
// Each function below is a thin wrapper around the `handle` function defined
// in the corresponding submodule. These are the functions that should be
// called from the `#[program]` module in `lib.rs`.
//
// This pattern keeps:
// - `lib.rs` small and readable
// - instruction logic grouped by domain in separate files
//
// ---------------------------------------------------------------------------

/// Initialize the Unit09 deployment:
/// - create and configure `Config`
/// - create `Metrics`
/// - optionally create `Lifecycle` and `GlobalMetadata` accounts
pub fn initialize(ctx: Context<Initialize>, args: InitializeArgs) -> Result<()> {
    initialize::handle(ctx, args)
}

/// Update the global configuration:
/// - admin authority
/// - fee basis points
/// - max modules per repository
/// - active flag
/// - policy reference
pub fn set_config(ctx: Context<SetConfig>, args: SetConfigArgs) -> Result<()> {
    set_config::handle(ctx, args)
}

/// Register a new repository:
/// - create `Repo`
/// - associate authority, name, URL, tags
/// - wire repo into metrics
pub fn register_repo(ctx: Context<RegisterRepo>, args: RegisterRepoArgs) -> Result<()> {
    register_repo::handle(ctx, args)
}

/// Update an existing repository:
/// - name / URL / tags
/// - activation flags
/// - observation flags
pub fn update_repo(ctx: Context<UpdateRepo>, args: UpdateRepoArgs) -> Result<()> {
    update_repo::handle(ctx, args)
}

/// Register a new module for a repository:
/// - create `Module`
/// - set metadata URI, category, tags
/// - apply initial semantic version
/// - update per-repo and global metrics
pub fn register_module(ctx: Context<RegisterModule>, args: RegisterModuleArgs) -> Result<()> {
    register_module::handle(ctx, args)
}

/// Update an existing module:
/// - name, metadata URI, category, tags
/// - activation / deprecation flags
/// - semantic version bump
pub fn update_module(ctx: Context<UpdateModule>, args: UpdateModuleArgs) -> Result<()> {
    update_module::handle(ctx, args)
}

/// Link a module to a repository (or relink between repositories).
///
/// This is useful when a module is refactored or when combining modules
/// across multiple repositories.
pub fn link_module_to_repo(
    ctx: Context<LinkModuleToRepo>,
    args: LinkModuleToRepoArgs,
) -> Result<()> {
    link_module_to_repo::handle(ctx, args)
}

/// Create a new fork (Unit09 variant):
/// - create `Fork` account
/// - assign owner, parent, label
/// - attach metadata URI and tags
pub fn create_fork(ctx: Context<CreateFork>, args: CreateForkArgs) -> Result<()> {
    create_fork::handle(ctx, args)
}

/// Update fork state:
/// - label
/// - metadata URI
/// - tags
/// - active/inactive flag
pub fn update_fork_state(
    ctx: Context<UpdateForkState>,
    args: UpdateForkStateArgs,
) -> Result<()> {
    update_fork_state::handle(ctx, args)
}

/// Record an observation run:
/// - update per-repo observation statistics
/// - aggregate metrics into `Metrics`
/// - emit observation-related events
pub fn record_observation(
    ctx: Context<RecordObservation>,
    args: RecordObservationArgs,
) -> Result<()> {
    record_observation::handle(ctx, args)
}

/// Update aggregate metrics in bulk (admin/maintenance use only).
///
/// This is intended for reconciliation with off-chain analytics, not for
/// regular observation recording.
pub fn record_metrics(ctx: Context<RecordMetrics>, args: RecordMetricsArgs) -> Result<()> {
    record_metrics::handle(ctx, args)
}

/// Set or update global metadata:
/// - description
/// - tags
/// - optional URIs for documentation or dashboards
pub fn set_metadata(ctx: Context<SetMetadata>, args: SetMetadataArgs) -> Result<()> {
    set_metadata::handle(ctx, args)
}
