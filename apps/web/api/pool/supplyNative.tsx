import { useEffect } from 'react';
import { useContractWrite, useProvider, useWaitForTransaction } from 'wagmi';
import { BN, parseEther } from 'privi-utils';
import wTokenGateway from 'abi/wTokenGateway.json';
import logger from 'utils/logger';
import { usePoolContract, useRegistrarContract, useWTokenGatewayContract } from 'hooks/contracts';
import { BigNumber, Wallet } from 'ethers';
import { prepareSupplyProof } from 'utils/proof';
import { fetchUserShieldedAccount } from 'utils/pool';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import { testPrivateKey } from 'config/env';
import { getScaledAmount } from '@privi-yield/common';

const supplyDelta = parseEther('0.001');

export const usePoolSupplyNative = ({ poolAddress }: { poolAddress: string }) => {
  const poolContract = usePoolContract({ poolAddress });
  const wTokenGatewayContract = useWTokenGatewayContract();
  const registrarContract = useRegistrarContract();
  const { keyPair } = useShieldedAccount();
  const provider = useProvider();

  const { data, error, writeAsync, ...rest } = useContractWrite({
    mode: 'recklesslyUnprepared',
    address: wTokenGatewayContract.address,
    abi: wTokenGateway.abi,
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

    const scaledAmount = await getScaledAmount(amount.sub(supplyDelta), poolContract);

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

  const verifyProof = async (proofArgs: any) => {
    const isValid = await poolContract.verifyProof(proofArgs);
    if (!isValid) {
      throw new Error(`Invalid proof`);
    }
    logger.info(`Proof validated!`);
  };

  const supplyAsync = async (amount: BigNumber, recipient: string) => {
    const { proofArgs, extData } = await generateProof(amount, recipient);

    await verifyProof(proofArgs);

    await writeAsync?.({
      recklesslySetUnpreparedArgs: [poolContract.address, proofArgs, extData],
      recklesslySetUnpreparedOverrides: { value: amount, gasLimit: BN(2_000_000) },
    });
  };

  const testAsync = async (amount: BigNumber, recipient: string) => {
    logger.info(`Simulating supply...`);
    const { proofArgs, extData } = await generateProof(amount, recipient);
    await verifyProof(proofArgs);
    const testWallet = new Wallet(testPrivateKey, provider);
    const contract = wTokenGatewayContract.connect(testWallet);

    try {
      const tx = await contract.callStatic.supply(poolContract.address, proofArgs, extData, {
        value: amount,
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
