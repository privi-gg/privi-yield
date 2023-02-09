import {
  Box,
  Button,
  Divider,
  Heading,
  HStack,
  Image,
  Spinner,
  StackProps,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import logger from 'utils/logger';
import { isDev, testShieldedPk1 } from 'config/env';
import { useUI } from 'contexts/ui';
import { APP_NAME, SIGN_MESSAGE } from 'config/constants';
import { useSignMessage } from 'wagmi';
import { ArrowRightIcon, KeyIcon } from 'components/icons';
import { useState } from 'react';
import { FormTextInput } from 'components/form';
import { generateKeyPairFromSignature } from 'utils/pool';

const schema = yup.object().shape({
  privateKey: yup
    .string()
    .required('Required')
    .matches(/^(0x)?([A-Fa-f0-9]{64})$/, 'Invalid Private Key'),
});

interface ILogInInput {
  privateKey: string;
}

const defaultValues = {
  privateKey: isDev ? testShieldedPk1 : '',
};

const AccountLogIn: React.FC<StackProps> = ({ ...props }) => {
  const { closeModal } = useUI();
  const [showLogInForm, setShowLogInForm] = useState(false);
  const { control, handleSubmit } = useForm<ILogInInput>({
    resolver: yupResolver(schema),
    defaultValues,
  });
  const { isLoading: isSignatureLoading, signMessageAsync } = useSignMessage({
    message: SIGN_MESSAGE,
  });
  const { logIn } = useShieldedAccount();

  const handleWalletLogin = async () => {
    const signature = await signMessageAsync();
    const keyPair = generateKeyPairFromSignature(signature);
    logIn(keyPair.privateKey);
    closeModal();
  };

  const submit = (data: any) => {
    logger.info('Form input:', data);
    if (data.privateKey) {
      logIn(data.privateKey);
      closeModal();
    }
  };

  if (isSignatureLoading) {
    return (
      <VStack alignItems="stretch" spacing={6} py={8} {...props}>
        <Heading textAlign="center" fontSize="xl">
          Log in to {APP_NAME}
        </Heading>
        <Divider />
        <VStack textAlign="center" spacing={4} py={4}>
          <Spinner size="lg" />
          <Text>Waiting for signature</Text>
          <Text color="gray.400">Sign message in your wallet</Text>
        </VStack>
      </VStack>
    );
  }

  return (
    <VStack alignItems="stretch" spacing={6} py={8} {...props}>
      <Heading textAlign="center" fontSize="xl">
        Log in to {APP_NAME}
      </Heading>
      <Divider />

      <Box py={4} px={8}>
        {showLogInForm ? (
          <VStack as="form" onSubmit={handleSubmit(submit)} alignItems="stretch" spacing={4}>
            <FormTextInput label="Enter Shielded Private Key" name="privateKey" control={control} />
            <Button type="submit">Log In</Button>
            <Button onClick={() => setShowLogInForm(false)} variant="ghost" colorScheme="gray">
              Back
            </Button>
          </VStack>
        ) : (
          <Box>
            <VStack alignItems="stretch" alignSelf="stretch" pb={8}>
              <HStack
                as="button"
                justify="space-between"
                alignItems="center"
                rounded="md"
                p={4}
                bgColor="gray.100"
                _hover={{ bgColor: 'gray.200' }}
                onClick={handleWalletLogin}
              >
                <HStack spacing={4}>
                  <Image boxSize={6} src="/images/metamask.png" alt="metamask" />
                  <Text fontWeight="bold">MetaMask</Text>
                </HStack>
                <ArrowRightIcon />
              </HStack>
              <HStack
                as="button"
                justify="space-between"
                alignItems="center"
                rounded="md"
                p={4}
                bgColor="gray.100"
                _hover={{ bgColor: 'gray.200' }}
                onClick={() => setShowLogInForm(true)}
              >
                <HStack spacing={4}>
                  <KeyIcon color="green" />
                  <Text fontWeight="bold">Using Shielded Private Key</Text>
                </HStack>
                <ArrowRightIcon />
              </HStack>
            </VStack>
            <Divider />

            <Box textAlign="center" pt={6}>
              New to Ethereum? Learn more about wallets.
            </Box>
          </Box>
        )}
      </Box>
    </VStack>
  );
};

export default AccountLogIn;
