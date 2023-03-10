import { useContractRead } from 'wagmi';
import aavePool from 'abi/aavePool.json';
import { BN } from 'privi-utils';

interface AssetAPYQueryInput {
  aavePool?: `0x${string}`;
  token?: `0x${string}`;
}

const RAY = BN('1000000000000000000000000000'); // 10**27
const SECONDS_PER_YEAR = 31536000;

export const useGetAssetAPY = ({ aavePool: aavePoolAddress, token }: AssetAPYQueryInput) => {
  const contract = { address: aavePoolAddress, abi: aavePool.abi };

  const { data, ...rest } = useContractRead({
    ...contract,
    functionName: 'getReserveData',
    args: [token],
    enabled: !!aavePoolAddress && !!token,
  });

  let apy;
  if (data) {
    const liquidityRate = (data as any).currentLiquidityRate;
    const depositAPR = liquidityRate.mul(1e5).div(RAY).toNumber() / 1e5;
    const depositAPY = (1 + depositAPR / SECONDS_PER_YEAR) ** SECONDS_PER_YEAR - 1;
    apy = depositAPY * 100;
  }

  return { data: apy, ...rest };
};
