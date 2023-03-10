// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

enum TxType {
    SUPPLY,
    WITHDRAW,
    TRANSFER
}

struct ExtData {
    address recipient;
    uint256 scaledAmount;
    address relayer;
    uint256 scaledFee;
    bytes encryptedOutput1;
    bytes encryptedOutput2;
}

struct Proof {
    uint256[2] a;
    uint256[2][2] b;
    uint256[2] c;
}

struct ProofArgs {
    Proof proof;
    bytes32 root;
    bytes32[] inputNullifiers;
    bytes32[2] outputCommitments;
    uint256 publicScaledAmount;
    bytes32 extDataHash;
}

struct AaveReserveConfigurationMap {
    uint256 data;
}

struct AaveReserveData {
    AaveReserveConfigurationMap configuration;
    uint128 liquidityIndex;
    uint128 currentLiquidityRate;
    uint128 variableBorrowIndex;
    uint128 currentVariableBorrowRate;
    uint128 currentStableBorrowRate;
    uint40 lastUpdateTimestamp;
    uint16 id;
    address aTokenAddress;
    address stableDebtTokenAddress;
    address variableDebtTokenAddress;
    address interestRateStrategyAddress;
    uint128 accruedToTreasury;
    uint128 unbacked;
    uint128 isolationModeTotalDebt;
}
