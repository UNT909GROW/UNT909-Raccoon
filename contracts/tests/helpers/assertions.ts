/**
 * ============================================================================
 * Unit09 – Assertion Helpers
 * Path: contracts/unit09-program/tests/helpers/assertions.ts
 *
 * This module provides structured assertion helpers used across the Unit09 test
 * suite. Instead of scattering raw Jest assertions everywhere, these helpers
 * provide semantic checks for:
 *
 *   - Config account expectations
 *   - Repo state correctness
 *   - Module state correctness
 *   - ModuleVersion snapshot correctness
 *   - Fork entity state
 *   - Metrics and lifecycle counters
 *
 * Helpers follow a strict "assert or throw" principle: failure means a mismatch
 * in state. All content is written in English only.
 * ============================================================================
 */

import { BN } from "@coral-xyz/anchor";
import type {
  ConfigAccount,
  RepoAccount,
  ModuleAccount,
  ModuleVersionAccount,
  ForkAccount,
  MetricsAccount,
  LifecycleAccount,
  SemanticVersionTuple,
} from "../../../idl/types";

import type { AccountInfoWithPubkey } from "./provider";

// ============================================================================
// Generic helpers
// ============================================================================

/**
 * Expect that a value is defined (not null or undefined).
 */
export function expectDefined<T>(value: T | null | undefined, label: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`Assertion failed – expected defined value for ${label}`);
  }
}

/**
 * Expect that a boolean value is true.
 */
export function expectTrue(cond: boolean, label: string): void {
  if (!cond) {
    throw new Error(`Assertion failed – expected true for ${label}`);
  }
}

/**
 * Expect BN == bigint or == number.
 */
export function expectBnEquals(actual: BN, expected: bigint | number, label: string): void {
  const expBig = typeof expected === "number" ? BigInt(expected) : expected;
  if (actual.toString() !== expBig.toString()) {
    throw new Error(
      `Assertion failed – expected ${label} = ${expBig} but got ${actual.toString()}`
    );
  }
}

/**
 * Expect two semantic version tuples match.
 */
export function expectVersionEquals(
  version: SemanticVersionTuple,
  expected: SemanticVersionTuple,
  label: string
): void {
  const [aMaj, aMin, aPat] = version;
  const [eMaj, eMin, ePat] = expected;
  if (aMaj !== eMaj || aMin !== eMin || aPat !== ePat) {
    throw new Error(
      `Assertion failed – expected ${label} version = ${eMaj}.${eMin}.${ePat} but got ${aMaj}.${aMin}.${aPat}`
    );
  }
}

// ============================================================================
// Config
// ============================================================================

/**
 * Assert core fields of a ConfigAccount match expected values.
 */
export function assertConfig(
  acc: AccountInfoWithPubkey<ConfigAccount>,
  expected: Partial<ConfigAccount>
): void {
  expectDefined(acc, "config");
  if (expected.admin && acc.data.admin !== expected.admin) {
    throw new Error(`Expected config.admin = ${expected.admin} but got ${acc.data.admin}`);
  }
  if (expected.feeBps !== undefined && acc.data.feeBps !== expected.feeBps) {
    throw new Error(`Expected feeBps = ${expected.feeBps} but got ${acc.data.feeBps}`);
  }
  if (
    expected.maxModulesPerRepo !== undefined &&
    acc.data.maxModulesPerRepo !== expected.maxModulesPerRepo
  ) {
    throw new Error(
      `Expected maxModulesPerRepo = ${expected.maxModulesPerRepo} but got ${acc.data.maxModulesPerRepo}`
    );
  }
}

// ============================================================================
// Repo
// ============================================================================

export function assertRepo(
  acc: AccountInfoWithPubkey<RepoAccount>,
  expected: Partial<RepoAccount>
): void {
  expectDefined(acc, "repo");
  if (expected.name && acc.data.name !== expected.name) {
    throw new Error(`Expected repo.name = ${expected.name} but got ${acc.data.name}`);
  }
  if (expected.url && acc.data.url !== expected.url) {
    throw new Error(`Expected repo.url = ${expected.url} but got ${acc.data.url}`);
  }
  if (expected.isActive !== undefined && acc.data.isActive !== expected.isActive) {
    throw new Error(`Expected repo.isActive = ${expected.isActive} but got ${acc.data.isActive}`);
  }
  if (
    expected.allowObservation !== undefined &&
    acc.data.allowObservation !== expected.allowObservation
  ) {
    throw new Error(
      `Expected repo.allowObservation = ${expected.allowObservation} but got ${acc.data.allowObservation}`
    );
  }
}

