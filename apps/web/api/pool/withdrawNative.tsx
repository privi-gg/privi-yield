import { useEffect } from 'react';
import { useContractWrite, useProvider, useWaitForTransaction } from 'wagmi';
import { BN } from 'privi-utils';
import wTokenGateway from 'abi/wTokenGateway.json';
import logger from 'utils/logger';
import { usePoolContract, useWTokenGatewayContract } from 'hooks/contracts';
import { BigNumber, Wallet } from 'ethers';
import { prepareWithdrawProof } from 'utils/proof';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import { testPrivateKey } from 'config/env';
import { getScaledAmount } from '@privi-yield/common';

export const usePoolWithdrawNative = ({ poolAddress }: { poolAddress: string }) => {
  const poolContract = usePoolContract({ poolAddress });
  const wTokenGatewayContract = useWTokenGatewayContract();
  const { keyPair } = useShieldedAccount();
  const provider = useProvider();

  const { data, error, writeAsync, ...rest } = useContractWrite({
    mode: 'recklesslyUnprepared',
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

    const scaledAmount = await getScaledAmount(amount, poolContract);

    const { proofArgs, extData } = await prepareWithdrawProof({
      pool: poolContract,
      from: keyPair,
      scaledAmount,
      recipient: wTokenGatewayContract.address,
    });

    return { proofArgs, extData };
  };

  const verifyProof = async (proofArgs: any) => {
    const isValid = await poolContract.verifyProof(proofArgs);
    if (!isValid) {
      throw new Error(`Invalid proof`);
    }
    logger.info(`Proof validated!`);
  };

  const withdrawAsync = async (amount: BigNumber, recipient: string) => {
    const { proofArgs, extData } = await generateProof(amount, recipient);
    await verifyProof(proofArgs);

    await writeAsync?.({
      recklesslySetUnpreparedArgs: [poolContract.address, recipient, proofArgs, extData],
      recklesslySetUnpreparedOverrides: { gasLimit: BN(2_000_000) },
    });
  };

  const testAsync = async (amount: BigNumber, recipient: string) => {
    logger.info(`Simulating withdraw native...`);
    const { proofArgs, extData } = await generateProof(amount, recipient);
    await verifyProof(proofArgs);
    const testWallet = new Wallet(testPrivateKey, provider);
    const contract = wTokenGatewayContract.connect(testWallet);

    console.log({
      poolContractAddress: poolContract.address,
      recipient,
      extData,
    });

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
