// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {DataTypes} from '../types/DataTypes.sol';

interface IMixerPool {
  event NewCommitment(bytes32 commitment, uint256 leafIndex, bytes encryptedOutput);
  event NewNullifier(bytes32 nullifier);

  // function transact(DataTypes.ProofArgs memory args, DataTypes.ExtData memory extData) external;

  function verifyProof(DataTypes.ProofArgs calldata args) external view returns (bool);
}
