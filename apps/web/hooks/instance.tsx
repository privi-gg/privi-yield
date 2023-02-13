import { useMemo } from 'react';
import { useNetwork } from 'wagmi';
import { chains, defaultChainId, Instance, InstanceConfig, instanceConfig } from 'config/network';

export type InstanceInfo = {
  token: string;
  chainId: number;
  rpcUrl: string;
  instances: Record<string, Instance>;
  wTokenGatewayAddress: string;
};

const supportedChains = Object.values(chains);

const useInstance = () => {
  const { chain } = useNetwork();

  const value = useMemo<InstanceConfig>(() => {
    let chainId = chain?.id as number;
    if (!supportedChains.includes(chainId)) {
      chainId = defaultChainId;
    }

    const config = instanceConfig[chainId];
    return config;

    // const token = Object.keys(config.instances)[0];
    // const instance = config.instances[token];

    // return {
    //   chainId,
    //   rpcUrl: config.rpcUrl,
    //   token,
    //   instanceAddress: instance.pool,
    //   instance,
    //   instances: config.instances,
    //   wTokenGatewayAddress: config.wTokenGateway,
    // };
  }, [chain]);

  return value;
};

export default useInstance;
