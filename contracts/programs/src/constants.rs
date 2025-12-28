//! ===========================================================================
//! Unit09 – Global Constants
//! Path: contracts/unit09-program/programs/unit09_program/src/constants.rs
//!
//! This module centralizes all compile-time constants used across the program:
//! - PDA seed strings
//! - Maximum string lengths for account fields
//! - Fee limits and schema versioning
//! - Misc protocol tuning parameters
//!
//! Keeping these values in a single place makes it easier to:
//! - Audit memory usage per account
//! - Evolve schemas in a controlled way
//! - Keep PDA derivations consistent
//! ===========================================================================

use anchor_lang::prelude::*;

// ---------------------------------------------------------------------------
// Program-wide versioning
// ---------------------------------------------------------------------------

/// Current schema version for all Unit09 accounts.
///
/// Bumping this value should be done whenever a breaking change is introduced
/// to the on-chain data layout. Off-chain indexers and dashboards can use
/// this to detect incompatible states.
pub const CURRENT_SCHEMA_VERSION: u8 = 1;

/// Maximum allowed fee in basis points (50%).
///
/// This does not mean the protocol uses this fee by default; it defines the
/// upper bound for configuration so a misconfigured admin cannot set extreme
/// values.
pub const MAX_FEE_BPS: u16 = 5_000;

/// Basis point denominator (100%).
pub const BPS_DENOMINATOR: u16 = 10_000;

// ---------------------------------------------------------------------------
// PDA Seeds
// ---------------------------------------------------------------------------

/// Seed used for the global configuration PDA.
pub const CONFIG_SEED: &str = "config";

/// Seed used for the global metrics PDA.
pub const METRICS_SEED: &str = "metrics";

/// Seed used for the global metadata PDA.
pub const GLOBAL_METADATA_SEED: &str = "global_metadata";

/// Seed used for repository PDAs.
pub const REPO_SEED: &str = "repo";

/// Seed used for module PDAs.
pub const MODULE_SEED: &str = "module";

/// Seed used for module version PDAs.
pub const MODULE_VERSION_SEED: &str = "module_version";

/// Seed used for fork PDAs (Unit09 variants).
pub const FORK_SEED: &str = "fork";

/// Seed used for authority PDAs, if you decide to store role-based authorities
/// on-chain instead of relying purely on external policy.
pub const AUTHORITY_SEED: &str = "authority";

/// Seed for lifecycle tracking PDA, if used by the deployment.
pub const LIFECYCLE_SEED: &str = "lifecycle";

// ---------------------------------------------------------------------------
// String Length Limits
// ---------------------------------------------------------------------------

/// Maximum length for human-readable names (module names, fork labels, etc.).
///
/// This value is used for:
/// - `Repo::name`
/// - `Module::name`
/// - `Fork::label`
pub const MAX_NAME_LEN: usize = 64;

/// Maximum length for repository URLs.
///
/// Example: GitHub / GitLab / self-hosted git URLs.
pub const MAX_URL_LEN: usize = 256;

/// Maximum length for metadata URIs.
///
/// Example: Arweave, IPFS, or any off-chain JSON manifest location.
pub const MAX_METADATA_URI_LEN: usize = 256;

/// Maximum length for a human-readable description.
///
/// Used by `GlobalMetadata::description` and any future description fields.
pub const MAX_DESCRIPTION_LEN: usize = 512;

/// Maximum length for comma-separated tags or keywords.
///
/// Example: `"solana,anchor,unit09,modules"`.
pub const MAX_TAGS_LEN: usize = 128;

/// Optional: maximum length for repository tags or classification labels.
pub const MAX_REPO_TAGS_LEN: usize = 128;

/// Optional: maximum length for a module category field.
pub const MAX_MODULE_CATEGORY_LEN: usize = 64;

// ---------------------------------------------------------------------------
// Numeric Limits and Safety Bounds
// ---------------------------------------------------------------------------

/// Maximum number of modules that can be associated with a single repository
/// before off-chain tooling is expected to shard or reorganize data.
pub const DEFAULT_MAX_MODULES_PER_REPO: u32 = 1_000;

/// Soft limit for how many forks can be created per deployment before
/// external tooling is expected to archive or prune inactive forks.
///
/// This is not enforced in the current on-chain logic by default, but is
/// provided as a guideline and can be used in future instructions.
pub const SOFT_MAX_FORKS: u32 = 10_000;

/// Default maximum observation count for a single repository before
/// dashboards may decide to roll over or aggregate historical data off-chain.
pub const SOFT_MAX_OBSERVATIONS_PER_REPO: u64 = 1_000_000;

/// Maximum lines of code that a single observation is expected to report.
///
/// This is a safety bound that can be used in validation logic if desired.
pub const MAX_LOC_PER_OBSERVATION: u64 = 10_000_000;

/// Maximum file count that a single observation is expected to report.
pub const MAX_FILES_PER_OBSERVATION: u32 = 100_000;

// ---------------------------------------------------------------------------
// Time and Slot Related Defaults
// ---------------------------------------------------------------------------

/// Expected average Solana slot time in milliseconds (approximate).
pub const APPROX_SLOT_DURATION_MS: u64 = 400;

/// Convenience constant: number of seconds per day.
pub const SECONDS_PER_DAY: i64 = 86_400;

/// Convenience constant: number of slots per day (approximate).
pub const SLOTS_PER_DAY_APPROX: u64 = (SECONDS_PER_DAY as u64 * 1_000) / APPROX_SLOT_DURATION_MS;

// ---------------------------------------------------------------------------
// Unit09-Specific Flavor Constants (purely semantic, not enforced on-chain)
// ---------------------------------------------------------------------------

/// Human-readable label for this protocol; useful for indexers and dashboards.
pub const PROTOCOL_NAME: &str = "Unit09";

/// Short phrase describing the core behavior of Unit09.
pub const PROTOCOL_TAGLINE: &str =
    "A story-driven on-chain AI raccoon that consumes code and produces modules.";


/// Default authority role label for the primary admin in off-chain tooling.
///
/// This does not affect on-chain behavior, but helps keep UI labels consistent.
pub const ROLE_LABEL_ADMIN: &str = "admin";

/// Default authority role label for maintainers.
pub const ROLE_LABEL_MAINTAINER: &str = "maintainer";

/// Default authority role label for observers / workers that record observations.
pub const ROLE_LABEL_OBSERVER: &str = "observer";

// ---------------------------------------------------------------------------
// Helper Functions (optional inline helpers around constants)
// ---------------------------------------------------------------------------

/// Convenience function for converting basis points into a floating point ratio.
///
/// This is not intended to be used in on-chain calculations (to avoid floating
/// point usage), but may be useful for off-chain Rust tooling that shares this
/// crate as a dependency.
///
/// For on-chain math, always use integer arithmetic.
pub fn bps_to_ratio(bps: u16) -> f64 {
    (bps as f64) / (BPS_DENOMINATOR as f64)
}

/// Validate that a string does not exceed a given maximum length.
///
/// This helper can be used by instruction handlers in addition to the
/// validation helpers provided in `utils::validators`.
pub fn assert_max_len(value: &str, max_len: usize) -> Result<()> {
    if value.len() > max_len {
        return err!(crate::errors::Unit09Error::StringTooLong);
    }
    Ok(())
}
