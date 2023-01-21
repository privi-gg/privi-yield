import { BigNumber, utils } from 'ethers';

const { keccak256, toUtf8Bytes } = utils;

export const FIELD_SIZE =
  '21888242871839275222246405745257275088548364400416034343698204186575808495617';

export const ZERO_LEAF = BigNumber.from(keccak256(toUtf8Bytes('privi')))
  .mod(FIELD_SIZE)
  .toHexString();
