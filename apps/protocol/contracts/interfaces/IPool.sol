// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ProofArgs, ExtData, AaveReserveData} from "../libraries/DataTypes.sol";

interface IPool {
    event CommitmentInserted(bytes32 commitment, uint256 leafIndex, bytes encryptedOutput);
    event NullifierUsed(bytes32 nullifier);

    function supply(ProofArgs calldata args, ExtData calldata extData) external returns (uint256);

    function withdraw(ProofArgs calldata args, ExtData calldata extData) external returns (uint256);

    function transfer(ProofArgs calldata args, ExtData calldata extData) external;

    function verifyProof(ProofArgs calldata args) external view returns (bool);

    function getAavePoolAndReserveData()
        external
        view
        returns (
            address,
            AaveReserveData memory,
            uint256
        );
}
