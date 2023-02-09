import { useEffect } from 'react';
import { erc20ABI, useContractWrite, useProvider, useWaitForTransaction } from 'wagmi';
import { BN, parseEther } from 'privi-utils';
import pool from 'abi/pool.json';
import logger from 'utils/logger';
import { usePoolContract, useRegistrarContract } from 'hooks/contracts';
import { BigNumber, Contract, Wallet } from 'ethers';
import { prepareSupplyProof } from 'utils/proof';
import { fetchUserShieldedAccount } from 'utils/pool';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import { testPrivateKey } from 'config/env';

const supplyDelta = parseEther('0.001');

export const usePoolSupply = ({ poolAddress }: { poolAddress: string }) => {
  const poolContract = usePoolContract({ poolAddress });
  const registrarContract = useRegistrarContract();
  const { keyPair } = useShieldedAccount();
  const provider = useProvider();

  const { data, error, writeAsync, ...rest } = useContractWrite({
    mode: 'recklesslyUnprepared',
    // address: instance.instanceAddress,
    // abi: pool.abi,
    //@todo Generalize for non-native tokens
    address: poolContract.address,
    abi: pool.abi,
    functionName: 'supply',
    overrides: {
      gasLimit: BN(2_000_000),
    },
  });

  const { data: receipt } = useWaitForTransaction({ hash: data?.hash });

  const generateProof = async (amount: BigNumber, recipient: string) => {
    if (!keyPair) {
      throw new Error('Please login to supply');
    }

    const scaledAmount = amount.sub(supplyDelta);
    // const scaledAmount = amount;
    const recipientKeyPair = await fetchUserShieldedAccount(recipient, registrarContract);
    if (!recipientKeyPair) {
      throw new Error('Recipient shielded account not found');
    }

    const { proofArgs, extData } = await prepareSupplyProof({
      pool: poolContract,
      from: keyPair,
      to: recipientKeyPair,
      scaledAmount,
    });

    return { proofArgs, extData };
  };

  const supplyAsync = async (amount: BigNumber, recipient: string) => {
    const { proofArgs, extData } = await generateProof(amount, recipient);

    await writeAsync?.({
      recklesslySetUnpreparedArgs: [proofArgs, extData],
      //@todo Generalize for non-native tokens
      recklesslySetUnpreparedOverrides: { gasLimit: BN(2_000_000) },
    });
  };

  const testAsync = async (amount: BigNumber, recipient: string) => {
    logger.info(`Simulating supply...`);
    const { proofArgs, extData } = await generateProof(amount, recipient);
    const testWallet = new Wallet(testPrivateKey, provider);
    const contract = poolContract.connect(testWallet);

    // const tokenAddr = await poolContract.token();
    // const tokenContract = new Contract(
    //   '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    //   erc20ABI,
    //   provider
    // );
    // const allowance = await tokenContract.allowance(testWallet.address, poolContract.address);
    // console.log('allowance', allowance.toString());
    // console.log('testPk', testWallet.address);

    try {
      const tx = await contract.callStatic.supply(proofArgs, extData, {
        gasLimit: BN(2_000_000),
      });
      logger.info(`Supply simulation successful`, tx);
      return true;
    } catch (error) {
      logger.error(`Supply simulation failed:`, error);
      return false;
    }
  };

  useEffect(() => {
    if (receipt) logger.info('Tx receipt:', receipt);
  }, [receipt]);

  useEffect(() => {
    if (data) logger.info('Tx:', data);
    if (error) logger.error(`Tx error:`, error);
  }, [data, error]);

  return { data, error, supplyAsync, testAsync, ...rest };
};