// ============================================================================
// Module
// ============================================================================

export function assertModule(
  acc: AccountInfoWithPubkey<ModuleAccount>,
  expected: Partial<ModuleAccount>
): void {
  expectDefined(acc, "module");
  if (expected.name && acc.data.name !== expected.name) {
    throw new Error(`Expected module.name = ${expected.name} but got ${acc.data.name}`);
  }
  if (expected.category && acc.data.category !== expected.category) {
    throw new Error(`Expected module.category = ${expected.category} but got ${acc.data.category}`);
  }
  if (expected.isActive !== undefined && acc.data.isActive !== expected.isActive) {
    throw new Error(
      `Expected module.isActive = ${expected.isActive} but got ${acc.data.isActive}`
    );
  }
}

// ============================================================================
// ModuleVersion snapshot
// ============================================================================

export function assertModuleVersion(
  acc: AccountInfoWithPubkey<ModuleVersionAccount>,
  expected: Partial<ModuleVersionAccount>
): void {
  expectDefined(acc, "moduleVersion");
  if (expected.isStable !== undefined && acc.data.isStable !== expected.isStable) {
    throw new Error(
      `Expected moduleVersion.isStable = ${expected.isStable} but got ${acc.data.isStable}`
    );
  }
  if (expected.version) {
    expectVersionEquals(acc.data.version, expected.version, "moduleVersion");
  }
  if (expected.versionLabel && acc.data.versionLabel !== expected.versionLabel) {
    throw new Error(
      `Expected moduleVersion.versionLabel = ${expected.versionLabel} but got ${acc.data.versionLabel}`
    );
  }
}

// ============================================================================
// Fork entity
// ============================================================================

export function assertFork(
  acc: AccountInfoWithPubkey<ForkAccount>,
  expected: Partial<ForkAccount>
): void {
  expectDefined(acc, "fork");
  if (expected.label && acc.data.label !== expected.label) {
    throw new Error(`Expected fork.label = ${expected.label} but got ${acc.data.label}`);
  }
  if (expected.isActive !== undefined && acc.data.isActive !== expected.isActive) {
    throw new Error(`Expected fork.isActive = ${expected.isActive} but got ${acc.data.isActive}`);
  }
  if (expected.depth !== undefined && acc.data.depth !== expected.depth) {
    throw new Error(`Expected fork.depth = ${expected.depth} but got ${acc.data.depth}`);
  }
}

// ============================================================================
// Metrics
// ============================================================================

export function assertMetrics(
  acc: AccountInfoWithPubkey<MetricsAccount>,
  expected: Partial<MetricsAccount>
): void {
  expectDefined(acc, "metrics");

  const mapFields: Array<[keyof MetricsAccount, keyof Partial<MetricsAccount>]> = [
    ["totalRepos", "totalRepos"],
    ["totalModules", "totalModules"],
    ["totalForks", "totalForks"],
    ["totalObservations", "totalObservations"],
    ["totalLinesOfCode", "totalLinesOfCode"],
    ["totalFilesProcessed", "totalFilesProcessed"],
  ];

  for (const [actualField, expectedField] of mapFields) {
    const v = expected[expectedField];
    if (v !== undefined && v !== null) {
      expectBnEquals(
        acc.data[actualField] as unknown as BN,
        v as unknown as bigint,
        `metrics.${String(actualField)}`
      );
    }
  }
}

// ============================================================================
// Lifecycle
// ============================================================================

export function assertLifecycle(
  acc: AccountInfoWithPubkey<LifecycleAccount>,
  expected: Partial<LifecycleAccount>
): void {
  expectDefined(acc, "lifecycle");

  if (expected.createdAt !== undefined) {
    if (acc.data.createdAt !== expected.createdAt) {
      throw new Error(
        `Expected lifecycle.createdAt = ${expected.createdAt} but got ${acc.data.createdAt}`
      );
    }
  }

  if (expected.lastActivityAt !== undefined) {
    if (acc.data.lastActivityAt !== expected.lastActivityAt) {
      throw new Error(
        `Expected lifecycle.lastActivityAt = ${expected.lastActivityAt} but got ${acc.data.lastActivityAt}`
      );
    }
  }
}
