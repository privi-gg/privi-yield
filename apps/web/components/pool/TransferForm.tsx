// import * as yup from 'yup';
// import { yupResolver } from '@hookform/resolvers/yup';
// import { useForm } from 'react-hook-form';
// import { Button, Divider, StackProps, VStack } from '@chakra-ui/react';
// import { FormInput, FormSelect } from 'components/common/form';
// import { useFeeData } from 'wagmi';
// import useToast from 'hooks/toast';
// import { useShieldedAccount } from 'contexts/shieldedAccount';
// import usePoolContract from 'hooks/contracts';
// import { useEffect, useState } from 'react';
// import { usePoolTransact } from 'api/tx';
// import logger from 'utils/logger';
// import { parseEther, toChecksumAddress } from 'utils/bigInt';
// import { KeyPair } from 'services/keyPair';
// import { calculateRelayerFee, fetchShieldedAddressOf } from 'utils/pool';
// import { prepareTransfer } from 'services/proof';
// import { isDev } from 'config/env';
// import useInstance from 'hooks/instance';
// import { useRelayTx } from 'api/relayer';
// import { useRelayers } from 'contexts/relayJobs';
// import { BigNumber, BigNumberish } from 'ethers';
// import TxFeeInfo from './TxFeeInfo';

// const schema = yup.object().shape({
//   amount: yup.number().typeError('Invalid number').positive('Invalid number').required('Required'),
//   recipient: yup
//     .string()
//     .matches(/^(0x)?([A-Fa-f0-9]{40})$/, 'Invalid Address')
//     .required('Required'),
// });

// interface ITransferInput {
//   amount: number;
//   recipient: string;
//   txMethod: string;
//   relayerUrl: string;
// }

// const TransferForm: React.FC<StackProps> = ({ ...props }) => {
//   const [isLoading, setLoading] = useState(false);
//   const { showErrorToast, showInfoToast } = useToast();
//   const { keyPair, isLoggedIn } = useShieldedAccount();
//   const instanceInfo = useInstance();
//   const pool = usePoolContract();
//   const { writeAsync: transact } = usePoolTransact();
//   const { data: relayData, isError, mutateAsync: relayTx } = useRelayTx();
//   const { data: feeData } = useFeeData();
//   const { saveJob, relayersList } = useRelayers();

//   const { control, handleSubmit, watch, setValue } = useForm<ITransferInput>({
//     resolver: yupResolver(schema),
//     defaultValues: {
//       amount: 0.01,
//       recipient: isDev ? '0x3C6860DA6ED0939AE9f668476ca9B48Bcc4Ea939' : undefined,
//       relayerUrl: relayersList[0].url,
//       txMethod: 'relayer',
//     },
//   });

//   const [txMethod, amount, relayerUrl] = watch(['txMethod', 'amount', 'relayerUrl']);

//   useEffect(() => {
//     if (!relayData) return;
//     saveJob({
//       id: relayData.id,
//       relayer: relayData.url,
//       type: 'transfer',
//       amount,
//       chainId: instanceInfo.chainId,
//     });
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [relayData]);

//   useEffect(() => {
//     setValue('relayerUrl', relayersList[0].url);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [relayersList]);

//   const submit = (data: ITransferInput) => {
//     setLoading(true);
//     logger.info('Form input:', data);
//     startTransfer(data)
//       .then((success) => {
//         if (!success) return;
//         showInfoToast({
//           description: txMethod === 'wallet' ? 'Transaction Sent!' : 'Relay Job Sent!',
//         });
//       })
//       .catch((error) => {
//         logger.error(error);
//         showErrorToast({ description: 'Error Occurred!' });
//       })
//       .finally(() => setLoading(false));
//   };

//   const startTransfer = async (data: ITransferInput) => {
//     logger.info('Preparing transfer...');

//     const amountWei = parseEther(`${data.amount}`);
//     const recipientAddress = toChecksumAddress(data.recipient);

//     const receiverSAddress = await fetchShieldedAddressOf(recipientAddress, pool);
//     if (!receiverSAddress) {
//       showErrorToast({ description: 'Recipient is not registered yet!' });
//       return false;
//     }

//     let fee: BigNumberish = 0;
//     let relayerAddress: BigNumberish = 0;
//     if (data.txMethod === 'relayer') {
//       const relayer = relayersList.find((rel: any) => rel.url === data.relayerUrl);
//       const { totalFee } = calculateRelayerFee({
//         relayer,
//         gasPrice: feeData?.gasPrice as BigNumber,
//       });

//       fee = totalFee;
//       relayerAddress = relayer?.address as string;
//     }

//     const receiverKeyPair = KeyPair.fromAddress(receiverSAddress);
//     if (receiverKeyPair.equals(keyPair)) {
//       showErrorToast({ description: 'Recipient and sender are same!' });
//       return false;
//     }

//     const keyPairs = {
//       spender: keyPair,
//       receiver: receiverKeyPair,
//     };

//     const { proofArgs, extData } = await prepareTransfer(
//       { pool, amount: amountWei, keyPairs, fee, relayer: relayerAddress },
//       instanceInfo,
//     );

//     logger.info('Sending tx...');
//     if (data.txMethod === 'wallet') {
//       await transact({
//         recklesslySetUnpreparedArgs: [proofArgs, extData],
//       });
//     } else {
//       await relayTx({
//         url: relayerUrl,
//         chainId: instanceInfo.chainId,
//         args: { proofArgs, extData },
//       });
//     }

//     return true;
//   };

//   const txMethodOptions = [
//     { label: 'Wallet', value: 'wallet' },
//     { label: 'Relayer', value: 'relayer' },
//   ];

//   return (
//     <VStack as="form" onSubmit={handleSubmit(submit)} alignItems="stretch" spacing={4} {...props}>
//       <FormInput label="Token Amount" name="amount" control={control} />
//       <FormInput label="Recipient Address" name="recipient" control={control} />

//       <FormSelect
//         label="Transaction Method"
//         name="txMethod"
//         control={control}
//         options={txMethodOptions}
//         display="flex"
//         flexDirection="row"
//         justifyContent="space-between"
//         alignItems="center"
//         _select={{ maxW: '40%' }}
//       />
//       {txMethod === 'relayer' && (
//         <FormSelect
//           label="Relayer"
//           name="relayerUrl"
//           control={control}
//           options={relayersList.map((rel: any) => ({ label: rel.name, value: rel.url }))}
//           display="flex"
//           flexDirection="row"
//           justifyContent="space-between"
//           alignItems="center"
//           _select={{ maxW: '70%' }}
//         />
//       )}

//       <Divider />

//       <TxFeeInfo
//         amount={amount}
//         relayerUrl={relayerUrl}
//         txMethod={txMethod}
//         isAmountPublic={false}
//       />
//       <Button type="submit" disabled={!isLoggedIn} isLoading={isLoading}>
//         {isLoggedIn ? 'Transfer' : 'Log In First'}
//       </Button>
//     </VStack>
//   );
// };

// export default TransferForm;
