// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {DataTypes} from '../libraries/DataTypes.sol';

interface IAavePool {
  function supply(
    address asset,
    uint256 amount,
    address onBehalfOf,
    uint16 referralCode
  ) external;

  function withdraw(
    address asset,
    uint256 amount,
    address to
  ) external returns (uint256);

  function getReserveNormalizedIncome(address asset) external view returns (uint256);

  function getReserveData(address asset) external view returns (DataTypes.AaveReserveData memory);
}
