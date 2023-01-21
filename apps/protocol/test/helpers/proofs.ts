import { Contract } from 'ethers';
import MerkleTree from 'fixed-merkle-tree';
import { FIELD_SIZE, TREE_HEIGHT, ZERO_VALUE } from './constants';
import { poseidonHash, toFixedHex } from './utils';
import { CircuitPath, SupplyProver } from '@privi-yield/common';
//@ts-ignore
import * as snarkJs from 'snarkjs';

async function buildMerkleTree(pool: Contract) {
  const filter = pool.filters.NewCommitment();
  const events = await pool.queryFilter(filter, 0);

  const leaves = events
    .sort((a, b) => a.args?.leafIndex - b.args?.leafIndex)
    .map((e) => toFixedHex(e.args?.commitment));
  return new MerkleTree(TREE_HEIGHT, leaves, {
    hashFunction: poseidonHash,
    zeroElement: ZERO_VALUE,
  });
}

const tx2CircuitPath: CircuitPath = {
  circuit: `./artifacts/circuits/transaction2_js/transaction2.wasm`,
  zKey: `./artifacts/circuits/transaction2.zkey`,
};

const tx16CircuitPath: CircuitPath = {
  circuit: `./artifacts/circuits/transaction16_js/transaction16.wasm`,
  zKey: `./artifacts/circuits/transaction16.zkey`,
};

export async function transactDeposit({ pool, amount, ...rest }: any) {
  const merkleTree = await buildMerkleTree(pool);
  const prover = new SupplyProver({
    snarkJs,
    fieldSize: FIELD_SIZE,
    circuits: { transact2: tx2CircuitPath, transact16: tx16CircuitPath },
    merkleTree,
  });

  const { proofArgs, extData } = await prover.prepareTxProof({
    txType: 'deposit',
    ...rest,
  });

  const tx = await pool.deposit(amount, proofArgs, extData);
  return tx.wait();
}

export async function transactWithdraw({ pool, ...rest }: any) {
  const merkleTree = await buildMerkleTree(pool);
  const prover = new SupplyProver({
    snarkJs,
    fieldSize: FIELD_SIZE,
    circuits: { transact2: tx2CircuitPath, transact16: tx16CircuitPath },
    merkleTree,
  });

  const { proofArgs, extData } = await prover.prepareTxProof({
    txType: 'withdraw',
    ...rest,
  });

  const tx = await pool.withdraw(proofArgs, extData);
  return tx.wait();
}

export async function transactTransfer({ pool, ...rest }: any) {
  const merkleTree = await buildMerkleTree(pool);
  const prover = new SupplyProver({
    snarkJs,
    fieldSize: FIELD_SIZE,
    circuits: { transact2: tx2CircuitPath, transact16: tx16CircuitPath },
    merkleTree,
  });

  const { proofArgs, extData } = await prover.prepareTxProof({
    txType: 'transfer',
    ...rest,
  });

  const tx = await pool.transfer(proofArgs, extData);
  return tx.wait();
}
