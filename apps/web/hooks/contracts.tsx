import { useContract, useProvider } from 'wagmi';
import pool from 'abi/pool.json';
import registrar from 'abi/register.json';
import wTokenGateway from 'abi/wTokenGateway.json';
import { registrarAddress } from 'config/network';
import { Contract } from 'ethers';
import useInstance from './instance';

export const usePoolContract = () => {
  const provider = useProvider();
  const { instance } = useInstance();
  return useContract({
    address: instance.instanceAddress,
    abi: pool.abi,
    signerOrProvider: provider,
  }) as Contract;
};

export const useWTokenGatewayContract = () => {
  const provider = useProvider();
  const { wTokenGatewayAddress: wTokenGatewayAddress } = useInstance();
  return useContract({
    address: wTokenGatewayAddress,
    abi: wTokenGateway.abi,
    signerOrProvider: provider,
  }) as Contract;
};

export const useRegistrarContract = () => {
  const provider = useProvider();
  return useContract({
    address: registrarAddress,
    abi: registrar.abi,
    signerOrProvider: provider,
  }) as Contract;
};
