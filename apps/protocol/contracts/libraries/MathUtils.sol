// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {WadRayMath} from "./WadRayMath.sol";

library MathUtils {
    using WadRayMath for uint256;

    uint256 internal constant SECONDS_PER_YEAR = 365 days;

    /**
     * @dev Function to calculate the interest accumulated using a linear interest rate formula
     * @param rate The interest rate, in ray
     * @param lastUpdateTimestamp The timestamp of the last update of the interest
     * @return The interest rate linearly accumulated during the timeDelta, in ray
     **/
    function calculateLinearInterest(uint256 rate, uint40 lastUpdateTimestamp)
        internal
        view
        returns (uint256)
    {
        uint256 result = rate * (block.timestamp - uint256(lastUpdateTimestamp));
        unchecked {
            result = result / SECONDS_PER_YEAR;
        }

        return WadRayMath.RAY + result;
    }

    function calculateLinearInterestAdjusted(
        uint256 rate,
        uint40 lastUpdateTimestamp,
        uint256 adjustedDeltaTimestamp
    ) internal view returns (uint256) {
        uint256 result = rate *
            (block.timestamp + adjustedDeltaTimestamp - uint256(lastUpdateTimestamp));
        unchecked {
            result = result / SECONDS_PER_YEAR;
        }

        return WadRayMath.RAY + result;
    }
}
