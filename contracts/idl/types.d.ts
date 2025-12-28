// ==========================================================================
// Unit09 – TypeScript Declarations for the Anchor IDL
// Path: contracts/idl/types.d.ts
//
// This file provides strongly-typed interfaces for the Unit09 Anchor program
// based on the JSON IDL definition in `unit09_program.json`.
//
// It is designed for use with:
// - front-end clients (for example with @coral-xyz/anchor or @solana/web3.js)
// - worker services that interact with Unit09 on-chain
// - type-safe tooling around accounts, instructions, and events
//
// All symbols and comments are in English only.
// ==========================================================================

/**
 * Root shape of the Unit09 Anchor IDL when loaded as JSON.
 */
export type Unit09Program = {
  version: "0.1.0";
  name: "unit09_program";
  instructions: Unit09Instruction[];
  accounts: Unit09AccountDescription[];
  types: Unit09TypeDescription[];
  events: Unit09EventDescription[];
  errors: Unit09ErrorDescription[];
  metadata: {
    address: string;
    origin: string;
  };
};

// ==========================================================================
// IDL-LEVEL GENERIC TYPES
// ==========================================================================

/**
 * Generic instruction description as present in the Anchor IDL.
 */
export interface Unit09Instruction {
  name:
    | "initialize"
    | "setConfig"
    | "registerRepo"
    | "updateRepo"
    | "registerModule"
    | "updateModule"
    | "linkModuleToRepo"
    | "createFork"
    | "updateForkState"
    | "recordObservation"
    | "recordMetrics"
    | "setMetadata";
  docs?: string[];
  accounts: Unit09InstructionAccount[];
  args: Unit09InstructionArg[];
}

/**
 * Account meta information for a given instruction in the IDL.
 */
export interface Unit09InstructionAccount {
  name: string;
  isMut: boolean;
  isSigner: boolean;
  pda?: {
    seeds: Array<{
      kind: "const" | "arg" | "account" | "variable";
      type: "bytes" | "publicKey";
      value?: string;
      path?: string;
    }>;
  };
}

/**
 * Instruction argument description as present in the IDL.
 */
export interface Unit09InstructionArg {
  name: string;
  type:
    | string
    | {
        defined?: string;
        option?: string | Unit09CompositeType;
        array?: [string | Unit09CompositeType, number];
        tuple?: Array<string | Unit09CompositeType>;
      };
}

/**
 * Composite type variants used in IDL type definitions.
 */
export type Unit09CompositeType =
  | { defined: string }
  | { option: string | Unit09CompositeType }
  | { array: [string | Unit09CompositeType, number] }
  | { tuple: Array<string | Unit09CompositeType> };

/**
 * Account description entry in the IDL.
 */
export interface Unit09AccountDescription {
  name:
    | "Config"
    | "Metrics"
    | "Lifecycle"
    | "Repo"
    | "Module"
    | "ModuleVersion"
    | "Fork"
    | "ModuleRepoLink"
    | "GlobalMetadata"
    | "Authority";
  docs?: string[];
  type: Unit09StructType;
}

/**
 * Structure description used for accounts and custom types.
 */
export interface Unit09StructType {
  kind: "struct";
  fields: Unit09Field[];
}

/**
 * Field description used inside struct types.
 */
export interface Unit09Field {
  name: string;
  type:
    | "publicKey"
    | "bool"
    | "string"
    | "u8"
    | "u16"
    | "u32"
    | "u64"
    | "i64"
    | {
        array: [PrimitiveOrCompositeType, number];
      };
}

/**
 * Primitive or composite type used in array fields.
 */
export type PrimitiveOrCompositeType =
  | "publicKey"
  | "bool"
  | "string"
  | "u8"
  | "u16"
  | "u32"
  | "u64"
  | "i64"
  | { defined: string }
  | { option: PrimitiveOrCompositeType }
  | { tuple: PrimitiveOrCompositeType[] };

/**
 * Custom type description as present in the IDL.
 */
export interface Unit09TypeDescription {
  name:
    | "InitializeArgs"
    | "SetConfigArgs"
    | "RegisterRepoArgs"
    | "UpdateRepoArgs"
    | "RegisterModuleArgs"
    | "UpdateModuleArgs"
    | "LinkModuleToRepoArgs"
    | "CreateForkArgs"
    | "UpdateForkStateArgs"
    | "RecordObservationArgs"
    | "RecordMetricsArgs"
    | "SetMetadataArgs";
  type: Unit09StructType;
}

