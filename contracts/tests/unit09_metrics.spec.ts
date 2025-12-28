/**
 * ============================================================================
 * Unit09 – Metrics Integration Tests
 * Path: contracts/unit09-program/tests/unit09_metrics.spec.ts
 *
 * This file focuses on the global Metrics account behavior:
 *   - Initial metrics state right after initialization
 *   - Updating metrics via the `recordMetrics` instruction
 *   - Ensuring null fields do not overwrite existing counters
 *   - Verifying that repo / module / fork flows affect metrics in a
 *     consistent and monotonic way
 *   - Checking that the combination of manual `recordMetrics` and
 *     event-driven increments results in sane global totals
 *
 * It relies on helpers from:
 *   - tests/helpers/provider.ts
 *   - tests/helpers/accounts.ts
 *   - tests/helpers/builders.ts
 *   - tests/helpers/assertions.ts
 *
 * All content is written in English only.
 * ============================================================================
 */

import { SystemProgram, Keypair, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

import { createUnit09TestContext } from "./helpers/provider";
import {
  deriveAllCorePdasFromProgram,
} from "./helpers/accounts";
import {
  BuildInitializeArgsOptions,
  buildInitializeArgs,
  buildRegisterRepoArgs,
  buildRegisterModuleArgs,
  buildCreateForkArgs,
  buildRecordMetricsArgs,
  createRepoOnChain,
  createModuleOnChain,
  createForkOnChain,
  initializeUnit09OnChain,
} from "./helpers/builders";
import {
  assertMetrics,
  expectBnEquals,
  expectDefined,
} from "./helpers/assertions";

// Increase timeout for CI or slow RPCs
jest.setTimeout(120_000);

// Shared test context
const ctx = createUnit09TestContext();

describe("unit09_program – metrics", () => {
  const initOptions: BuildInitializeArgsOptions = {
    feeBps: 250,
    maxModulesPerRepo: 256,
  };

  beforeAll(async () => {
    // Ensure payer is funded
    await ctx.ensurePayerHasFunds(2 * 1_000_000_000); // 2 SOL

    const program = ctx.program;
    const { config } = deriveAllCorePdasFromProgram(program);

    // Initialize program if needed
    let needsInit = false;
    try {
      await program.account.config.fetch(config);
    } catch {
      needsInit = true;
    }

    if (needsInit) {
      const initArgs = buildInitializeArgs({
        ...initOptions,
        admin: ctx.wallet.publicKey,
      });

      const pdas = deriveAllCorePdasFromProgram(program);

      await program.methods
        .initialize(initArgs)
        .accounts({
          config: pdas.config,
          metrics: pdas.metrics,
          lifecycle: pdas.lifecycle,
          globalMetadata: pdas.globalMetadata,
          admin: ctx.wallet.publicKey,
          payer: ctx.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    }
  });

  it("starts with zeroed metrics right after initialization", async () => {
    const program = ctx.program;
    const pdas = deriveAllCorePdasFromProgram(program);
    const metricsAcc = await program.account.metrics.fetch(pdas.metrics);

    assertMetrics(
      { pubkey: pdas.metrics, data: metricsAcc },
      {
        totalRepos: BigInt(0),
        totalModules: BigInt(0),
        totalForks: BigInt(0),
        totalObservations: BigInt(0),
        totalLinesOfCode: BigInt(0),
        totalFilesProcessed: BigInt(0),
      }
    );

    expect(metricsAcc.totalRepos instanceof BN).toBe(true);
    expect(metricsAcc.totalModules instanceof BN).toBe(true);
    expect(metricsAcc.totalForks instanceof BN).toBe(true);
    expect(metricsAcc.totalObservations instanceof BN).toBe(true);
    expect(metricsAcc.totalLinesOfCode instanceof BN).toBe(true);
    expect(metricsAcc.totalFilesProcessed instanceof BN).toBe(true);
  });

  it("increases counters as repos, modules, and forks are created", async () => {
    const program = ctx.program;

    const pdasBefore = deriveAllCorePdasFromProgram(program);
    const metricsBefore = await program.account.metrics.fetch(pdasBefore.metrics);

    // Create one repo, one module, one fork through high-level helpers
    const repoResult = await createRepoOnChain(ctx, {
      name: "unit09-metrics-repo",
      tags: "unit09,metrics,repo",
    });

    const moduleResult = await createModuleOnChain(ctx, {
      repoKey: repoResult.repoKey,
      name: "unit09-metrics-module",
      category: "unit09-metrics",
      tags: "unit09,module,metrics",
    });

    const forkResult = await createForkOnChain(ctx, {
      label: "unit09-metrics-fork",
      isRoot: true,
      depth: 0,
      tags: "unit09,fork,metrics",
    });

    // Silence unused variable warnings
    void moduleResult;
    void forkResult;

    const pdasAfter = deriveAllCorePdasFromProgram(program);
    const metricsAfter = await program.account.metrics.fetch(pdasAfter.metrics);

    // Expect monotonic increases for totalRepos and totalModules and totalForks
    expect(metricsAfter.totalRepos.gte(metricsBefore.totalRepos)).toBe(true);
    expect(metricsAfter.totalModules.gte(metricsBefore.totalModules)).toBe(true);
    expect(metricsAfter.totalForks.gte(metricsBefore.totalForks)).toBe(true);

    // Expect non-negative values in all fields
    const fields: Array<[string, BN]> = [
      ["totalRepos", metricsAfter.totalRepos],
      ["totalModules", metricsAfter.totalModules],
      ["totalForks", metricsAfter.totalForks],
      ["totalObservations", metricsAfter.totalObservations],
      ["totalLinesOfCode", metricsAfter.totalLinesOfCode],
      ["totalFilesProcessed", metricsAfter.totalFilesProcessed],
    ];

    for (const [label, value] of fields) {
      expect(value.gte(new BN(0))).toBe(true);
    }
  });

  it("honors explicit overrides via recordMetrics when fields are non-null", async () => {
    const program = ctx.program;

    const pdasBefore = deriveAllCorePdasFromProgram(program);
    const metricsBefore = await program.account.metrics.fetch(pdasBefore.metrics);

    // Build specific metrics values we want to enforce
    const targetTotals = {
      totalRepos: BigInt(10),
      totalModules: BigInt(20),
      totalForks: BigInt(30),
      totalObservations: BigInt(40),
      totalLinesOfCode: BigInt(123456),
      totalFilesProcessed: BigInt(789),
    };

    const args = buildRecordMetricsArgs({
      totalRepos: targetTotals.totalRepos,
      totalModules: targetTotals.totalModules,
      totalForks: targetTotals.totalForks,
      totalObservations: targetTotals.totalObservations,
      totalLinesOfCode: targetTotals.totalLinesOfCode,
      totalFilesProcessed: targetTotals.totalFilesProcessed,
    });

    const tx = await program.methods
      .recordMetrics(args)
      .accounts({
        config: pdasBefore.config,
        metrics: pdasBefore.metrics,
        authority: ctx.wallet.publicKey,
      })
      .rpc();

    expect(tx).toBeTruthy();

    const pdasAfter = deriveAllCorePdasFromProgram(program);
    const metricsAfter = await program.account.metrics.fetch(pdasAfter.metrics);

    // Check each field was overwritten by explicit args
    assertMetrics(
      { pubkey: pdasAfter.metrics, data: metricsAfter },
      {
        totalRepos: targetTotals.totalRepos,
        totalModules: targetTotals.totalModules,
        totalForks: targetTotals.totalForks,
        totalObservations: targetTotals.totalObservations,
        totalLinesOfCode: targetTotals.totalLinesOfCode,
        totalFilesProcessed: targetTotals.totalFilesProcessed,
      }
    );
  });

  it("ignores null fields when calling recordMetrics (partial update)", async () => {
    const program = ctx.program;

    const pdasBefore = deriveAllCorePdasFromProgram(program);
    const metricsBefore = await program.account.metrics.fetch(pdasBefore.metrics);

    // We will only update totalRepos and totalModules, leaving others null
    const args = buildRecordMetricsArgs({
      totalRepos: metricsBefore.totalRepos.toBigInt() + BigInt(1),
      totalModules: metricsBefore.totalModules.toBigInt() + BigInt(2),
      totalForks: null,
      totalObservations: null,
      totalLinesOfCode: null,
      totalFilesProcessed: null,
    });

    const tx = await program.methods
      .recordMetrics(args)
      .accounts({
        config: pdasBefore.config,
        metrics: pdasBefore.metrics,
        authority: ctx.wallet.publicKey,
      })
      .rpc();

    expect(tx).toBeTruthy();

    const pdasAfter = deriveAllCorePdasFromProgram(program);
    const metricsAfter = await program.account.metrics.fetch(pdasAfter.metrics);

    // totalRepos and totalModules should match new values
    expectBnEquals(
      metricsAfter.totalRepos as unknown as BN,
      args.totalRepos as bigint,
      "metrics.totalRepos"
    );
    expectBnEquals(
      metricsAfter.totalModules as unknown as BN,
      args.totalModules as bigint,
      "metrics.totalModules"
    );

    // Other fields should remain unchanged
    expectBnEquals(
      metricsAfter.totalForks as unknown as BN,
      metricsBefore.totalForks.toBigInt(),
      "metrics.totalForks"
    );
    expectBnEquals(
      metricsAfter.totalObservations as unknown as BN,
      metricsBefore.totalObservations.toBigInt(),
      "metrics.totalObservations"
    );
    expectBnEquals(
      metricsAfter.totalLinesOfCode as unknown as BN,
      metricsBefore.totalLinesOfCode.toBigInt(),
      "metrics.totalLinesOfCode"
    );
    expectBnEquals(
      metricsAfter.totalFilesProcessed as unknown as BN,
      metricsBefore.totalFilesProcessed.toBigInt(),
      "metrics.totalFilesProcessed"
    );
  });

  it("remains consistent when additional repos/modules/forks are created after manual metrics updates", async () => {
    const program = ctx.program;

    const pdasBefore = deriveAllCorePdasFromProgram(program);
    const metricsBefore = await program.account.metrics.fetch(pdasBefore.metrics);

    // Create a small batch of repos, modules, and forks
    const repoKeys: PublicKey[] = [];
    for (let i = 0; i < 2; i++) {
      const repoRes = await createRepoOnChain(ctx, {
        name: `unit09-metrics-batch-repo-${i}`,
        tags: `unit09,metrics,batch,repo-${i}`,
      });
      repoKeys.push(repoRes.repoKey);
    }

    for (const repoKey of repoKeys) {
      // For each repo, create 2 modules
      for (let j = 0; j < 2; j++) {
        await createModuleOnChain(ctx, {
          repoKey,
          name: `unit09-metrics-batch-module-${j}`,
        });
      }
    }

    // And some forks
    for (let k = 0; k < 3; k++) {
      await createForkOnChain(ctx, {
        label: `unit09-metrics-batch-fork-${k}`,
        isRoot: true,
        depth: 0,
      });
    }

    const pdasAfter = deriveAllCorePdasFromProgram(program);
    const metricsAfter = await program.account.metrics.fetch(pdasAfter.metrics);

    // Ensure new state is not smaller than previous state
    expect(metricsAfter.totalRepos.gte(metricsBefore.totalRepos)).toBe(true);
    expect(metricsAfter.totalModules.gte(metricsBefore.totalModules)).toBe(true);
    expect(metricsAfter.totalForks.gte(metricsBefore.totalForks)).toBe(true);

    // Sanity: at least some non-zero totals should be visible
    expect(metricsAfter.totalRepos.gt(new BN(0))).toBe(true);
    expect(metricsAfter.totalModules.gt(new BN(0))).toBe(true);
    expect(metricsAfter.totalForks.gt(new BN(0))).toBe(true);
  });

  it("supports multiple sequential recordMetrics calls without breaking monotonic guarantees when using max-like logic", async () => {
    const program = ctx.program;

    const pdas = deriveAllCorePdasFromProgram(program);
    const metricsInitial = await program.account.metrics.fetch(pdas.metrics);

    // First manual override
    const firstArgs = buildRecordMetricsArgs({
      totalRepos: metricsInitial.totalRepos.toBigInt() + BigInt(5),
      totalModules: metricsInitial.totalModules.toBigInt() + BigInt(10),
      totalForks: metricsInitial.totalForks.toBigInt() + BigInt(15),
      totalObservations: metricsInitial.totalObservations.toBigInt() + BigInt(1),
      totalLinesOfCode: metricsInitial.totalLinesOfCode.toBigInt() + BigInt(1000),
      totalFilesProcessed: metricsInitial.totalFilesProcessed.toBigInt() + BigInt(50),
    });

    await program.methods
      .recordMetrics(firstArgs)
      .accounts({
        config: pdas.config,
        metrics: pdas.metrics,
        authority: ctx.wallet.publicKey,
      })
      .rpc();

    const metricsAfterFirst = await program.account.metrics.fetch(pdas.metrics);

    // Second manual override with smaller values on some fields,
    // to verify that the on-chain logic can choose to preserve the max.
    const secondArgs = buildRecordMetricsArgs({
      totalRepos: metricsAfterFirst.totalRepos.toBigInt() - BigInt(3), // smaller
      totalModules: metricsAfterFirst.totalModules.toBigInt() + BigInt(1), // larger
      // others left null to avoid overwrite
      totalForks: null,
      totalObservations: null,
      totalLinesOfCode: null,
      totalFilesProcessed: null,
    });

    await program.methods
      .recordMetrics(secondArgs)
      .accounts({
        config: pdas.config,
        metrics: pdas.metrics,
        authority: ctx.wallet.publicKey,
      })
      .rpc();

    const metricsAfterSecond = await program.account.metrics.fetch(pdas.metrics);

    // We expect totalRepos to be >= previous totalRepos if logic keeps max.
    expect(metricsAfterSecond.totalRepos.gte(metricsAfterFirst.totalRepos)).toBe(true);
    // totalModules should be >= previous totalModules.
    expect(metricsAfterSecond.totalModules.gte(metricsAfterFirst.totalModules)).toBe(true);
  });

  it("exposes structured metrics fields for external dashboards or analytics", async () => {
    const program = ctx.program;

    const pdas = deriveAllCorePdasFromProgram(program);
    const metricsAcc = await program.account.metrics.fetch(pdas.metrics);

    // For dashboard use cases we mainly care about type safety and presence.
    expectDefined(metricsAcc.totalRepos, "metrics.totalRepos");
    expectDefined(metricsAcc.totalModules, "metrics.totalModules");
    expectDefined(metricsAcc.totalForks, "metrics.totalForks");
    expectDefined(metricsAcc.totalObservations, "metrics.totalObservations");
    expectDefined(metricsAcc.totalLinesOfCode, "metrics.totalLinesOfCode");
    expectDefined(metricsAcc.totalFilesProcessed, "metrics.totalFilesProcessed");

    // Spot check they can be converted to plain numbers within safe range
    const safeTotals = {
      repos: Number(metricsAcc.totalRepos.toString()),
      modules: Number(metricsAcc.totalModules.toString()),
      forks: Number(metricsAcc.totalForks.toString()),
    };

    expect(Number.isFinite(safeTotals.repos)).toBe(true);
    expect(Number.isFinite(safeTotals.modules)).toBe(true);
    expect(Number.isFinite(safeTotals.forks)).toBe(true);
  });
});
