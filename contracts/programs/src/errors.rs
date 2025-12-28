//! ===========================================================================
//! Unit09 – Error Definitions
//! Path: contracts/unit09-program/programs/unit09_program/src/errors.rs
//!
//! This module defines all custom error codes for the Unit09 program.
//!
//! Design goals:
//! - Every error is explicit and self-describing
//! - Grouped by domain: config, authority, repositories, modules, forks, metrics
//! - Safe integer and bounds checks
//! - Helpful messages for explorers, indexers, and UI layers
//!
//! Anchor maps each variant to a numeric code. These codes are stable and can
//! be referenced by off-chain tooling (dashboards, SDKs, monitoring).
//! ===========================================================================

use anchor_lang::prelude::*;

/// Error codes for the Unit09 on-chain program.
///
/// Each variant has:
/// - A human-readable message (visible in transactions)
/// - A specific semantic meaning for frontends and indexers
///
/// When adding a new error:
/// - Keep the naming consistent
/// - Add a doc comment explaining when it is used
/// - Prefer specific errors over generic ones
#[error_code]
pub enum Unit09Error {
    // -----------------------------------------------------------------------
    // Generic / Internal
    // -----------------------------------------------------------------------

    /// An unexpected internal condition was reached.
    ///
    /// This usually indicates a logic bug rather than user error. If you see
    /// this frequently in production, review the instruction handler that
    /// raised it and consider adding more specific error variants.
    #[msg("Internal error: unexpected state.")]
    InternalError,

    /// A numeric operation overflowed.
    ///
    /// This is used when incrementing counters or aggregating metrics and the
    /// result does not fit in the target integer type.
    #[msg("Numeric overflow encountered.")]
    CounterOverflow,

    /// A generic validation failure not covered by more specific errors.
    #[msg("Validation failed.")]
    ValidationFailed,

    // -----------------------------------------------------------------------
    // Configuration and Admin
    // -----------------------------------------------------------------------

    /// The provided admin signer does not match the admin stored in Config.
    #[msg("Invalid admin authority.")]
    InvalidAdmin,

    /// A non-admin attempted to perform an admin-only action.
    ///
    /// This is similar to `InvalidAdmin`, but can be used for contexts where
    /// multiple privileged roles exist and the mismatch is not strictly the
    /// Config admin.
    #[msg("Caller is not authorized to perform this admin action.")]
    UnauthorizedAdminAction,

    /// The fee basis points value is outside the allowed range.
    #[msg("Fee basis points out of allowed range.")]
    InvalidFeeBps,

    /// The configuration account has an unsupported schema version.
    ///
    /// This is useful when performing migrations or when an instruction
    /// expects a specific schema version.
    #[msg("Unsupported configuration schema version.")]
    UnsupportedConfigVersion,

    // -----------------------------------------------------------------------
    // Authority / Roles
    // -----------------------------------------------------------------------

    /// The signer does not match the required authority on the target account.
    #[msg("Invalid authority for this operation.")]
    InvalidAuthority,

    /// The authority account is missing or not initialized when required.
    #[msg("Authority account is missing or not initialized.")]
    MissingAuthority,

    /// The authority role is not permitted to perform the requested action.
    ///
    /// Off-chain tools can maintain their own role mapping and interpret
    /// this error accordingly.
    #[msg("Authority role is not allowed to perform this action.")]
    AuthorityRoleNotAllowed,

    // -----------------------------------------------------------------------
    // String / Bounds / Data Validation
    // -----------------------------------------------------------------------

    /// A provided string exceeds the configured maximum length.
    #[msg("String exceeds maximum allowed length.")]
    StringTooLong,

    /// A required string field is empty.
    #[msg("String value must not be empty.")]
    StringEmpty,

    /// A numeric value is out of the allowed bounds.
    #[msg("Numeric value is out of allowed range.")]
    ValueOutOfRange,

    /// A provided URL does not satisfy basic structural checks.
    ///
    /// This is intentionally conservative; it does not attempt full URL
    /// validation, only simple sanity checks.
    #[msg("Invalid or malformed URL.")]
    InvalidUrl,

    // -----------------------------------------------------------------------
    // Repositories
    // -----------------------------------------------------------------------

    /// The repository is marked as inactive and cannot be modified or used
    /// for new module registrations.
    #[msg("Repository is inactive.")]
    RepoInactive,

    /// Too many modules have been registered for this repository and the
    /// configured limit has been reached.
    #[msg("Repository reached maximum allowed modules.")]
    RepoModuleLimitReached,

    /// Observation counts for this repository reached a configured soft or
    /// hard limit.
    #[msg("Repository reached maximum observation count.")]
    RepoObservationLimitReached,

    /// The repository key used for PDA derivation does not match the provided
    /// repository account.
    #[msg("Repository PDA does not match the provided repository key.")]
    RepoKeyMismatch,

    // -----------------------------------------------------------------------
    // Modules
    // -----------------------------------------------------------------------

    /// The module is marked as inactive and cannot be used for new actions.
    #[msg("Module is inactive.")]
    ModuleInactive,

    /// The requested module version does not exist.
    #[msg("Requested module version not found.")]
    ModuleVersionNotFound,