/**
 * Event description entry in the IDL.
 */
export interface Unit09EventDescription {
  name:
    | "ConfigUpdated"
    | "RepoRegistered"
    | "RepoUpdated"
    | "RepoActivationChanged"
    | "ModuleRegistered"
    | "ModuleVersionRegistered"
    | "ModuleLinkedToRepo"
    | "ForkCreated"
    | "ForkUpdated"
    | "ObservationRecorded"
    | "MetricsReconciled"
    | "GlobalMetadataUpdated";
  fields: Unit09EventField[];
}

/**
 * Field description inside an event in the IDL.
 */
export interface Unit09EventField {
  name: string;
  type:
    | "publicKey"
    | "bool"
    | "string"
    | "u8"
    | "u16"
    | "u32"
    | "u64"
    | "i64";
  index: boolean;
}

/**
 * Error description entry in the IDL.
 */
export interface Unit09ErrorDescription {
  code: number;
  name:
    | "InvalidAdmin"
    | "InvalidAuthority"
    | "InvalidForkOwner"
    | "InvalidPda"
    | "InternalError"
    | "InvalidFeeBps"
    | "ValueOutOfRange"
    | "StringEmpty"
    | "StringTooLong"
    | "ObservationDataTooLarge"
    | "MetadataInvalid"
    | "DeploymentInactive"
    | "TimestampInFuture"
    | "InvalidTimeRange";
  msg: string;
}

// ==========================================================================
// STRONGLY TYPED INSTRUCTION ARGUMENTS
// ==========================================================================

/**
 * Args for `initialize`.
 */
export interface InitializeArgs {
  admin: string; // publicKey (base58 string)
  feeBps: number; // u16
  maxModulesPerRepo: number; // u32
  policyRef: Uint8Array; // [u8; 32]
  lifecycleNoteRef: Uint8Array; // [u8; 32]
}

/**
 * Args for `setConfig`.
 */
export interface SetConfigArgs {
  feeBps: number | null; // option<u16>
  maxModulesPerRepo: number | null; // option<u32>
  isActive: boolean | null; // option<bool>
  policyRef: Uint8Array | null; // option<[u8; 32]>
}

/**
 * Args for `registerRepo`.
 */
export interface RegisterRepoArgs {
  repoKey: string; // publicKey
  name: string;
  url: string;
  tags: string;
  allowObservation: boolean;
}

/**
 * Args for `updateRepo`.
 */
export interface UpdateRepoArgs {
  name: string | null;
  url: string | null;
  tags: string | null;
  isActive: boolean | null;
  allowObservation: boolean | null;
}

/**
 * Semantic version tuple [major, minor, patch].
 */
export type SemanticVersionTuple = [number, number, number]; // [u16, u16, u16]

/**
 * Args for `registerModule`.
 */
export interface RegisterModuleArgs {
  moduleKey: string; // publicKey
  name: string;
  metadataUri: string;
  category: string;
  tags: string;
  version: SemanticVersionTuple;
  versionLabel: string;
  changelogUri: string;
  isStable: boolean;
  createInitialVersionSnapshot: boolean;
}

/**
 * Args for `updateModule`.
 */
export interface UpdateModuleArgs {
  name: string | null;
  metadataUri: string | null;
  category: string | null;
  tags: string | null;
  isActive: boolean | null;
  createVersionSnapshot: boolean;
  newVersion: SemanticVersionTuple | null;
  versionLabel: string | null;
  changelogUri: string | null;
  isStable: boolean | null;
}

/**
 * Args for `linkModuleToRepo`.
 */
export interface LinkModuleToRepoArgs {
  isPrimary: boolean;
  notes: string;
}

/**
 * Args for `createFork`.
 */
export interface CreateForkArgs {
  forkKey: string; // publicKey
  parent: string | null; // option<publicKey>
  label: string;
  metadataUri: string;
  tags: string;
  isRoot: boolean;
  depth: number | null; // option<u16>
}

/**
 * Args for `updateForkState`.
 */
export interface UpdateForkStateArgs {
  label: string | null;
  metadataUri: string | null;
  tags: string | null;
  isActive: boolean | null;
}

