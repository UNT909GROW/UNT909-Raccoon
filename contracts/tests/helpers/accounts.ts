/**
 * ============================================================================
 * Unit09 – PDA / Accounts Helper
 * Path: contracts/unit09-program/tests/helpers/accounts.ts
 *
 * This module centralizes all PDA derivations and common account wiring used
 * across the Unit09 test suite.
 *
 * It mirrors the PDA layout defined in `programs/unit09_program/src/utils/seeds.rs`.
 *
 * Provided helpers:
 *   - Seed constants for every PDA
 *   - `find*Pda` functions returning `[PublicKey, bump]`
 *   - `get*Pda` functions returning only `PublicKey`
 *   - A convenience `deriveAllCorePdas` helper for quick setup
 *
 * This file is intended for test usage, but can also be reused by tooling or
 * off-chain services that need to derive the same PDAs.
 *
 * All comments and identifiers are in English only.
 * ============================================================================
 */

import { PublicKey } from "@solana/web3.js";
import type { Unit09ProgramClient } from "./provider";

// ============================================================================
// Seed constants (must match on-chain `seeds.rs`)
// ============================================================================

/**
 * Global seed for the Config account PDA.
 * On-chain: `b"config"`
 */
export const SEED_CONFIG = "config";

/**
 * Global seed for the Metrics account PDA.
 * On-chain: `b"metrics"`
 */
export const SEED_METRICS = "metrics";

/**
 * Global seed for the Lifecycle account PDA.
 * On-chain: `b"lifecycle"`
 */
export const SEED_LIFECYCLE = "lifecycle";

/**
 * Seed prefix for Repo accounts.
 * On-chain: `b"repo"`
 */
export const SEED_REPO = "repo";

/**
 * Seed prefix for Module accounts.
 * On-chain: `b"module"`
 */
export const SEED_MODULE = "module";

/**
 * Seed prefix for ModuleVersion accounts.
 * On-chain: `b"module_version"`
 */
export const SEED_MODULE_VERSION = "module_version";

/**
 * Seed prefix for Fork accounts.
 * On-chain: `b"fork"`
 */
export const SEED_FORK = "fork";

/**
 * Seed prefix for ModuleRepoLink accounts.
 * On-chain: `b"module_repo_link"`
 */
export const SEED_MODULE_REPO_LINK = "module_repo_link";

/**
 * Seed prefix for GlobalMetadata account.
 * On-chain: `b"global_metadata"`
 */
export const SEED_GLOBAL_METADATA = "global_metadata";

/**
 * Seed prefix for Authority accounts.
 * On-chain: `b"authority"`
 */
export const SEED_AUTHORITY = "authority";

// ============================================================================
// Helper: version tuple to byte seeds
// ============================================================================

/**
 * Convert a semantic version triple (u16, u16, u16) into LE byte arrays
 * used as part of the module version PDA seeds.
 *
 * On-chain: each component is serialized via `to_le_bytes()`.
 */
export function versionToSeedBytes(
  major: number,
  minor: number,
  patch: number
): [Uint8Array, Uint8Array, Uint8Array] {
  const bufMajor = new Uint8Array(2);
  const bufMinor = new Uint8Array(2);
  const bufPatch = new Uint8Array(2);

  const dvMajor = new DataView(bufMajor.buffer);
  const dvMinor = new DataView(bufMinor.buffer);
  const dvPatch = new DataView(bufPatch.buffer);

  dvMajor.setUint16(0, major, true);
  dvMinor.setUint16(0, minor, true);
  dvPatch.setUint16(0, patch, true);

  return [bufMajor, bufMinor, bufPatch];
}

// ============================================================================
// PDA derivation helpers
// ============================================================================

/**
 * Derive the Config PDA.
 * Seeds: `[b"config"]`
 */
export function findConfigPda(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from(SEED_CONFIG)], programId);
}

export function getConfigPda(programId: PublicKey): PublicKey {
  return findConfigPda(programId)[0];
}

/**
 * Derive the Metrics PDA.
 * Seeds: `[b"metrics"]`
 */
export function findMetricsPda(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from(SEED_METRICS)], programId);
}

