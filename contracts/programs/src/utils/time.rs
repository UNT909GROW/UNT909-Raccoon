//! ===========================================================================
//! Unit09 – Time Utilities
//! Path: contracts/unit09-program/programs/unit09_program/src/utils/time.rs
//!
//! This module provides small, reusable helpers around Solana timestamps.
//!
//! Goals:
//! - Keep all timestamp arithmetic explicit and well-documented
//! - Avoid sprinkling ad-hoc `unix_timestamp` math across the codebase
//! - Centralize common notions such as:
//!     * “age in seconds”
//!     * “is within window”
//!     * “has expired”
//!
//! All functions operate on i64 (the type used by `Clock::unix_timestamp`).
//!
//! ===========================================================================

use anchor_lang::prelude::*;

use crate::errors::Unit09Error;

/// Return the current Unix timestamp from the provided `Clock` reference.
///
/// This is a small wrapper to make the call site explicit and easy to mock.
pub fn now(clock: &Clock) -> i64 {
    clock.unix_timestamp
}

/// Compute the age (in seconds) of a given timestamp relative to `clock`.
///
/// - `created_at` is expected to be a Unix timestamp in seconds.
/// - If `created_at` is in the future, this returns 0 (no negative ages).
pub fn age_seconds(clock: &Clock, created_at: i64) -> i64 {
    let current = now(clock);
    if current <= created_at {
        0
    } else {
        current.saturating_sub(created_at)
    }
}

/// Check whether a given timestamp is within a rolling window of `window_secs`
/// seconds from `clock`.
///
/// Example usage:
/// - “has this repo been observed in the last 24 hours?”
/// - “is this metrics snapshot still considered fresh?”
///
/// Returns:
/// - `true` if `timestamp` is non-zero and `age <= window_secs`
/// - `false` otherwise
pub fn is_within_window(clock: &Clock, timestamp: i64, window_secs: i64) -> bool {
    if timestamp <= 0 || window_secs <= 0 {
        return false;
    }
    age_seconds(clock, timestamp) <= window_secs
}

/// Check whether a given timestamp is strictly older than `window_secs`
/// seconds relative to `clock`.
///
/// This is the logical opposite of `is_within_window` when `timestamp` is
/// non-zero and `window_secs > 0`.
pub fn is_older_than(clock: &Clock, timestamp: i64, window_secs: i64) -> bool {
    if timestamp <= 0 || window_secs <= 0 {
        return false;
    }
    age_seconds(clock, timestamp) > window_secs
}

/// Validate that a timestamp is not set in the far future.
///
/// This is useful when accepting timestamps from external sources (for
/// example, when reconciling metrics or importing snapshots).
///
/// `max_drift_secs` defines how far into the future we are willing to accept
/// a timestamp relative to the current `clock`. Any value beyond this drift
/// is treated as invalid.
///
/// Returns `Unit09Error::TimestampInFuture` on failure.
pub fn assert_not_far_future(clock: &Clock, ts: i64, max_drift_secs: i64) -> Result<()> {
    if ts <= 0 || max_drift_secs <= 0 {
        return Ok(());
    }

    let current = now(clock);
    let allowed_future = current.saturating_add(max_drift_secs);
    require!(ts <= allowed_future, Unit09Error::TimestampInFuture);

    Ok(())
}

/// Validate that `from_ts <= to_ts`.
///
/// This is a simple ordering check used when validating ranges such as
/// “from / to” filters on observation windows or lifecycle intervals.
pub fn assert_time_order(from_ts: i64, to_ts: i64) -> Result<()> {
    require!(from_ts <= to_ts, Unit09Error::InvalidTimeRange);
    Ok(())
}

/// Return the minimum of two timestamps, preserving a non-zero semantic:
///
/// - If both are > 0, the smaller one is returned.
/// - If exactly one is > 0, that one is returned.
/// - If both are <= 0, 0 is returned.
///
/// This is useful when aggregating “first seen” style values where
/// some accounts may not yet have a valid timestamp.
pub fn min_non_zero(a: i64, b: i64) -> i64 {
    match (a > 0, b > 0) {
        (true, true) => a.min(b),
        (true, false) => a,
        (false, true) => b,
        (false, false) => 0,
    }
}

/// Return the maximum of two timestamps, preserving a non-zero semantic:
///
/// - If both are > 0, the larger one is returned.
/// - If exactly one is > 0, that one is returned.
/// - If both are <= 0, 0 is returned.
///
/// This is useful when aggregating “last seen” style values.
pub fn max_non_zero(a: i64, b: i64) -> i64 {
    match (a > 0, b > 0) {
        (true, true) => a.max(b),
        (true, false) => a,
        (false, true) => b,
        (false, false) => 0,
    }
}

/// Clamp a timestamp into the range `[0, current]`.
///
/// This is a defensive helper used when reconciling imported timestamps
/// from off-chain sources.
///
/// - If `ts < 0`, returns 0.
/// - If `ts > current`, returns `current`.
/// - Otherwise returns `ts`.
pub fn clamp_to_past(clock: &Clock, ts: i64) -> i64 {
    let current = now(clock);
    if ts <= 0 {
        0
    } else if ts > current {
        current
    } else {
        ts
    }
}

/// Add a signed offset (in seconds) to a timestamp, with saturation.
///
/// This protects against overflow and underflow when performing operations
/// such as “ts + window_secs”.
pub fn add_offset_saturating(ts: i64, offset_secs: i64) -> i64 {
    ts.saturating_add(offset_secs)
}