    /// The module version already exists and cannot be created again.
    #[msg("Module version already exists.")]
    ModuleVersionAlreadyExists,

    /// The module is not associated with the expected repository.
    #[msg("Module is not linked to the expected repository.")]
    ModuleRepoMismatch,

    /// Attempting to mutate a module that is marked as immutable or locked.
    #[msg("Module is immutable or locked.")]
    ModuleImmutable,

    // -----------------------------------------------------------------------
    // Forks
    // -----------------------------------------------------------------------

    /// The fork is marked as inactive and cannot be used in new flows.
    #[msg("Fork is inactive.")]
    ForkInactive,

    /// A fork cannot be created because the parent reference is invalid
    /// or does not exist.
    #[msg("Invalid or missing fork parent reference.")]
    InvalidForkParent,

    /// A fork cannot be created due to exceeding soft or hard fork limits.
    #[msg("Maximum number of forks has been reached.")]
    ForkLimitReached,

    /// The caller attempted to mutate a fork they do not own.
    #[msg("Only the fork owner can perform this action.")]
    InvalidForkOwner,

    // -----------------------------------------------------------------------
    // Metrics and Observations
    // -----------------------------------------------------------------------

    /// Observation data such as lines of code or files processed are beyond
    /// the configured maximum bounds.
    #[msg("Observation data exceeds configured limits.")]
    ObservationDataTooLarge,

    /// Observations are not allowed for an inactive or invalid target.
    #[msg("Observations are not allowed for this target.")]
    ObservationNotAllowed,

    /// Metrics cannot be updated because the data is inconsistent.
    #[msg("Metrics update is inconsistent with current state.")]
    MetricsInconsistent,

    // -----------------------------------------------------------------------
    // Metadata
    // -----------------------------------------------------------------------

    /// Metadata fields such as description or tags exceed their maximum bounds.
    #[msg("Metadata field exceeds maximum length.")]
    MetadataTooLong,

    /// Metadata is missing when required for this action.
    #[msg("Required metadata is missing.")]
    MetadataMissing,

    /// Metadata format is invalid or unsupported.
    #[msg("Metadata format is invalid or unsupported.")]
    MetadataInvalid,

    // -----------------------------------------------------------------------
    // Lifecycle / Upgrade / Migration
    // -----------------------------------------------------------------------

    /// The operation is not allowed in the current lifecycle phase.
    ///
    /// For example, if the program is in a "frozen" or "migration" state and
    /// only allows a subset of instructions.
    #[msg("Operation is not allowed in the current lifecycle state.")]
    InvalidLifecycleState,

    /// A migration or upgrade step is required before this instruction can
    /// be executed safely.
    #[msg("Migration is required before executing this instruction.")]
    MigrationRequired,

    /// A migration or upgrade step has already been applied and cannot be
    /// applied twice.
    #[msg("Migration step has already been applied.")]
    MigrationAlreadyApplied,

    // -----------------------------------------------------------------------
    // Access Pattern and Account Validation
    // -----------------------------------------------------------------------

    /// A required account was not provided to the instruction.
    #[msg("Required account is missing in the instruction context.")]
    MissingRequiredAccount,

    /// An account is not owned by the expected program.
    #[msg("Account is not owned by the expected program.")]
    InvalidAccountOwner,

    /// An account does not have the expected data layout or discriminator.
    #[msg("Account discriminator does not match expected type.")]
    InvalidAccountDiscriminator,

    /// A system account is required but a non-system account was provided.
    #[msg("Expected a system account, received a non-system account.")]
    ExpectedSystemAccount,

    /// A signer was expected but the provided account is not a signer.
    #[msg("Expected a signer account, but the account is not a signer.")]
    ExpectedSigner,

    /// A writable account was expected but a read-only account was provided.
    #[msg("Expected a writable account, but the account is read-only.")]
    ExpectedWritableAccount,

    // -----------------------------------------------------------------------
    // Rate Limits / Cooldowns (optional, for future extensions)
    // -----------------------------------------------------------------------

    /// The caller is attempting an action too frequently and must respect
    /// a cooldown period.
    #[msg("Action is being attempted too frequently; cooldown in effect.")]
    CooldownActive,

    /// A soft rate limit for a specific caller or resource has been reached.
    #[msg("Rate limit reached for this caller or resource.")]
    RateLimitReached,
}

/// Optional helper functions for constructing common errors programmatically.
///
/// These are not strictly necessary but can make handler code slightly cleaner
/// and more self-documenting.
impl Unit09Error {
    /// Convenience helper for creating a `StringTooLong` error.
    pub fn string_too_long() -> Error {
        Unit09Error::StringTooLong.into()
    }

    /// Convenience helper for creating an `InvalidAuthority` error.
    pub fn invalid_authority() -> Error {
        Unit09Error::InvalidAuthority.into()
    }

    /// Convenience helper for creating a `RepoInactive` error.
    pub fn repo_inactive() -> Error {
        Unit09Error::RepoInactive.into()
    }

    /// Convenience helper for creating a `ModuleInactive` error.
    pub fn module_inactive() -> Error {
        Unit09Error::ModuleInactive.into()
    }
}
