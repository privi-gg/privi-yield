import { BigNumber, BigNumberish, Contract } from 'ethers';
import { rayDiv, rayMul } from '@aave/math-utils';

export const getScaledAmount = async (amount: BigNumberish, pool: Contract) => {
  const data = await pool.getAavePoolAndReserveData();
  const nextLiquidityIndex = BigNumber.from(data[2]).toString();
  const scaledAmount = rayDiv(BigNumber.from(amount).toString(), nextLiquidityIndex);
  return BigNumber.from(scaledAmount.toString());
};

export const getUserBalance = async (scaledBalance: BigNumberish, pool: Contract) => {
  const normalizedIncome = await pool.getAaveReserveNormalizedIncome();
  const balance = rayMul(BigNumber.from(scaledBalance).toString(), normalizedIncome.toString());
  return BigNumber.from(balance.toString());
};
