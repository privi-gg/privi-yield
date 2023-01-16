// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import './interfaces/IVerifier.sol';
import './interfaces/IMixerPool.sol';
import './interfaces/IAavePool.sol';
import './interfaces/IAavePoolAddressProvider.sol';
import './interfaces/IAToken.sol';
import './MerkleTree.sol';
import {DataTypes} from './libraries/DataTypes.sol';
import {WadRayMath} from './libraries/WadRayMath.sol';
import {MathUtils} from './libraries/MathUtils.sol';
import {Errors} from './libraries/Errors.sol';

contract MixerPool is IMixerPool, MerkleTree, ReentrancyGuard {
  using WadRayMath for uint256;
  using SafeERC20 for IERC20;

  uint256 public constant MAX_EXT_AMOUNT = 2**248;
  uint256 public constant MAX_FEE = 2**248;
  uint256 public constant MIN_EXT_AMOUNT_LIMIT = 0.5 ether;

  IERC20 public immutable token;
  IAavePoolAddressProvider public immutable aavePoolAddressProvider;

  IVerifier public immutable verifier2;
  IVerifier public immutable verifier16;

  uint256 public maxDepositAmount;
  uint256 public scaledDust;

  mapping(bytes32 => bool) public nullifierHashes;

  constructor(
    uint32 numLevels_,
    uint256 maxDepositAmount_,
    IERC20 token_,
    IAavePoolAddressProvider aavePoolAddressProvider_,
    address hasher_,
    IVerifier verifier2_,
    IVerifier verifier16_
  ) MerkleTree(numLevels_, hasher_) {
    maxDepositAmount = maxDepositAmount_;
    token = token_;
    aavePoolAddressProvider = aavePoolAddressProvider_;
    verifier2 = verifier2_;
    verifier16 = verifier16_;
  }

  function deposit(
    uint256 amount,
    DataTypes.ProofArgs calldata args,
    DataTypes.ExtData calldata extData
  ) public {
    if (amount > maxDepositAmount) revert Errors.DepositAmountTooHigh(amount, maxDepositAmount);

    (address aavePoolAddress, , uint256 nextLiquidityIndex) = getAavePoolAndReserveData();

    uint256 calcScaledAmount = amount.rayDiv(nextLiquidityIndex);
    uint256 extScaledAmount = extData.scaledAmount;

    if (extScaledAmount > calcScaledAmount) revert Errors.InvalidScaledAmount(extScaledAmount);

    scaledDust += calcScaledAmount - extScaledAmount;

    token.safeTransferFrom(msg.sender, address(this), amount);
    token.approve(aavePoolAddress, amount);
    IAavePool(aavePoolAddress).supply(address(token), amount, address(this), 0);

    _transact(args, extData, DataTypes.TxType.DEPOSIT);
  }

  function withdraw(DataTypes.ProofArgs calldata args, DataTypes.ExtData calldata extData) public {
    if (extData.recipient == address(0)) revert Errors.ZeroRecipientAddress();

    _transact(args, extData, DataTypes.TxType.WITHDRAW);

    (
      address aavePoolAddress,
      DataTypes.AaveReserveData memory aaveReserveData,

    ) = getAavePoolAndReserveData();

    uint256 normalizedIncome = getAaveReserveNormalizedIncome();

    uint256 withdrawAmount = extData.scaledAmount.rayMul(normalizedIncome);
    uint256 fee = extData.scaledFee.rayMul(normalizedIncome);
    IAToken(aaveReserveData.aTokenAddress).approve(aavePoolAddress, withdrawAmount);
    IAavePool(aavePoolAddress).withdraw(address(token), withdrawAmount + fee, address(this));

    token.safeTransfer(extData.recipient, withdrawAmount);
    if (fee > 0) {
      token.safeTransfer(extData.relayer, fee);
    }
  }

  function transfer(DataTypes.ProofArgs calldata args, DataTypes.ExtData calldata extData) public {
    _transact(args, extData, DataTypes.TxType.TRANSFER);

    if (extData.scaledFee > 0) {
      (
        address aavePoolAddress,
        DataTypes.AaveReserveData memory aaveReserveData,

      ) = getAavePoolAndReserveData();

      uint256 normalizedIncome = IAavePool(aavePoolAddress).getReserveNormalizedIncome(
        address(token)
      );
      uint256 fee = extData.scaledFee.rayMul(normalizedIncome);

      IAToken(aaveReserveData.aTokenAddress).approve(aavePoolAddress, fee);
      token.safeTransfer(extData.relayer, fee);
    }
  }

  function getAavePoolAndReserveData()
    public
    view
    returns (
      address,
      DataTypes.AaveReserveData memory,
      uint256
    )
  {
    address aavePoolAddress = aavePoolAddressProvider.getPool();
    DataTypes.AaveReserveData memory reserveData = IAavePool(aavePoolAddress).getReserveData(
      address(token)
    );

    uint256 cumulatedLiquidityInterest = MathUtils.calculateLinearInterest(
      reserveData.currentLiquidityRate,
      reserveData.lastUpdateTimestamp
    );
    uint256 nextLiquidityIndex = cumulatedLiquidityInterest.rayMul(reserveData.liquidityIndex);
    return (aavePoolAddress, reserveData, nextLiquidityIndex);
  }

  function getAaveReserveNormalizedIncome() public view returns (uint256) {
    address aavePoolAddress = aavePoolAddressProvider.getPool();
    return IAavePool(aavePoolAddress).getReserveNormalizedIncome(address(token));
  }

  function getBalance(uint256 scaledAmount) public view returns (uint256) {
    uint256 normalizedIncome = getAaveReserveNormalizedIncome();
    uint256 balance = scaledAmount.rayMul(normalizedIncome);
    return balance;
  }

  function getAaveNextLiquidityIndex() public view returns (uint256) {
    (, , uint256 nextLiquidityIndex) = getAavePoolAndReserveData();
    return nextLiquidityIndex;
  }

  function getAaveScaledAmountAdjusted(uint256 amount, uint256 deltaSec)
    public
    view
    returns (uint256, uint256)
  {
    address aavePoolAddress = aavePoolAddressProvider.getPool();
    DataTypes.AaveReserveData memory reserveData = IAavePool(aavePoolAddress).getReserveData(
      address(token)
    );
    uint256 cumulatedLiquidityInterest = MathUtils.calculateLinearInterestAdjusted(
      reserveData.currentLiquidityRate,
      reserveData.lastUpdateTimestamp,
      deltaSec
    );
    uint256 nextLiquidityIndex = cumulatedLiquidityInterest.rayMul(reserveData.liquidityIndex);
    uint256 scaledAmount = amount.rayDiv(nextLiquidityIndex);
    return (scaledAmount, nextLiquidityIndex);
  }

  function isSpent(bytes32 nullifierHash) public view returns (bool) {
    return nullifierHashes[nullifierHash];
  }

  function getPublicScaledAmount(
    DataTypes.TxType txType,
    uint256 extScaledAmount,
    uint256 scaledFee
  ) public pure returns (uint256) {
    if (txType == DataTypes.TxType.DEPOSIT) {
      require(extScaledAmount >= scaledFee, 'Ext amount less than scaledFee');
    }

    // require(scaledFee < MAX_FEE, 'Invalid scaledFee');
    // require(extScaledAmount < MAX_EXT_AMOUNT, 'Invalid ext amount');

    uint256 publicScaledAmount;

    if (txType == DataTypes.TxType.DEPOSIT) {
      publicScaledAmount = extScaledAmount;
    } else if (txType == DataTypes.TxType.WITHDRAW) {
      publicScaledAmount = FIELD_SIZE - (extScaledAmount + scaledFee);
    } else if (txType == DataTypes.TxType.TRANSFER) {
      publicScaledAmount = scaledFee;
    } else {
      revert('Invalid TxType');
    }

    return publicScaledAmount;
  }

  function verifyProof(DataTypes.ProofArgs calldata args) public view returns (bool) {
    if (args.inputNullifiers.length == 2) {
      return
        verifier2.verifyProof(
          args.proof.a,
          args.proof.b,
          args.proof.c,
          [
            uint256(args.root),
            args.publicScaledAmount,
            uint256(args.extDataHash),
            uint256(args.inputNullifiers[0]),
            uint256(args.inputNullifiers[1]),
            uint256(args.outputCommitments[0]),
            uint256(args.outputCommitments[1])
          ]
        );
    } else if (args.inputNullifiers.length == 16) {
      return
        verifier16.verifyProof(
          args.proof.a,
          args.proof.b,
          args.proof.c,
          [
            uint256(args.root),
            args.publicScaledAmount,
            uint256(args.extDataHash),
            uint256(args.inputNullifiers[0]),
            uint256(args.inputNullifiers[1]),
            uint256(args.inputNullifiers[2]),
            uint256(args.inputNullifiers[3]),
            uint256(args.inputNullifiers[4]),
            uint256(args.inputNullifiers[5]),
            uint256(args.inputNullifiers[6]),
            uint256(args.inputNullifiers[7]),
            uint256(args.inputNullifiers[8]),
            uint256(args.inputNullifiers[9]),
            uint256(args.inputNullifiers[10]),
            uint256(args.inputNullifiers[11]),
            uint256(args.inputNullifiers[12]),
            uint256(args.inputNullifiers[13]),
            uint256(args.inputNullifiers[14]),
            uint256(args.inputNullifiers[15]),
            uint256(args.outputCommitments[0]),
            uint256(args.outputCommitments[1])
          ]
        );
    } else {
      revert('Unsupported input count');
    }
  }

  function _transact(
    DataTypes.ProofArgs calldata args,
    DataTypes.ExtData calldata extData,
    DataTypes.TxType txType
  ) internal nonReentrant {
    if (!isKnownRoot(args.root)) revert Errors.InvalidMerkleRoot();

    for (uint256 i = 0; i < args.inputNullifiers.length; ++i) {
      if (isSpent(args.inputNullifiers[i])) revert Errors.InputNullifierAlreadySpent();
    }

    uint256 calcExtDataHash = uint256(keccak256(abi.encode(extData))) % FIELD_SIZE;
    if (calcExtDataHash != uint256(args.extDataHash)) revert Errors.InvalidExtDataHash();

    uint256 calcPublicScaledAmount = getPublicScaledAmount(
      txType,
      extData.scaledAmount,
      extData.scaledFee
    );
    if (calcPublicScaledAmount != args.publicScaledAmount)
      revert Errors.InvalidPublicScaledAmount();

    if (!verifyProof(args)) revert Errors.InvalidTxProof();

    for (uint256 i = 0; i < args.inputNullifiers.length; ++i) {
      nullifierHashes[args.inputNullifiers[i]] = true;
    }

    _insert(args.outputCommitments[0], args.outputCommitments[1]);

    emit NewCommitment(args.outputCommitments[0], nextIndex - 2, extData.encryptedOutput1);
    emit NewCommitment(args.outputCommitments[1], nextIndex - 1, extData.encryptedOutput2);
    for (uint256 i = 0; i < args.inputNullifiers.length; i++) {
      emit NewNullifier(args.inputNullifiers[i]);
    }
  }
}
