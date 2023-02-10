import { useEffect } from 'react';
import { useContractWrite, useProvider, useWaitForTransaction } from 'wagmi';
import { BN, parseEther } from 'privi-utils';
// import pool from 'abi/pool.json';
import wTokenGateway from 'abi/wTokenGateway.json';
import logger from 'utils/logger';
import { usePoolContract, useRegistrarContract, useWTokenGatewayContract } from 'hooks/contracts';
import { BigNumber, Wallet } from 'ethers';
import { prepareWithdrawProof } from 'utils/proof';
import { fetchUserShieldedAccount } from 'utils/pool';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import { testPrivateKey } from 'config/env';

export const usePoolWithdrawNative = ({ poolAddress }: { poolAddress: string }) => {
  const poolContract = usePoolContract({ poolAddress });
  const wTokenGatewayContract = useWTokenGatewayContract();
  const registrarContract = useRegistrarContract();
  const { keyPair } = useShieldedAccount();
  const provider = useProvider();

  const { data, error, writeAsync, ...rest } = useContractWrite({
    mode: 'recklesslyUnprepared',
    // address: instance.instanceAddress,
    // abi: pool.abi,
    //@todo Generalize for non-native tokens
    address: wTokenGatewayContract.address,
    abi: wTokenGateway.abi,
    functionName: 'withdraw',
    overrides: {
      gasLimit: BN(2_000_000),
    },
  });

  const { data: receipt } = useWaitForTransaction({ hash: data?.hash });

  const generateProof = async (amount: BigNumber, recipient: string) => {
    if (!keyPair) {
      throw new Error('Please login to withdraw');
    }

    const scaledAmount = await poolContract.getAaveScaledAmount(amount);

    const { proofArgs, extData } = await prepareWithdrawProof({
      pool: poolContract,
      from: keyPair,
      scaledAmount,
      //@todo Generalize for non-native tokens
      recipient: wTokenGatewayContract.address,
    });

    return { proofArgs, extData };
  };

  const withdrawAsync = async (amount: BigNumber, recipient: string) => {
    const { proofArgs, extData } = await generateProof(amount, recipient);

    await writeAsync?.({
      recklesslySetUnpreparedArgs: [poolContract.address, recipient, proofArgs, extData],
      recklesslySetUnpreparedOverrides: { gasLimit: BN(2_000_000) },
    });
  };

  const testAsync = async (amount: BigNumber, recipient: string) => {
    logger.info(`Simulating withdraw...`);
    const { proofArgs, extData } = await generateProof(amount, recipient);
    const testWallet = new Wallet(testPrivateKey, provider);
    const contract = wTokenGatewayContract.connect(testWallet);

    try {
      const tx = await contract.callStatic.withdraw(
        poolContract.address,
        recipient,
        proofArgs,
        extData,
        {
          gasLimit: BN(2_000_000),
        }
      );
      logger.info(`Withdraw simulation successful`, tx);
      return true;
    } catch (error) {
      logger.error(`Withdraw simulation failed:`, error);
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

  return { data, error, withdrawAsync, testAsync, ...rest };
};
