/**
 * ============================================================================
 * Unit09 – Initialization Integration Tests
 * Path: contracts/unit09-program/tests/unit09_init.spec.ts
 *
 * This file verifies that the `initialize` instruction:
 *   - Properly creates and populates the core PDAs:
 *       * Config
 *       * Metrics
 *       * Lifecycle
 *       * GlobalMetadata
 *   - Enforces single-run semantics (cannot be initialized twice)
 *   - Stores admin / fee / limits according to parameters
 *   - Leaves metrics and lifecycle in a sane initial state
 *
 * These tests are written using the helpers in:
 *   - tests/helpers/provider.ts     (provider + context)
 *   - tests/helpers/accounts.ts     (PDA derivations)
 *   - tests/helpers/builders.ts     (argument builders)
 *   - tests/helpers/assertions.ts   (semantic assertions)
 *
 * All content is in English only.
 * ============================================================================
 */

import { SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

import { createUnit09TestContext } from "./helpers/provider";
import { buildInitializePdaAccounts } from "./helpers/accounts";
import {
  buildInitializeArgs,
  BuildInitializeArgsOptions,
} from "./helpers/builders";
import {
  assertConfig,
  assertMetrics,
  assertLifecycle,
  expectDefined,
} from "./helpers/assertions";

// Increase timeout for CI or slow RPCs
jest.setTimeout(120_000);

// Shared context for the entire init test suite
const ctx = createUnit09TestContext();

describe("unit09_program – initialize", () => {
  const customInitOptions: BuildInitializeArgsOptions = {
    feeBps: 250, // 2.5%
    maxModulesPerRepo: 128,
  };

  const pda = buildInitializePdaAccounts(ctx.program.programId);

  let initTxSignature: string | null = null;

  beforeAll(async () => {
    // Make sure the payer wallet is funded before we run any tests
    await ctx.ensurePayerHasFunds(2 * 1_000_000_000); // 2 SOL (on devnet/localnet)
  });

  it("initializes config, metrics, lifecycle, and global metadata", async () => {
    const initArgs = buildInitializeArgs({
      ...customInitOptions,
      admin: ctx.wallet.publicKey,
    });

    const tx = await ctx.program.methods
      .initialize(initArgs)
      .accounts({
        // Core PDAs
        config: pda.config,
        metrics: pda.metrics,
        lifecycle: pda.lifecycle,
        globalMetadata: pda.globalMetadata,
        // Signers
        admin: ctx.wallet.publicKey,
        payer: ctx.wallet.publicKey,
        // System
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    initTxSignature = tx;
    expect(initTxSignature).toBeTruthy();

    // Fetch and inspect on-chain accounts
    const configAcc = await ctx.program.account.config.fetch(pda.config);
    const metricsAcc = await ctx.program.account.metrics.fetch(pda.metrics);
    const lifecycleAcc = await ctx.program.account.lifecycle.fetch(pda.lifecycle);
    const globalMetaAcc = await ctx.program.account.globalMetadata.fetch(pda.globalMetadata);

    // Wrap them in the shape expected by assertion helpers
    assertConfig(
      { pubkey: pda.config, data: configAcc },
      {
        admin: ctx.wallet.publicKey.toBase58(),
        feeBps: customInitOptions.feeBps,
        maxModulesPerRepo: customInitOptions.maxModulesPerRepo,
      }
    );

    assertMetrics(
      { pubkey: pda.metrics, data: metricsAcc },
      {
        totalRepos: BigInt(0),
        totalModules: BigInt(0),
        totalForks: BigInt(0),
        totalObservations: BigInt(0),
        totalLinesOfCode: BigInt(0),
        totalFilesProcessed: BigInt(0),
      }
    );

    assertLifecycle(
      { pubkey: pda.lifecycle, data: lifecycleAcc },
      {
        // For initialization we only assert that timestamps are non-zero
        createdAt: lifecycleAcc.createdAt,
        lastActivityAt: lifecycleAcc.lastActivityAt,
      }
    );

    expectDefined(globalMetaAcc, "globalMetadata");
  });

  it("stores the correct admin and fee configuration", async () => {
    const configAcc = await ctx.program.account.config.fetch(pda.config);

    expect(configAcc.admin).toEqual(ctx.wallet.publicKey.toBase58());
    expect(configAcc.feeBps).toEqual(customInitOptions.feeBps);
    expect(configAcc.maxModulesPerRepo).toEqual(customInitOptions.maxModulesPerRepo);
  });

  it("starts with zero metrics counts and sane numeric types", async () => {
    const metricsAcc = await ctx.program.account.metrics.fetch(pda.metrics);

    expect(metricsAcc.totalRepos.toString()).toEqual("0");
    expect(metricsAcc.totalModules.toString()).toEqual("0");
    expect(metricsAcc.totalForks.toString()).toEqual("0");
    expect(metricsAcc.totalObservations.toString()).toEqual("0");
    expect(metricsAcc.totalLinesOfCode.toString()).toEqual("0");
    expect(metricsAcc.totalFilesProcessed.toString()).toEqual("0");

    // Spot-check BN types
    expect(metricsAcc.totalRepos instanceof BN).toBe(true);
    expect(metricsAcc.totalModules instanceof BN).toBe(true);
  });

  it("records lifecycle timestamps on initialization", async () => {
    const lifecycleAcc = await ctx.program.account.lifecycle.fetch(pda.lifecycle);

    expect(typeof lifecycleAcc.createdAt).toBe("number");
    expect(typeof lifecycleAcc.lastActivityAt).toBe("number");
    expect(lifecycleAcc.createdAt).toBeGreaterThan(0);
    expect(lifecycleAcc.lastActivityAt).toBeGreaterThan(0);
  });

  it("does not allow initialize to be called twice", async () => {
    const initArgs = buildInitializeArgs({
      ...customInitOptions,
      admin: ctx.wallet.publicKey,
    });

    // Second call should fail (e.g., due to already-initialized config PDA)
    await expect(
      ctx.program.methods
        .initialize(initArgs)
        .accounts({
          config: pda.config,
          metrics: pda.metrics,
          lifecycle: pda.lifecycle,
          globalMetadata: pda.globalMetadata,
          admin: ctx.wallet.publicKey,
          payer: ctx.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
    ).rejects.toThrow();
  });

  it("exposes the initialization transaction signature for debugging", () => {
    // Not strictly needed for correctness, but useful for CI / explorers
    expect(initTxSignature).toBeTruthy();
    if (initTxSignature) {
      // eslint-disable-next-line no-console
      console.log("Unit09 initialize tx:", initTxSignature);
    }
  });
});
