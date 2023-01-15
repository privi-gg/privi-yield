import {
  Box,
  Button,
  Checkbox,
  Divider,
  Heading,
  HStack,
  StackProps,
  Text,
  Textarea,
  useClipboard,
  VStack,
} from '@chakra-ui/react';
import { useRegisterAccount } from 'api/registerAccount';
import { CopyIcon, DownloadIcon } from 'components/icons';
import { APP_NAME } from 'config/constants';
import { useUI } from 'contexts/ui';
import { FC, useEffect, useState } from 'react';
import logger from 'utils/logger';
// import { generateKeyPairFromSignature } from 'utils/stream';

const AccountRegister: FC<StackProps> = ({ ...props }) => {
  const { modalData, closeModal } = useUI();
  const [privateKey, setPrivateKey] = useState<string>('');
  const { hasCopied, onCopy } = useClipboard(privateKey);
  const [isAgreed, setIsAgreed] = useState(false);
  const { data: tx, error: txError, isLoading, isSuccess, write: register } = useRegisterAccount();

  useEffect(() => {
    if (!modalData?.signature) return;
    // const keyPair = generateKeyPairFromSignature(modalData.signature);
    // setPrivateKey(keyPair.privateKey);
  }, [modalData.signature]);

  useEffect(() => {
    if (isSuccess) closeModal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const handleRegister = () => {
    if (!privateKey) return;
    // const keyPair = generateKeyPairFromSignature(modalData.signature);

    // const shieldedAddress = keyPair.address();
    // logger.info(`Registering account:`, shieldedAddress);
    // console.log({ register });

    // register?.({
    //   recklesslySetUnpreparedArgs: [shieldedAddress],
    // });
  };

  return (
    <VStack alignItems="stretch" spacing={6} py={8} {...props}>
      <Heading textAlign="center" fontSize="xl">
        Back up Shielded Private Key
      </Heading>
      <Divider />

      <Box px={8}>
        <VStack alignItems="stretch">
          <Text color="gray.500">
            To access your account in the future, it is important to back up your shielded key. DO
            NOT reveal your key to anyone, including the {APP_NAME} developers.
          </Text>
          {/* <Textarea value={privateKey} noOfLines={10} readOnly /> */}
          <HStack justify="space-around" py={4} spacing={4}>
            <Button leftIcon={<DownloadIcon />} flex={1}>
              Download
            </Button>
            <Button
              leftIcon={<CopyIcon />}
              colorScheme="gray"
              alignSelf="flex-end"
              variant="outline"
              onClick={onCopy}
              flex={1}
            >
              {hasCopied ? 'Copied!' : 'Copy'}
            </Button>
          </HStack>
        </VStack>

        <Box py={2}>
          <Checkbox isChecked={isAgreed} onChange={() => setIsAgreed(!isAgreed)}>
            I backed up Shielded Private Key
          </Checkbox>
        </Box>

        <Button
          w="full"
          mt={8}
          onClick={handleRegister}
          isLoading={isLoading}
          disabled={!isAgreed}
          alignSelf="stretch"
        >
          Register
        </Button>
      </Box>
    </VStack>
  );
};

export default AccountRegister;
