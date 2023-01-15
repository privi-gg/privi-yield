import { useEffect, useState } from 'react';
import { Button, Divider, StackProps, VStack } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAccount, useFeeData } from 'wagmi';
import logger from 'utils/logger';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import useToast from 'hooks/toast';
import useInstance from 'hooks/instance';
import { BigNumber, BigNumberish } from 'ethers';
import { usePoolContract } from 'hooks/contracts';
import { FormTextInput, FormSelect } from 'components/form';
// import { calculateRelayerFee } from 'utils/pool';
// import { prepareWithdraw } from 'services/proof';
// import { usePoolTransact } from 'api/tx';
// import { parseEther } from 'utils/bigInt';
// import TxFeeInfo from './TxFeeInfo';
// import { useRelayTx } from 'api/relayer';
// import { useRelayers } from 'contexts/relayJobs';

const schema = yup.object().shape({
  amount: yup.number().typeError('Invalid number').positive('Invalid number').required('Required'),
  recipient: yup
    .string()
    .matches(/^(0x)?([A-Fa-f0-9]{40})$/, 'Invalid Address')
    .required('Required'),
  txMethod: yup.string().required('Required'),
  relayerUrl: yup.string(),
});

interface IWithdrawInput {
  amount: number;
  recipient: string;
  txMethod: string;
  relayerUrl: string;
}

interface IWithdrawFormProps extends Omit<StackProps, 'onSubmit'> {
  onSubmit?: (data: IWithdrawInput) => void;
}

const WithdrawForm: React.FC<IWithdrawFormProps> = ({ onSubmit, ...props }) => {
  const [isLoading, setLoading] = useState(false);
  const { showErrorToast, showInfoToast } = useToast();
  const { address } = useAccount();
  const { keyPair, isLoggedIn } = useShieldedAccount();
  const instanceInfo = useInstance();
  const pool = usePoolContract();
  //   const { writeAsync: transact } = usePoolTransact();
  //   const { data: relayData, isError, mutateAsync: relayTx } = useRelayTx();
  //   const { data: feeData } = useFeeData();
  //   const { saveJob, relayersList } = useRelayers();

  const { control, handleSubmit, setValue, getValues, watch } = useForm<IWithdrawInput>({
    resolver: yupResolver(schema),
    defaultValues: {
      amount: 0.01,
      recipient: address,
      relayerUrl: '', //relayersList[0].url,
      txMethod: 'relayer',
    },
  });

  const [txMethod, amount, relayerUrl] = watch(['txMethod', 'amount', 'relayerUrl']);

  //   useEffect(() => {
  //     // Sets address if not already filled
  //     const v = getValues('recipient');
  //     if (!v && address) {
  //       setValue('recipient', address);
  //     }
  //     setValue('relayerUrl', relayersList[0].url);
  //     // eslint-disable-next-line react-hooks/exhaustive-deps
  //   }, [address, relayersList]);

  //   useEffect(() => {
  //     if (!relayData) return;
  //     saveJob({
  //       id: relayData.id,
  //       relayer: relayData.url,
  //       type: 'withdraw',
  //       amount,
  //       chainId: instanceInfo.chainId,
  //     });
  //     // eslint-disable-next-line react-hooks/exhaustive-deps
  //   }, [relayData]);

  const submit = (data: IWithdrawInput) => {
    setLoading(true);
    logger.info('Form input:', data);
    startWithdraw(data)
      .then((success) => {
        if (!success) return;
        showInfoToast({
          description: txMethod === 'wallet' ? 'Transaction Sent!' : 'Relay Job Sent!',
        });
      })
      .catch((error) => {
        logger.error(error);
        showErrorToast({ description: 'Error Occurred!' });
      })
      .finally(() => setLoading(false));
  };

  const startWithdraw = async (data: IWithdrawInput) => {
    logger.info('Preparing withdraw...');

    // const amountWei = parseEther(`${data.amount}`);
    // const receiverAddress = data.recipient;

    // let fee: BigNumberish = 0;
    // let relayerAddress: BigNumberish = 0;
    // if (data.txMethod === 'relayer') {
    //   const relayer = relayersList.find((rel: any) => rel.url === data.relayerUrl);
    //   const { totalFee } = calculateRelayerFee({
    //     amount: amountWei,
    //     relayer,
    //     gasPrice: feeData?.gasPrice as BigNumber,
    //   });

    //   fee = totalFee;
    //   relayerAddress = relayer?.address as string;
    // }

    // const { proofArgs, extData } = await prepareWithdraw(
    //   {
    //     pool,
    //     amount: amountWei,
    //     spenderKeyPair: keyPair,
    //     receiverAddress,
    //     fee,
    //     relayer: relayerAddress,
    //   },
    //   instanceInfo,
    // );

    // logger.info(`Sending tx: Method: ${data.txMethod}`);

    // if (data.txMethod === 'wallet') {
    //   await transact({
    //     recklesslySetUnpreparedArgs: [proofArgs, extData],
    //   });
    // } else {
    //   await relayTx({
    //     url: relayerUrl,
    //     chainId: instanceInfo.chainId,
    //     args: { proofArgs, extData },
    //   });
    // }

    return true;
  };

  const txMethodOptions = [
    { label: 'Wallet', value: 'wallet' },
    { label: 'Relayer', value: 'relayer' },
  ];

  return (
    <VStack
      as="form"
      onSubmit={handleSubmit(submit)}
      alignItems="stretch"
      spacing={8}
      w="full"
      maxW={600}
      bgColor="primary.50"
      p={8}
      rounded="md"
    >
      <FormTextInput label="Token Amount" name="amount" control={control} />
      <FormTextInput label="Recipient Address" name="recipient" control={control} />
      <FormSelect
        label="Transaction Method"
        name="txMethod"
        control={control}
        options={txMethodOptions}
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        _select={{ maxW: '40%' }}
      />
      {txMethod === 'relayer' && (
        <FormSelect
          label="Relayer"
          name="relayerUrl"
          control={control}
          //   options={relayersList.map((rel: any) => ({ label: rel.name, value: rel.url }))}
          options={[]}
          display="flex"
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          _select={{ maxW: '70%' }}
        />
      )}

      {/* <Divider /> */}

      {/* <TxFeeInfo amount={amount} relayerUrl={relayerUrl} txMethod={txMethod} /> */}

      <Button type="submit" disabled={!isLoggedIn} isLoading={isLoading}>
        {isLoggedIn ? 'Withdraw' : 'Log In First'}
      </Button>
    </VStack>
  );
};

export default WithdrawForm;
