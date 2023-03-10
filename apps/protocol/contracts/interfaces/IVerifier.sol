// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IVerifier {
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[7] memory inputs
    ) external view returns (bool r);

    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[21] memory inputs
    ) external view returns (bool r);
}
