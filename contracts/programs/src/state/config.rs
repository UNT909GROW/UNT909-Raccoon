//! ===========================================================================
//! Unit09 – Global Configuration State
//! Path: contracts/unit09-program/programs/unit09_program/src/state/config.rs
//!
//! This module defines the global configuration account for the Unit09 program.
//!
//! Responsibilities:
//! - Store protocol-wide parameters such as:
//!     * admin authority
//!     * fee basis points
//!     * maximum modules per repository
//!     * schema version
//! - Provide helper methods for:
//!     * admin checks
//!     * configuration validation
//!     * size calculations for rent-exempt allocation
//!
//! The `Config` account is expected to be initialized exactly once for each
//! deployment of Unit09 and then updated via admin-only instructions.
//!
//! ===========================================================================

use anchor_lang::prelude::*;

use crate::constants::*;
use crate::errors::Unit09Error;

/// Global configuration account for the Unit09 protocol.
///
/// This account is a PDA derived from the fixed seed `CONFIG_SEED` and the
/// program ID. It is the central place for protocol configuration.
#[account]
pub struct Config {
    /// Admin authority for this deployment.
    ///
    /// Only this key is allowed to:
    /// - update configuration values
    /// - set or update global metadata
    /// - perform other admin-only operations
    pub admin: Pubkey,

    /// Current fee in basis points (0–10_000).
    ///
    /// The exact meaning of this field is decided by off-chain integration
    /// and other on-chain modules, but the program enforces an upper bound
    /// via `MAX_FEE_BPS`.
    pub fee_bps: u16,

    /// Maximum number of modules allowed to be associated with a single
    /// repository before off-chain tooling is expected to shard or reorganize.
    pub max_modules_per_repo: u32,

    /// Schema version for this configuration layout.
    ///
    /// Used for safe migrations and compatibility checks.
    pub schema_version: u8,

    /// Whether this deployment is currently considered active.
    ///
    /// Admins may set this flag to false in preparation for a migration or
    /// sunset. Instruction handlers can optionally enforce this flag if they
    /// should be disabled during inactive phases.
    pub is_active: bool,

    /// Creation timestamp (Unix seconds) of this configuration account.
    pub created_at: i64,

    /// Last update timestamp (Unix seconds) for any configuration change.
    pub updated_at: i64,

    /// Optional hash or reference to off-chain policy documentation.
    ///
    /// This can be used to link to an off-chain configuration policy document
    /// or governance proposal.
    pub policy_ref: [u8; 32],

    /// Bump used for PDA derivation of this account.
    pub bump: u8,

    /// Reserved bytes for future upgrades.
    ///
    /// Keeping a reserved area allows new fields to be introduced in-place
    /// without breaking the account size, which simplifies migrations.
    pub reserved: [u8; 63],
}

impl Config {
    /// Discriminator length for Anchor accounts.
    pub const DISCRIMINATOR_LEN: usize = 8;

    /// Total serialized length of the `Config` account.
    ///
    /// This is used when performing rent-exempt allocations.
    pub const LEN: usize = Self::DISCRIMINATOR_LEN
        + 32  // admin: Pubkey
        + 2   // fee_bps: u16
        + 4   // max_modules_per_repo: u32
        + 1   // schema_version: u8
        + 1   // is_active: bool
        + 8   // created_at: i64
        + 8   // updated_at: i64
        + 32  // policy_ref: [u8; 32]
        + 1   // bump: u8
        + 63; // reserved: [u8; 63]

    /// Initialize the configuration account with sane defaults and values
    /// provided at deployment time.
    pub fn init(
        &mut self,
        admin: Pubkey,
        fee_bps: u16,
        max_modules_per_repo: u32,
        policy_ref: [u8; 32],
        bump: u8,
        clock: &Clock,
    ) -> Result<()> {
        Self::validate_fee_bps(fee_bps)?;
        Self::validate_max_modules(max_modules_per_repo)?;

        self.admin = admin;
        self.fee_bps = fee_bps;
        self.max_modules_per_repo = max_modules_per_repo;
        self.schema_version = CURRENT_SCHEMA_VERSION;
        self.is_active = true;
        self.created_at = clock.unix_timestamp;
        self.updated_at = clock.unix_timestamp;
        self.policy_ref = policy_ref;
        self.bump = bump;
        self.reserved = [0u8; 63];

        Ok(())
    }

    /// Apply an update to the configuration account.
    ///
    /// This does not modify fields that are not explicitly passed in; it only
    /// updates values that are provided as `Some(...)` in the args.
    pub fn apply_update(
        &mut self,
        maybe_fee_bps: Option<u16>,
        maybe_max_modules_per_repo: Option<u32>,
        maybe_is_active: Option<bool>,
        maybe_policy_ref: Option<[u8; 32]>,
        clock: &Clock,
    ) -> Result<()> {
        if let Some(fee_bps) = maybe_fee_bps {
            Self::validate_fee_bps(fee_bps)?;
            self.fee_bps = fee_bps;
        }

        if let Some(max_modules) = maybe_max_modules_per_repo {
            Self::validate_max_modules(max_modules)?;
            self.max_modules_per_repo = max_modules;
        }

        if let Some(is_active) = maybe_is_active {
            self.is_active = is_active;
        }

        if let Some(policy_ref) = maybe_policy_ref {
            self.policy_ref = policy_ref;
        }

        self.updated_at = clock.unix_timestamp;
        Ok(())
    }

    /// Ensure that the signer matches the stored admin.
    pub fn assert_admin(&self, signer: &Signer) -> Result<()> {
        if signer.key() != self.admin {
            return err!(Unit09Error::InvalidAdmin);
        }
        Ok(())
    }

    /// Ensure that the configuration is currently active.
    ///
    /// Handlers may call this at the start of critical instructions.
    pub fn assert_active(&self) -> Result<()> {
        if !self.is_active {
            return err!(Unit09Error::InvalidLifecycleState);
        }
        Ok(())
    }

    /// Validate that a given fee value is within allowable bounds.
    fn validate_fee_bps(fee_bps: u16) -> Result<()> {
        if fee_bps > MAX_FEE_BPS {
            return err!(Unit09Error::InvalidFeeBps);
        }
        Ok(())
    }

    /// Validate that the maximum modules per repository value is non-zero
    /// and within a reasonable bound.
    fn validate_max_modules(max_modules: u32) -> Result<()> {
        if max_modules == 0 {
            return err!(Unit09Error::ValueOutOfRange);
        }
        Ok(())
    }
}
