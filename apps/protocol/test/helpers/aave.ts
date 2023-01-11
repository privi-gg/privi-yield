import { BigNumber, BigNumberish, Contract } from 'ethers';

export const getScaledAmount = (amount: BigNumberish, pool: Contract): BigNumber => {
  return pool.getAaveScaledAmount(amount);
};
