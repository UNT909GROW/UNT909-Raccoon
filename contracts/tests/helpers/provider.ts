/**
 * ============================================================================
 * Unit09 – Anchor Test Provider Helper
 * Path: contracts/unit09-program/tests/helpers/provider.ts
 *
 * This module centralizes all test-time wiring for:
 *   - AnchorProvider and connection
 *   - Wallet / payer resolution
 *   - Program instance loading from IDL
 *   - Convenience helpers for airdrops and keypair creation
 *
 * It is used by all Jest/Mocha-style specs under:
 *   contracts/unit09-program/tests/
 *
 * Usage in tests:
 *
 *   import { createUnit09TestContext } from "./helpers/provider";
 *
 *   describe("unit09_program", () => {
 *     const ctx = createUnit09TestContext();
 *
 *     it("initializes config", async () => {
 *       const txSig = await ctx.program.methods
 *         .initialize({...})
 *         .accounts({...})
 *         .rpc();
 *
 *       console.log("Tx:", txSig);
 *     });
 *   });
 *
 * Environment variables (optional):
 *   - ANCHOR_PROVIDER_URL   : RPC URL override (devnet/localnet/mainnet or custom)
 *   - ANCHOR_WALLET         : Path to keypair JSON used as payer
 *   - UNIT09_PROGRAM_ID     : Program Id override (if not relying on IDL metadata)
 *
 * Requirements:
 *   - @coral-xyz/anchor
 *   - @solana/web3.js
 *   - TypeScript with `"resolveJsonModule": true` (or use require)
 * ============================================================================
 */

import * as fs from "node:fs";
import * as path from "node:path";
import {
  AnchorProvider,
  BN,
  Idl,
  Program,
  setProvider as setAnchorProvider,
  Wallet,
} from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  clusterApiUrl,
} from "@solana/web3.js";

// If your tsconfig does not support `resolveJsonModule`, you can replace this
// with `const idl = require("...") as Idl;`
import idlJson from "../../../idl/unit09_program.json";
// Types are provided by `contracts/idl/types.d.ts`
import type { Unit09Program as Unit09Idl } from "../../../idl/types";

// ============================================================================
// Constants and defaults
// ============================================================================

/**
 * Default program name as declared in Anchor.toml and IDL.
 */
const PROGRAM_NAME = "unit09_program";

/**
 * Default program id used if:
 *  - UNIT09_PROGRAM_ID is not set, and
 *  - IDL metadata does not contain `address`
 *
 * You should change this to the actual deployed program id for production.
 */
const FALLBACK_PROGRAM_ID = "Unit09Program11111111111111111111111111111111";

/**
 * Default cluster used when ANCHOR_PROVIDER_URL is not set.
 */
const DEFAULT_CLUSTER = "http://127.0.0.1:8899";

// ============================================================================
// Utility types
// ============================================================================

/**
 * Narrowed IDL type.
 */
export type Unit09IdlType = Unit09Idl;

/**
 * Strongly typed Anchor Program for Unit09.
 */
export type Unit09ProgramClient = Program<Unit09IdlType>;

/**
 * Context object shared by tests.
 */
export interface Unit09TestContext {
  connection: Connection;
  provider: AnchorProvider;
  wallet: Wallet;
  payer: Keypair;
  programId: PublicKey;
  program: Unit09ProgramClient;

  /**
   * Ensure that the payer has at least `minLamports` lamports, requesting
   * an airdrop if needed (on devnet/localnet).
   */
  ensurePayerHasFunds(minLamports?: number): Promise<void>;

  /**
   * Create a new keypair and fund it with the requested amount of SOL.
   */
  createFundedKeypair(initialSol?: number): Promise<Keypair>;

  /**
   * Utility to wait for a given number of slots.
   */
  waitForSlots(slots: number): Promise<void>;
}

// ============================================================================
// Environment resolution
// ============================================================================

/**
 * Resolve RPC URL from environment or fallback.
 */
function resolveRpcUrl(): string {
  if (process.env.ANCHOR_PROVIDER_URL && process.env.ANCHOR_PROVIDER_URL.trim().length > 0) {
    return process.env.ANCHOR_PROVIDER_URL.trim();
  }

  // As a convenience, accept CLUSTER=devnet|testnet|mainnet for CI environments.
  const clusterEnv = process.env.CLUSTER?.trim().toLowerCase();
  if (clusterEnv === "devnet" || clusterEnv === "testnet" || clusterEnv === "mainnet") {
    return clusterApiUrl(clusterEnv as "devnet" | "testnet" | "mainnet-beta");
  }

  return DEFAULT_CLUSTER;
}

