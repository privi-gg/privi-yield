// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

library Errors {
    error InvalidTxProof();
    error InvalidMerkleRoot();
    error InputNullifierAlreadySpent();
    error InvalidExtDataHash();
    error InvalidPublicScaledAmount();
    error InvalidScaledAmount(uint256 scaledAmount);
    error ZeroRecipientAddress();
    error DepositAmountTooHigh(uint256 amount, uint256 maxAmountAllowed);

    error InputOutOfFieldSize(bytes32 leaf);
    error MerkleTreeFull();
    error InvalidMerkleTreeDepth(uint256 depth);
}
