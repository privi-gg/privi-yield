// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IMerkleTree {
  function hashLeftRight(bytes32 left, bytes32 right) external view returns (bytes32);

  function isKnownRoot(bytes32 root) external view returns (bool);

  function getLastRoot() external view returns (bytes32);
}
