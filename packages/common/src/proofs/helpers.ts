import { BigNumber, BigNumberish, utils } from 'ethers';
import { stringifyBNs, toFixedHex } from 'privi-utils';
import { CircuitPath, ExtData } from './types';

export function hashExtData(
  { recipient, scaledAmount, relayer, scaledFee, encryptedOutput1, encryptedOutput2 }: ExtData,
  fieldSize: BigNumberish
) {
  const abi = new utils.AbiCoder();

  const encodedData = abi.encode(
    [
      'tuple(address recipient,uint256 scaledAmount,address relayer,uint256 scaledFee,bytes encryptedOutput1,bytes encryptedOutput2)',
    ],
    [
      {
        recipient: toFixedHex(recipient, 20),
        scaledAmount: toFixedHex(scaledAmount),
        relayer: toFixedHex(relayer, 20),
        scaledFee: toFixedHex(scaledFee),
        encryptedOutput1,
        encryptedOutput2,
      },
    ]
  );
  const hash = utils.keccak256(encodedData);
  return BigNumber.from(hash).mod(fieldSize);
}

export const generateSnarkProof = async ({
  snarkJs,
  inputs,
  circuitPath,
}: {
  snarkJs: any;
  inputs: any;
  circuitPath: CircuitPath;
}) => {
  return snarkJs.groth16.fullProve(stringifyBNs(inputs), circuitPath.circuit, circuitPath.zKey);
};

export const generateSnarkProofSolidity = async ({
  snarkJs,
  inputs,
  circuitPath,
}: {
  snarkJs: any;
  inputs: object;
  circuitPath: CircuitPath;
}) => {
  const { proof, publicSignals } = await generateSnarkProof({
    snarkJs,
    inputs,
    circuitPath,
  });
  const a = [toFixedHex(proof.pi_a[0]), toFixedHex(proof.pi_a[1])];
  const b = [
    [toFixedHex(proof.pi_b[0][1]), toFixedHex(proof.pi_b[0][0])],
    [toFixedHex(proof.pi_b[1][1]), toFixedHex(proof.pi_b[1][0])],
  ];
  const c = [toFixedHex(proof.pi_c[0]), toFixedHex(proof.pi_c[1])];

  return { proof: { a, b, c }, publicSignals };
};
