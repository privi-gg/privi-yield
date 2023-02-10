// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ProofArgs, ExtData, AaveReserveData} from "../libraries/DataTypes.sol";

interface IPool {
    event CommitmentInserted(bytes32 commitment, uint256 leafIndex, bytes encryptedOutput);
    event NullifierUsed(bytes32 nullifier);

    error InvalidTxProof();
    error InvalidMerkleRoot();
    error InputNullifierAlreadySpent();
    error InvalidExtDataHash();
    error InvalidPublicScaledAmount();
    error InvalidScaledAmount(uint256 scaledAmount);
    error ZeroRecipientAddress();
    error SupplyExceedsMaxLimit(uint256 amount, uint256 maxAmountAllowed);

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
