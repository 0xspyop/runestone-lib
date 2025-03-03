import { Network } from '../network';
import { BitcoinRpcClient } from '../rpcclient';

export interface RunestoneStorage {
  /**
   * Connect to the storage backend, called at indexer startup.
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the storage backend, called at indexer shutdown.
   */
  disconnect(): Promise<void>;

  /**
   * Get indexed block hash at specified block height
   * @param blockHeight the block height
   */
  getBlockhash(blockHeight: number): Promise<string | null>;

  /**
   * Get the most recently indexed block's index and hash stored in IRunestoneStorage.
   */
  getCurrentBlock(): Promise<BlockIdentifier | null>;

  /**
   * Reset the most recent index block to a previous block height/hash by unindexing all blocks
   * following the specified block (this is used to handle reorgs).
   * @param block the block height and hash to reset current block to
   */
  resetCurrentBlock(block: BlockIdentifier): Promise<void>;

  /**
   * Seeds the database with any predefined etchings.
   * @param etchings etchings to seed the database with
   */
  seedEtchings(etchings: RuneEtching[]): Promise<void>;

  /**
   * Save new utxo balances for the given block.
   * @param runeBlockIndex the block with all the new utxo balances
   */
  saveBlockIndex(runeBlockIndex: RuneBlockIndex): Promise<void>;

  /**
   * Get the etching that deployed the rune if it exists.
   * @param runeLocation rune id string representation
   */
  getEtching(runeLocation: string): Promise<RuneEtching | null>;

  /**
   * Get the total valid mint counts for rune.
   * @param rune rune id string representation
   * @param blockhash hash to specify explicit block chain tip to use
   */
  getValidMintCount(runeLocation: string, blockhash: string): Promise<number>;

  getRuneLocation(rune: string): Promise<RuneLocation | null>;

  /**
   * Get the rune balances for the given UTXO.
   * @param txid transaction id
   * @param vout output index in transaction
   */
  getUtxoBalance(txid: string, vout: number): Promise<RuneUtxoBalance[]>;
}

export type RunestoneIndexerOptions = {
  bitcoinRpcClient: BitcoinRpcClient;

  network: Network;

  storage: RunestoneStorage;

  /**
   * The interval at which to poll the RPC for new blocks, in milliseconds.
   * Defaults to `10000` (10 seconds), and must be positive.
   */
  pollIntervalMs?: number;
};

export type BlockIdentifier = {
  height: number;
  hash: string;
};

export type BlockInfo = BlockIdentifier & {
  previousblockhash: string;
  time: number;
};

export type RuneLocation = {
  block: number;
  tx: number;
};

export namespace RuneLocation {
  export function toString(runeId: RuneLocation): string {
    return `${runeId.block}:${runeId.tx}`;
  }
}

export type RuneOutput = {
  txid: string;
  vout: number;
};

export type RuneUtxoBalance = {
  txid: string;
  vout: number;
  address?: string;
  scriptPubKey: Buffer;
  runeId: RuneLocation;
  rune: string;
  amount: bigint;
};

export type RuneMintCount = { mint: RuneLocation; count: number };
export type RuneBalance = { runeId: RuneLocation; amount: bigint };

export type RuneEtchingSpec = {
  rune?: string;
  divisibility?: number;
  premine?: bigint;
  spacers?: number[];
  symbol?: string;
  terms?: {
    cap?: bigint;
    amount?: bigint;
    offset?: {
      start?: bigint;
      end?: bigint;
    };
    height?: {
      start?: bigint;
      end?: bigint;
    };
  };
};

export type RuneEtching = ({ valid: false } | ({ valid: true } & RuneEtchingSpec)) & {
  runeId: RuneLocation;
  rune: string;
  txid: string;
};

export type RuneBlockIndex = {
  block: BlockInfo;
  etchings: RuneEtching[];
  mintCounts: RuneMintCount[];
  utxoBalances: RuneUtxoBalance[];
  spentOutputs: RuneOutput[];
  burnedBalances: RuneBalance[];
};