export function getMetricsPda(programId: PublicKey): PublicKey {
  return findMetricsPda(programId)[0];
}

/**
 * Derive the Lifecycle PDA.
 * Seeds: `[b"lifecycle"]`
 */
export function findLifecyclePda(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from(SEED_LIFECYCLE)], programId);
}

export function getLifecyclePda(programId: PublicKey): PublicKey {
  return findLifecyclePda(programId)[0];
}

/**
 * Derive the Repo PDA.
 * Seeds: `[b"repo", repo_key]`
 */
export function findRepoPda(programId: PublicKey, repoKey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEED_REPO), repoKey.toBuffer()],
    programId
  );
}

export function getRepoPda(programId: PublicKey, repoKey: PublicKey): PublicKey {
  return findRepoPda(programId, repoKey)[0];
}

/**
 * Derive the Module PDA.
 * Seeds: `[b"module", module_key]`
 */
export function findModulePda(programId: PublicKey, moduleKey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEED_MODULE), moduleKey.toBuffer()],
    programId
  );
}

export function getModulePda(programId: PublicKey, moduleKey: PublicKey): PublicKey {
  return findModulePda(programId, moduleKey)[0];
}

/**
 * Derive the ModuleVersion PDA.
 * Seeds:
 *   [
 *     b"module_version",
 *     module_key,
 *     major.to_le_bytes(),
 *     minor.to_le_bytes(),
 *     patch.to_le_bytes(),
 *   ]
 */
export function findModuleVersionPda(
  programId: PublicKey,
  moduleKey: PublicKey,
  major: number,
  minor: number,
  patch: number
): [PublicKey, number] {
  const [majorBytes, minorBytes, patchBytes] = versionToSeedBytes(major, minor, patch);
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(SEED_MODULE_VERSION),
      moduleKey.toBuffer(),
      Buffer.from(majorBytes),
      Buffer.from(minorBytes),
      Buffer.from(patchBytes),
    ],
    programId
  );
}

export function getModuleVersionPda(
  programId: PublicKey,
  moduleKey: PublicKey,
  major: number,
  minor: number,
  patch: number
): PublicKey {
  return findModuleVersionPda(programId, moduleKey, major, minor, patch)[0];
}

/**
 * Derive the Fork PDA.
 * Seeds: `[b"fork", fork_key]`
 */
export function findForkPda(programId: PublicKey, forkKey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEED_FORK), forkKey.toBuffer()],
    programId
  );
}

export function getForkPda(programId: PublicKey, forkKey: PublicKey): PublicKey {
  return findForkPda(programId, forkKey)[0];
}

/**
 * Derive the ModuleRepoLink PDA.
 * Seeds: `[b"module_repo_link", module_key, repo_key]`
 */
export function findModuleRepoLinkPda(
  programId: PublicKey,
  moduleKey: PublicKey,
  repoKey: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEED_MODULE_REPO_LINK), moduleKey.toBuffer(), repoKey.toBuffer()],
    programId
  );
}

export function getModuleRepoLinkPda(
  programId: PublicKey,
  moduleKey: PublicKey,
  repoKey: PublicKey
): PublicKey {
  return findModuleRepoLinkPda(programId, moduleKey, repoKey)[0];
}

/**
 * Derive the GlobalMetadata PDA.
 * Seeds: `[b"global_metadata"]`
 */
export function findGlobalMetadataPda(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEED_GLOBAL_METADATA)],
    programId
  );
}

export function getGlobalMetadataPda(programId: PublicKey): PublicKey {
  return findGlobalMetadataPda(programId)[0];
}

/**
 * Derive the Authority PDA.
 * Seeds: `[b"authority", authority_pubkey]`
 */
export function findAuthorityPda(
  programId: PublicKey,
  authority: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEED_AUTHORITY), authority.toBuffer()],
    programId
  );
}

export function getAuthorityPda(programId: PublicKey, authority: PublicKey): PublicKey {
  return findAuthorityPda(programId, authority)[0];
}

// ============================================================================
// Bulk / convenience helpers
// ============================================================================

/**
 * Derive all core PDAs in one call, for quick test setup.
 *
 * The repo/module/fork/moduleVersion/moduleRepoLink fields are optional and
 * only derived when their corresponding keys (and version tuple) are provided.
 */
