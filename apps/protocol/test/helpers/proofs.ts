import { ethers } from 'hardhat';
import { Contract } from 'ethers';
import MerkleTree from 'fixed-merkle-tree';
import { FIELD_SIZE, TREE_HEIGHT, ZERO_VALUE } from './constants';
import { generateSnarkProofSolidity, poseidonHash, toFixedHex } from './utils';
import { Utxo } from '@praave/utils';

const { utils, BigNumber } = ethers;

function hashExtData({
  recipient,
  scaledAmount,
  relayer,
  scaledFee,
  encryptedOutput1,
  encryptedOutput2,
}: any) {
  const abi = new utils.AbiCoder();

  const encodedData = abi.encode(
    [
      'tuple(address recipient,uint256 scaledAmount,address relayer,uint256 scaledFee,bytes encryptedOutput1,bytes encryptedOutput2)',
    ],
    [
      {
        recipient: toFixedHex(recipient, 20),
        scaledAmount: toFixedHex(scaledAmount),
        relayer: toFixedHex(relayer, 20),
        scaledFee: toFixedHex(scaledFee),
        encryptedOutput1,
        encryptedOutput2,
      },
    ],
  );
  const hash = utils.keccak256(encodedData);
  return BigNumber.from(hash).mod(FIELD_SIZE);
}

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

async function generateProof({
  inputs,
  outputs,
  tree,
  scaledAmount,
  txType,
  scaledFee,
  recipient,
  relayer,
}: any) {
  const circuit = inputs.length === 16 ? 'transaction16' : 'transaction2';

  const inputPathIndices = [];
  const inputPathElements = [];
  for (const input of inputs) {
    if (input.scaledAmount > 0) {
      input.leafIndex = tree.indexOf(toFixedHex(input.commitment));
      if (input.leafIndex < 0) {
        throw new Error(`Input commitment ${toFixedHex(input.commitment)} was not found`);
      }
      inputPathIndices.push(input.leafIndex);
      inputPathElements.push(tree.path(input.leafIndex).pathElements);
    } else {
      inputPathIndices.push(0);
      inputPathElements.push(new Array(tree.levels).fill(0));
    }
  }

  const extData = {
    recipient: toFixedHex(recipient, 20),
    scaledAmount: toFixedHex(scaledAmount),
    relayer: toFixedHex(relayer, 20),
    scaledFee: toFixedHex(scaledFee),
    encryptedOutput1: outputs[0].encrypt(),
    encryptedOutput2: outputs[1].encrypt(),
  };

  let publicScaledAmount;
  if (txType === 'deposit') {
    publicScaledAmount = BigNumber.from(scaledAmount);
  } else if (txType === 'withdraw') {
    publicScaledAmount = BigNumber.from(FIELD_SIZE).sub(
      BigNumber.from(scaledAmount).add(scaledFee),
    );
    // publicScaledAmount = BigNumber.from(scaledAmount).add(scaledFee);
  } else if (txType === 'transfer') {
    publicScaledAmount = BigNumber.from(scaledFee);
  } else {
    throw new Error(`Invalid txType: ${txType}`);
  }

  const extDataHash = hashExtData(extData);
  const input = {
    root: tree.root,
    publicScaledAmount: publicScaledAmount.toString(),
    extDataHash,
    inputNullifier: inputs.map((x: Utxo) => x.nullifier),
    // data for 2 transaction inputs
    inScaledAmount: inputs.map((x: Utxo) => x.scaledAmount),
    inPrivateKey: inputs.map((x: Utxo) => x.keyPair.privateKey),
    inBlinding: inputs.map((x: Utxo) => x.blinding),
    inPathIndices: inputPathIndices,
    inPathElements: inputPathElements,
    // data for 2 transaction outputs
    outputCommitment: outputs.map((x: Utxo) => x.commitment),
    outScaledAmount: outputs.map((x: Utxo) => x.scaledAmount),
    outPubkey: outputs.map((x: Utxo) => x.keyPair.publicKey),
    outBlinding: outputs.map((x: Utxo) => x.blinding),
  };

  const { proof } = await generateSnarkProofSolidity(input, circuit);

  const proofArgs = {
    proof,
    root: toFixedHex(input.root),
    inputNullifiers: inputs.map((x: Utxo) => toFixedHex(x.nullifier as string)),
    outputCommitments: outputs.map((x: Utxo) => toFixedHex(x.commitment)),
    publicScaledAmount: toFixedHex(input.publicScaledAmount),
    extDataHash: toFixedHex(extDataHash),
  };

  return {
    extData,
    proofArgs,
  };
}

export async function prepareTransaction({
  pool,
  inputs = [],
  outputs = [],
  txType = 'deposit',
  scaledFee = 0,
  recipient = 0,
  relayer = 0,
}: any) {
  if (inputs.length > 16 || outputs.length > 2) {
    throw new Error('Incorrect inputs/outputs count');
  }
  while (inputs.length !== 2 && inputs.length < 16) {
    inputs.push(Utxo.zero());
  }
  while (outputs.length < 2) {
    outputs.push(Utxo.zero());
  }

  let scaledAmount;
  if (txType === 'deposit') {
    scaledAmount = BigNumber.from(scaledFee)
      .add(outputs.reduce((sum: any, x: any) => sum.add(x.scaledAmount), BigNumber.from(0)))
      .sub(inputs.reduce((sum: any, x: any) => sum.add(x.scaledAmount), BigNumber.from(0)));
  } else {
    scaledAmount = inputs
      .reduce((sum: any, x: any) => sum.add(x.scaledAmount), BigNumber.from(0))
      .sub(outputs.reduce((sum: any, x: any) => sum.add(x.scaledAmount), BigNumber.from(0)))
      .sub(BigNumber.from(scaledFee));
  }

  const tree = await buildMerkleTree(pool);

  const { proofArgs, extData } = await generateProof({
    inputs,
    outputs,
    tree,
    scaledAmount,
    txType,
    scaledFee,
    recipient,
    relayer,
  });

  return {
    proofArgs,
    extData,
  };
}

export async function transactDeposit({ pool, amount, ...rest }: any) {
  const { proofArgs, extData } = await prepareTransaction({
    pool,
    txType: 'deposit',
    ...rest,
  });

  const tx = await pool.deposit(amount, proofArgs, extData);
  return tx.wait();
}

export async function transactWithdraw({ pool, ...rest }: any) {
  const { proofArgs, extData } = await prepareTransaction({
    pool,
    txType: 'withdraw',
    ...rest,
  });

  const tx = await pool.withdraw(proofArgs, extData);
  return tx.wait();
}

export async function transactTransfer({ pool, ...rest }: any) {
  const { proofArgs, extData } = await prepareTransaction({
    pool,
    txType: 'transfer',
    ...rest,
  });

  const tx = await pool.transfer(proofArgs, extData);
  return tx.wait();
}
