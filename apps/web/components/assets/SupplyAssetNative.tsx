import { FC, useEffect, useState } from 'react';
import { Box, Button, Divider, Heading, StackProps, VStack } from '@chakra-ui/react';
import { useAccount } from 'wagmi';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FormSupplyAmountInput, FormTextInput } from 'components/form';
import logger from 'utils/logger';
import { usePoolSupplyNative } from 'api/pool';
import { parseEther } from 'privi-utils';
import { isDev } from 'config/env';
import { useUI } from 'contexts/ui';
import useToast from 'hooks/toast';
import { Instance } from 'config/network';

const schema = yup.object().shape({
  amount: yup.number().typeError('Invalid number').positive('Invalid number').required('Required'),
  recipient: yup
    .string()
    .matches(/^(0x)?([A-Fa-f0-9]{40})$/, 'Invalid Address')
    .required('Required'),
});

interface ISupplyInput {
  amount: number;
  recipient: string;
}

const SupplyAssetNative: FC<StackProps> = ({ ...props }) => {
  const [isLoading, setLoading] = useState<boolean>(false);
  const { closeModal, modalData } = useUI();
  const { showErrorToast } = useToast();
  const { address } = useAccount();
  const { supplyAsync, testAsync } = usePoolSupplyNative({
    poolAddress: modalData?.instance?.pool,
  });
  const { control, handleSubmit, setValue, getValues } = useForm<ISupplyInput>({
    resolver: yupResolver(schema),
    defaultValues: { amount: 0.01, recipient: address },
  });

  useEffect(() => {
    const v = getValues('recipient');
    if (!v && address) {
      setValue('recipient', address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const submit = (data: ISupplyInput) => {
    logger.info('SupplyAsset', data);
    setLoading(true);
    startSupply(data)
      .then(() => {
        logger.info('Tx Sent');
      })
      .catch((err) => {
        logger.error(err);
        showErrorToast({ description: err.message });
      })
      .finally(() => {
        setLoading(false);
        if (!isDev) closeModal();
      });
  };

  const startSupply = async (data: ISupplyInput) => {
    const amount = parseEther(`${data.amount}`);
    await supplyAsync(amount, data.recipient);
  };

  const simulateTest = async () => {
    setLoading(true);
    const data = getValues();
    const amount = parseEther(`${data.amount}`);
    await testAsync(amount, data.recipient)
      .catch((err) => {
        logger.error(err);
      })
      .finally(() => setLoading(false));
  };

  const instance = modalData?.instance as Instance;

  return (
    <VStack alignItems="stretch" spacing={6} py={8} {...props}>
      <Heading textAlign="center" fontSize="xl">
        Supply Asset
      </Heading>
      <Divider />

      <Box px={8} py={4}>
        <VStack as="form" alignItems="stretch" spacing={4} onSubmit={handleSubmit(submit)}>
          <FormSupplyAmountInput
            name="amount"
            label="Enter Amount"
            control={control}
            instance={instance}
          />
          <FormTextInput label="Recipient Address" name="recipient" control={control} />
          <Button type="submit" isLoading={isLoading}>
            Supply
          </Button>

          {isDev && (
            <Button onClick={simulateTest} isLoading={isLoading} colorScheme="orange">
              Test
            </Button>
          )}
        </VStack>
      </Box>
    </VStack>
  );
};

export default SupplyAssetNative;
