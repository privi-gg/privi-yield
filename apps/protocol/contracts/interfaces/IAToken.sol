// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IAToken {
    function balanceOf(address account) external view returns (uint256);

    function transfer(address receiver, uint256 amount) external returns (bool);

    function approve(address spender, uint256 amount) external returns (bool);

    function POOL() external view returns (address);
}
