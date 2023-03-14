import { BigNumber, BigNumberish, Contract } from 'ethers';
import { rayDiv, rayMul } from '@aave/math-utils';

export const getAaveScaledAmountData = async (amount: BigNumberish, pool: Contract) => {
  const data = await pool.getAavePoolAndReserveData();
  const nextLiquidityIndex = BigNumber.from(data[2]).toString();
  const scaledAmount = rayDiv(BigNumber.from(amount).toString(), nextLiquidityIndex);
  return {
    scaledAmount: BigNumber.from(scaledAmount.toString()),
    nextLiquidityIndex: BigNumber.from(nextLiquidityIndex),
  };
};

export const getAaveUserBalanceData = async (scaledBalance: BigNumberish, pool: Contract) => {
  const normalizedIncome = await pool.getAaveReserveNormalizedIncome();
  const balance = rayMul(BigNumber.from(scaledBalance).toString(), normalizedIncome.toString());
  return {
    balance: BigNumber.from(balance.toString()),
    normalizedIncome: BigNumber.from(normalizedIncome.toString()),
  };
};
