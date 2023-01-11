// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IAavePoolAddressProvider {
  function getPool() external view returns (address);

  function getAddress(bytes32 id) external view returns (address);
}
