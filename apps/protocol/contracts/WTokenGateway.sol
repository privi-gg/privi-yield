// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IWToken.sol";
import "./interfaces/IPool.sol";
import "./interfaces/IWTokenGateway.sol";
import {WadRayMath} from "./libraries/WadRayMath.sol";
import {ProofArgs, ExtData, AaveReserveData} from "./helpers/DataTypes.sol";

contract WTokenGateway is IWTokenGateway {
    using WadRayMath for uint256;
    IWToken public immutable wToken;

    constructor(address wToken_) {
        wToken = IWToken(wToken_);
    }

    function supply(
        address pool,
        ProofArgs calldata args,
        ExtData calldata extData
    ) external payable {
        (, , uint256 nextLiquidityIndex) = IPool(pool).getAavePoolAndReserveData();

        uint256 supplyAmount = extData.scaledAmount.rayMul(nextLiquidityIndex);

        if (msg.value < supplyAmount) {
            revert NotEnoughTokensSent(msg.value, supplyAmount);
        }

        wToken.deposit{value: supplyAmount}();
        wToken.approve(pool, supplyAmount);

        IPool(pool).supply(args, extData);

        // Refund change back to the sender
        uint256 changeAmount = msg.value - supplyAmount;
        if (changeAmount != 0) {
            _safeTransferETH(msg.sender, changeAmount);
        }
    }

    function withdraw(
        address pool,
        address unwrappedTokenReceiver,
        ProofArgs calldata args,
        ExtData calldata extData
    ) external {
        if (extData.recipient != address(this)) {
            revert RecipientNotGateway(extData.recipient, address(this));
        }

        uint256 withdrawAmount = IPool(pool).withdraw(args, extData);

        wToken.approve(address(wToken), withdrawAmount);
        wToken.withdraw(withdrawAmount);

        _safeTransferETH(unwrappedTokenReceiver, withdrawAmount);
    }

    function _safeTransferETH(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, "ETH_TRANSFER_FAILED");
    }

    receive() external payable {}
}
