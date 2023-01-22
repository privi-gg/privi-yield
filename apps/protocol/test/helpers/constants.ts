import { ethers } from 'hardhat';
const { BigNumber } = ethers;
import { ZERO_LEAF } from '@privi-yield/common';

export const FIELD_SIZE = BigNumber.from(
  '21888242871839275222246405745257275088548364400416034343698204186575808495617'
).toHexString();

export const ZERO_VALUE = ZERO_LEAF;

export const TREE_HEIGHT = 20;

// POLYGON
export const AAVE_POOL_ADDRESS_PROVIDER = '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb';
export const ASSET_WMATIC = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';
