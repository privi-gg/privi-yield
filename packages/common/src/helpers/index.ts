import { ethers, type BigNumberish } from 'ethers';
import { Buffer } from 'buffer';

const { BigNumber } = ethers;

export const toFixedBuffer = (value: BigNumberish, length: number) =>
  Buffer.from(
    BigNumber.from(value)
      .toHexString()
      .slice(2)
      .padStart(length * 2, '0'),
    'hex'
  );
