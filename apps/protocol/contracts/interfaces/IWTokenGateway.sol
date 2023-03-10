// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
import {ProofArgs, ExtData, AaveReserveData} from "../helpers/DataTypes.sol";

interface IWTokenGateway {
    error NotEnoughTokensSent(uint256 sent, uint256 required);
    error RecipientNotGateway(address recipient, address gateway);

    function supply(
        address pool,
        ProofArgs calldata args,
        ExtData calldata extData
    ) external payable;

    function withdraw(
        address pool,
        address unwrappedTokenReceiver,
        ProofArgs calldata args,
        ExtData calldata extData
    ) external;
}
