import { useContractRead } from 'wagmi';
import aavePool from 'abi/aavePool.json';
import { BN } from 'privi-utils';

interface AssetAPYQueryInput {
  pool?: `0x${string}`;
  asset?: `0x${string}`;
}

const RAY = BN('1000000000000000000000000000'); // 10**27
const SECONDS_PER_YEAR = 31536000;

export const useGetAssetAPY = ({ pool, asset }: AssetAPYQueryInput) => {
  const contract = { address: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', abi: aavePool.abi };

  const { data, ...rest } = useContractRead({
    ...contract,
    functionName: 'getReserveData',
    args: [asset],
    enabled: !!pool && !!asset,
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
