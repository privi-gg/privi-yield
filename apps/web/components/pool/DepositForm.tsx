import { useEffect, useState } from 'react';
import { Button, StackProps, VStack } from '@chakra-ui/react';
import { useAccount } from 'wagmi';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FormInput } from 'components/common/form';
import logger from 'utils/logger';
import { equals, formatEther, parseEther } from 'utils/eth';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import { usePoolContract } from 'hooks/contracts';
import useToast from 'hooks/toast';
import useInstance from 'hooks/instance';
import { KeyPair } from '@praave/utils';
import { FormTextInput } from 'components/form';
// import { prepareDeposit } from 'services/proof';
// import { usePoolTransactETH } from 'api/tx';
// import { fetchShieldedAddressOf } from 'utils/pool';

const schema = yup.object().shape({
  amount: yup.number().typeError('Invalid number').positive('Invalid number').required('Required'),
  recipient: yup
    .string()
    .matches(/^(0x)?([A-Fa-f0-9]{40})$/, 'Invalid Address')
    .required('Required'),
});

interface IDepositInput {
  amount?: number;
  recipient?: string;
}

const DepositForm: React.FC<StackProps> = ({ ...props }) => {
  const { showErrorToast, showInfoToast } = useToast();
  const instanceInfo = useInstance();
  const { address } = useAccount();
  const { keyPair, isLoggedIn } = useShieldedAccount();
  const pool = usePoolContract();
  const [isLoading, setLoading] = useState(false);
  //   const { writeAsync: transactETH } = usePoolTransactETH();

  const { control, handleSubmit, setValue, getValues } = useForm<IDepositInput>({
    resolver: yupResolver(schema) as any,
    defaultValues: { amount: 0.01, recipient: address },
  });

  useEffect(() => {
    const v = getValues('recipient');
    if (!v && address) {
      setValue('recipient', address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const submit = (data: any) => {
    setLoading(true);
    logger.info('Form input:', data);
    startDeposit(data)
      .then((success) => {
        success && showInfoToast({ description: 'Transaction Sent!' });
      })
      .catch((error) => {
        logger.error(error);
        showErrorToast({ description: 'Error Occurred!' });
      })
      .finally(() => setLoading(false));
  };

  const startDeposit = async (data: any) => {
    logger.info('Preparing deposit...');

    // const isSelfDeposit = equals(address as string, data.recipient);
    // const amount = parseEther(`${data.amount}`);

    // let receiverKeyPair: KeyPair | undefined;
    // if (isSelfDeposit) {
    //   receiverKeyPair = keyPair;
    // } else {
    //   logger.info(`Fetching receiver account...`);
    //   const receiverSAddress = await fetchShieldedAddressOf(data.recipient, pool);
    //   receiverSAddress && (receiverKeyPair = KeyPair.fromAddress(receiverSAddress));
    // }

    // if (!receiverKeyPair) {
    //   showErrorToast({ description: 'Recipient is not registered yet!' });
    //   return false;
    // }

    // const keyPairs = {
    //   spender: keyPair,
    //   receiver: receiverKeyPair,
    // };

    // const { proofArgs, extData } = await prepareDeposit({ pool, amount, keyPairs }, instanceInfo);

    // logger.info('Sending tx...', { value: formatEther(amount).toString() });
    // await transactETH({
    //   recklesslySetUnpreparedArgs: [proofArgs, extData],
    //   recklesslySetUnpreparedOverrides: { value: extData.extAmount, gasLimit: 2_000_000 },
    // });

    return true;
  };

  return (
    <VStack
      as="form"
      onSubmit={handleSubmit(submit)}
      alignItems="stretch"
      spacing={8}
      w="full"
      minW={600}
      bgColor="primary.50"
      p={8}
      rounded="md"
      {...props}
    >
      <FormTextInput label="Token Amount" name="amount" control={control} />
      <FormTextInput label="Recipient Address" name="recipient" control={control} />
      <Button type="submit" disabled={!isLoggedIn} isLoading={isLoading}>
        {isLoggedIn ? 'Deposit' : 'Log In First'}
      </Button>
    </VStack>
  );
};

export default DepositForm;