export interface CorePdasInput {
  programId: PublicKey;
  repoKey?: PublicKey;
  moduleKey?: PublicKey;
  forkKey?: PublicKey;
  moduleVersion?: {
    major: number;
    minor: number;
    patch: number;
  };
  moduleRepoLink?: {
    moduleKey: PublicKey;
    repoKey: PublicKey;
  };
  authorityKey?: PublicKey;
}

export interface CorePdasOutput {
  config: PublicKey;
  metrics: PublicKey;
  lifecycle: PublicKey;
  globalMetadata: PublicKey;
  repo?: PublicKey;
  module?: PublicKey;
  moduleVersion?: PublicKey;
  fork?: PublicKey;
  moduleRepoLink?: PublicKey;
  authority?: PublicKey;
}

/**
 * Derive a bundle of PDAs for a given program id and optional related keys.
 */
export function deriveAllCorePdas(input: CorePdasInput): CorePdasOutput {
  const { programId } = input;

  const config = getConfigPda(programId);
  const metrics = getMetricsPda(programId);
  const lifecycle = getLifecyclePda(programId);
  const globalMetadata = getGlobalMetadataPda(programId);

  let repo: PublicKey | undefined;
  let module: PublicKey | undefined;
  let moduleVersion: PublicKey | undefined;
  let fork: PublicKey | undefined;
  let moduleRepoLink: PublicKey | undefined;
  let authority: PublicKey | undefined;

  if (input.repoKey) {
    repo = getRepoPda(programId, input.repoKey);
  }

  if (input.moduleKey) {
    module = getModulePda(programId, input.moduleKey);
  }

  if (input.moduleKey && input.moduleVersion) {
    const { major, minor, patch } = input.moduleVersion;
    moduleVersion = getModuleVersionPda(programId, input.moduleKey, major, minor, patch);
  }

  if (input.forkKey) {
    fork = getForkPda(programId, input.forkKey);
  }

  if (input.moduleRepoLink) {
    moduleRepoLink = getModuleRepoLinkPda(
      programId,
      input.moduleRepoLink.moduleKey,
      input.moduleRepoLink.repoKey
    );
  }

  if (input.authorityKey) {
    authority = getAuthorityPda(programId, input.authorityKey);
  }

  return {
    config,
    metrics,
    lifecycle,
    globalMetadata,
    repo,
    module,
    moduleVersion,
    fork,
    moduleRepoLink,
    authority,
  };
}

// ============================================================================
// Light helper to build common account sets for instructions
// ============================================================================

/**
 * Accounts required by the `initialize` instruction, based on the common PDA
 * layout. This helper returns only program accounts; you still need to inject
 * signer accounts such as `admin` and `payer` in your tests.
 *
 * Example usage:
 *
 *   const pdas = deriveAllCorePdas({ programId: ctx.programId });
 *   await ctx.program.methods
 *     .initialize({...})
 *     .accounts({
 *       config: pdas.config,
 *       metrics: pdas.metrics,
 *       lifecycle: pdas.lifecycle,
 *       globalMetadata: pdas.globalMetadata,
 *       admin: ctx.wallet.publicKey,
 *       payer: ctx.wallet.publicKey,
 *       systemProgram: SystemProgram.programId,
 *     })
 *     .rpc();
 */
export function buildInitializePdaAccounts(programId: PublicKey): {
  config: PublicKey;
  metrics: PublicKey;
  lifecycle: PublicKey;
  globalMetadata: PublicKey;
} {
  const config = getConfigPda(programId);
  const metrics = getMetricsPda(programId);
  const lifecycle = getLifecyclePda(programId);
  const globalMetadata = getGlobalMetadataPda(programId);

  return {
    config,
    metrics,
    lifecycle,
    globalMetadata,
  };
}

/**
 * Small convenience helper to access the program id from a Unit09 program
 * client and derive all core PDAs from it.
 */
export function deriveAllCorePdasFromProgram(
  program: Unit09ProgramClient,
  extras?: Omit<CorePdasInput, "programId">
): CorePdasOutput {
  return deriveAllCorePdas({
    programId: program.programId,
    ...extras,
  });
}