/**
 * Resolve the payer keypair:
 *   - if ANCHOR_WALLET is set, load that keypair JSON
 *   - otherwise, use the default local keypair at ~/.config/solana/id.json
 */
function resolvePayer(): Keypair {
  const walletPath =
    process.env.ANCHOR_WALLET ||
    process.env.SOLANA_WALLET ||
    path.join(process.env.HOME || process.env.USERPROFILE || ".", ".config", "solana", "id.json");

  if (!fs.existsSync(walletPath)) {
    throw new Error(`Wallet keypair file not found at: ${walletPath}`);
  }

  const raw = JSON.parse(fs.readFileSync(walletPath, "utf8")) as number[];
  const secretKey = Uint8Array.from(raw);
  return Keypair.fromSecretKey(secretKey);
}

/**
 * Resolve program id from env, IDL metadata, or fallback.
 */
function resolveProgramId(): PublicKey {
  const envId = process.env.UNIT09_PROGRAM_ID?.trim();
  if (envId) {
    return new PublicKey(envId);
  }

  const idl = idlJson as unknown as Idl & { metadata?: { address?: string } };
  if (idl.metadata?.address) {
    return new PublicKey(idl.metadata.address);
  }

  return new PublicKey(FALLBACK_PROGRAM_ID);
}

// ============================================================================
// Provider and context construction
// ============================================================================

/**
 * Create a strongly typed Unit09 Program client from the AnchorProvider.
 */
function createProgram(provider: AnchorProvider, programId: PublicKey): Unit09ProgramClient {
  const typedIdl = idlJson as unknown as Unit09IdlType & Idl;
  return new Program<Unit09IdlType>(typedIdl, programId, provider);
}

/**
 * Create a common test context used across the Unit09 test suite.
 *
 * This function:
 *   - Resolves RPC URL and wallet
 *   - Creates an AnchorProvider
 *   - Sets the provider globally via `setProvider`
 *   - Instantiates the Unit09 Program client
 */
export function createUnit09TestContext(): Unit09TestContext {
  const rpcUrl = resolveRpcUrl();
  const payer = resolvePayer();

  const connection = new Connection(rpcUrl, {
    commitment: "confirmed",
    disableRetryOnRateLimit: false,
  });

  const wallet: Wallet = {
    publicKey: payer.publicKey,
    signTransaction: async (tx) => {
      tx.partialSign(payer);
      return tx;
    },
    signAllTransactions: async (txs) => {
      txs.forEach((tx) => tx.partialSign(payer));
      return txs;
    },
    payer,
  };

  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });

  // Set as default provider for @coral-xyz/anchor
  setAnchorProvider(provider);

  const programId = resolveProgramId();
  const program = createProgram(provider, programId);

  async function ensurePayerHasFunds(minLamports = 2 * LAMPORTS_PER_SOL): Promise<void> {
    const balance = await connection.getBalance(payer.publicKey);
    if (balance >= minLamports) return;

    // Only attempt airdrop on non-mainnet clusters
    const isLikelyMainnet = rpcUrl.includes("mainnet");
    if (isLikelyMainnet) {
      throw new Error(
        `Payer balance is too low (${balance} lamports) and RPC looks like mainnet. ` +
          `Fund the wallet manually or use a devnet/localnet RPC.`
      );
    }

    const missing = minLamports - balance;
    const roundedSol = Math.ceil(missing / LAMPORTS_PER_SOL);
    const airdropAmount = new BN(roundedSol).mul(new BN(LAMPORTS_PER_SOL)).toNumber();

    const sig = await connection.requestAirdrop(payer.publicKey, airdropAmount);
    await connection.confirmTransaction(sig, "confirmed");
  }

  async function createFundedKeypair(initialSol = 1): Promise<Keypair> {
    const kp = Keypair.generate();
    const lamports = initialSol * LAMPORTS_PER_SOL;
    const sig = await connection.requestAirdrop(kp.publicKey, lamports);
    await connection.confirmTransaction(sig, "confirmed");
    return kp;
  }

  async function waitForSlots(slots: number): Promise<void> {
    const start = await connection.getSlot("confirmed");
    let current = start;
    while (current - start < slots) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      current = await connection.getSlot("confirmed");
    }
  }

  return {
    connection,
    provider,
    wallet,
    payer,
    programId,
    program,
    ensurePayerHasFunds,
    createFundedKeypair,
    waitForSlots,
  };
}

// ============================================================================
// Convenience re-exports
// ============================================================================

export {
  AnchorProvider,
  Program,
  PublicKey,
  Keypair,
  Connection,
  LAMPORTS_PER_SOL,
  SystemProgram,
  BN,
};