/**
 * Args for `recordObservation`.
 */
export interface RecordObservationArgs {
  linesOfCode: bigint; // u64
  filesProcessed: number; // u32
  modulesTouched: number; // u32
  revision: string;
  note: string;
}

/**
 * Args for `recordMetrics`.
 */
export interface RecordMetricsArgs {
  totalRepos: bigint | null;
  totalModules: bigint | null;
  totalForks: bigint | null;
  totalObservations: bigint | null;
  totalLinesOfCode: bigint | null;
  totalFilesProcessed: bigint | null;
}

/**
 * Args for `setMetadata`.
 */
export interface SetMetadataArgs {
  description: string | null;
  tags: string | null;
  websiteUrl: string | null;
  docsUrl: string | null;
  dashboardUrl: string | null;
  iconUri: string | null;
  extraJson: string | null;
}

// ==========================================================================
// STRONGLY TYPED ACCOUNTS
// ==========================================================================

/**
 * Global configuration account.
 */
export interface ConfigAccount {
  admin: string; // publicKey
  feeBps: number; // u16
  maxModulesPerRepo: number; // u32
  isActive: boolean;
  policyRef: Uint8Array; // [u8; 32]
  bump: number; // u8
  createdAt: bigint; // i64
  updatedAt: bigint; // i64
  reserved: Uint8Array; // [u8; 64]
}

/**
 * Global metrics account.
 */
export interface MetricsAccount {
  bump: number;
  totalRepos: bigint;
  totalModules: bigint;
  totalForks: bigint;
  totalObservations: bigint;
  totalLinesOfCode: bigint;
  totalFilesProcessed: bigint;
  createdAt: bigint;
  updatedAt: bigint;
  reserved: Uint8Array;
}

/**
 * Lifecycle and write-lock account.
 */
export interface LifecycleAccount {
  bump: number;
  isWriteLocked: boolean;
  isReadOnly: boolean;
  lifecycleNoteRef: Uint8Array; // [u8; 32]
  createdAt: bigint;
  updatedAt: bigint;
  reserved: Uint8Array; // [u8; 64]
}

/**
 * Tracked repository account.
 */
export interface RepoAccount {
  bump: number;
  repoKey: string; // publicKey
  authority: string; // publicKey
  name: string;
  url: string;
  tags: string;
  isActive: boolean;
  allowObservation: boolean;
  totalObservations: bigint;
  totalLinesOfCode: bigint;
  totalFilesProcessed: bigint;
  totalModules: number; // u32
  lastObservedAt: bigint;
  lastObserver: string; // publicKey
  createdAt: bigint;
  updatedAt: bigint;
  reserved: Uint8Array; // [u8; 64]
}

/**
 * Module account representing a runnable unit of logic.
 */
export interface ModuleAccount {
  bump: number;
  moduleKey: string; // publicKey
  repo: string; // publicKey
  authority: string; // publicKey
  name: string;
  metadataUri: string;
  category: string;
  tags: string;
  isActive: boolean;
  majorVersion: number; // u16
  minorVersion: number; // u16
  patchVersion: number; // u16
  createdAt: bigint;
  updatedAt: bigint;
  reserved: Uint8Array; // [u8; 64]
}

/**
 * ModuleVersion snapshot account.
 */
export interface ModuleVersionAccount {
  bump: number;
  module: string; // publicKey
  authority: string; // publicKey
  majorVersion: number; // u16
  minorVersion: number; // u16
  patchVersion: number; // u16
  metadataUri: string;
  changelogUri: string;
  label: string;
  isStable: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  reserved: Uint8Array; // [u8; 32]
}

/**
 * Fork account representing a Unit09 personality branch.
 */
export interface ForkAccount {
  bump: number;
  forkKey: string; // publicKey
  parent: string; // publicKey
  owner: string; // publicKey
  label: string;
  metadataUri: string;
  tags: string;
  isRoot: boolean;
  isActive: boolean;
  depth: number; // u16
  createdAt: bigint;
  updatedAt: bigint;
  reserved: Uint8Array; // [u8; 64]
}

/**
 * Module-to-Repo link account.
 */
