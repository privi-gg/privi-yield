// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ProofArgs, ExtData} from "../libraries/DataTypes.sol";

interface IPool {
    event CommitmentInserted(bytes32 commitment, uint256 leafIndex, bytes encryptedOutput);
    event NullifierUsed(bytes32 nullifier);

    function supply(ProofArgs calldata args, ExtData calldata extData) external;

    function withdraw(ProofArgs calldata args, ExtData calldata extData) external;

    function transfer(ProofArgs calldata args, ExtData calldata extData) external;

    function verifyProof(ProofArgs calldata args) external view returns (bool);
}
