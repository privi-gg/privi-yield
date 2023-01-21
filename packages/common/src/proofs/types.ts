import { BigNumberish } from 'ethers';
import MerkleTree, { PartialMerkleTree } from 'fixed-merkle-tree';
import { Utxo } from '../utxo';

export type TxType = 'supply' | 'withdraw' | 'transfer';

export type CircuitPath = { circuit: string; zKey: string };
export type ProofGeneratorConstructorArgs = {
  snarkJs: any;
  fieldSize: BigNumberish;
  merkleTree: MerkleTree | PartialMerkleTree;
  circuits: {
    transact2: CircuitPath;
    transact16: CircuitPath;
  };
};

export type ExtData = {
  recipient: BigNumberish;
  scaledAmount: BigNumberish;
  relayer: BigNumberish;
  scaledFee: BigNumberish;
  encryptedOutput1: BigNumberish;
  encryptedOutput2: BigNumberish;
};

export type GenerateProofArgs = {
  txType: TxType;
  inputs: Utxo[];
  outputs: Utxo[];
  scaledAmount: BigNumberish;
  scaledFee: BigNumberish;
  recipient: BigNumberish;
  relayer: BigNumberish;
};

export type PrepareTxArgs = {
  txType: TxType;
  inputs: Utxo[];
  outputs: Utxo[];
  scaledFee: BigNumberish;
  relayer: BigNumberish;
  recipient?: BigNumberish;
};