export interface ModuleRepoLinkAccount {
  bump: number;
  module: string; // publicKey
  repo: string; // publicKey
  linkedBy: string; // publicKey
  isPrimary: boolean;
  notes: string;
  schemaVersion: number; // u8
  createdAt: bigint;
  updatedAt: bigint;
  reserved: Uint8Array; // [u8; 63]
}

/**
 * Human-facing global metadata account.
 */
export interface GlobalMetadataAccount {
  bump: number;
  description: string;
  tags: string;
  websiteUrl: string;
  docsUrl: string;
  dashboardUrl: string;
  iconUri: string;
  extraJson: string;
  createdAt: bigint;
  updatedAt: bigint;
  reserved: Uint8Array; // [u8; 64]
}

/**
 * Authority entry used for role-based access control.
 */
export interface AuthorityAccount {
  bump: number;
  authority: string; // publicKey
  role: string;
  createdAt: bigint;
  updatedAt: bigint;
  reserved: Uint8Array; // [u8; 64]
}

// ==========================================================================
// STRONGLY TYPED EVENTS
// ==========================================================================

export interface ConfigUpdatedEvent {
  admin: string;
  feeBps: number;
  maxModulesPerRepo: number;
}

export interface RepoRegisteredEvent {
  repo: string;
  owner: string;
  url: string;
}

export interface RepoUpdatedEvent {
  repo: string;
  url: string;
}

export interface RepoActivationChangedEvent {
  repo: string;
  isActive: boolean;
  updatedAt: bigint;
}

export interface ModuleRegisteredEvent {
  module: string;
  repo: string;
  owner: string;
  category: string;
  majorVersion: number;
  minorVersion: number;
  patchVersion: number;
}

export interface ModuleVersionRegisteredEvent {
  module: string;
  majorVersion: number;
  minorVersion: number;
  patchVersion: number;
  isStable: boolean;
}

export interface ModuleLinkedToRepoEvent {
  module: string;
  repo: string;
  linkedBy: string;
  isPrimary: boolean;
  updatedAt: bigint;
}

export interface ForkCreatedEvent {
  fork: string;
  owner: string;
  parent: string;
  isRoot: boolean;
  depth: number;
  createdAt: bigint;
}

export interface ForkUpdatedEvent {
  fork: string;
  owner: string;
  previousIsActive: boolean;
  newIsActive: boolean;
  updatedAt: bigint;
}

export interface ObservationRecordedEvent {
  repo: string;
  observer: string;
  linesOfCode: bigint;
  filesProcessed: number;
  modulesTouched: number;
  revision: string;
  note: string;
  observedAt: bigint;
}

export interface MetricsReconciledEvent {
  admin: string;
  totalRepos: bigint;
  totalModules: bigint;
  totalForks: bigint;
  totalObservations: bigint;
  totalLinesOfCode: bigint;
  totalFilesProcessed: bigint;
  updatedAt: bigint;
}

export interface GlobalMetadataUpdatedEvent {
  admin: string;
  description: string;
  websiteUrl: string;
  docsUrl: string;
  dashboardUrl: string;
  iconUri: string;
  updatedAt: bigint;
}

// ==========================================================================
// ERROR TYPES
// ==========================================================================

export type Unit09ErrorName =
  | "InvalidAdmin"
  | "InvalidAuthority"
  | "InvalidForkOwner"
  | "InvalidPda"
  | "InternalError"
  | "InvalidFeeBps"
  | "ValueOutOfRange"
  | "StringEmpty"
  | "StringTooLong"
  | "ObservationDataTooLarge"
  | "MetadataInvalid"
  | "DeploymentInactive"
  | "TimestampInFuture"
  | "InvalidTimeRange";

export type Unit09ErrorCode =
  | 6000
  | 6001
  | 6002
  | 6003
  | 6004
  | 6005
  | 6006
  | 6007
  | 6008
  | 6009
  | 6010
  | 6011
  | 6012
  | 6013;

// ==========================================================================
// OPTIONAL IDL CONSTANT
// ==========================================================================
//
// If you load the JSON IDL at runtime (for example via require or import),
// you can cast it to `Unit09Program` using this declaration:
//
//   import idlJson from "./unit09_program.json";
//   export const IDL = idlJson as Unit09Program;
//
// The declaration below is only a type placeholder and does not provide a
// runtime value by itself.
// ==========================================================================

export declare const IDL: Unit09Program;
