import { expect } from 'chai';
import { artifacts, ethers } from 'hardhat';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { deployContract } from './helpers/utils';
import { AAVE_POOL_ADDRESS_PROVIDER, ASSET_WETH, TREE_HEIGHT } from './helpers/constants';
import { deployHasher } from './helpers/hasher';
import { KeyPair, Utxo } from '@privi-yield/common';
import { prepareSupplyProof, prepareWithdrawProof } from './helpers/proofs';
import { parseEther, randomHex } from 'privi-utils';

const { utils } = ethers;

const aavePoolAddressProviderArtifact = artifacts.readArtifactSync('IAavePoolAddressProvider');
const aavePoolArtifact = artifacts.readArtifactSync('IAavePool');
const wTokenArtifact = artifacts.readArtifactSync('WTokenMock');
const aTokenArtifact = artifacts.readArtifactSync('IAToken');

const ONE_DAY = 24 * 60 * 60;
const deltaAmount = parseEther('0.0001');

describe('WTokenGateway', function () {
  async function fixture() {
    const aavePoolAddressProvider = await ethers.getContractAtFromArtifact(
      aavePoolAddressProviderArtifact,
      AAVE_POOL_ADDRESS_PROVIDER
    );
    const aavePoolAddress = await aavePoolAddressProvider.getPool();
    const aavePool = await ethers.getContractAtFromArtifact(aavePoolArtifact, aavePoolAddress);
    const reserve = await aavePool.getReserveData(ASSET_WETH);

    const weth = await ethers.getContractAtFromArtifact(wTokenArtifact, ASSET_WETH);
    const aWeth = await ethers.getContractAtFromArtifact(aTokenArtifact, reserve.aTokenAddress);

    const hasher = await deployHasher();
    const verifier2 = await deployContract('contracts/verifiers/Verifier2.sol:Verifier');
    const verifier16 = await deployContract('contracts/verifiers/Verifier16.sol:Verifier');
    const maxDepositAmt = utils.parseEther('10');

    const pool = await deployContract(
      'Pool',
      TREE_HEIGHT,
      maxDepositAmt,
      weth.address,
      AAVE_POOL_ADDRESS_PROVIDER,
      hasher.address,
      verifier2.address,
      verifier16.address
    );

    const wethGateway = await deployContract('WTokenGateway', weth.address);

    return { hasher, pool, weth, wethGateway, aWeth };
  }

  it('supply works', async function () {
    const { pool, wethGateway, weth, aWeth } = await loadFixture(fixture);

    const keyPair = KeyPair.createRandom();
    const amount = utils.parseEther('1');
    const scaledAmount = await pool.getAaveScaledAmount(amount);

    const supplyUtxo = new Utxo({ scaledAmount, keyPair });

    const { proofArgs, extData } = await prepareSupplyProof({
      pool,
      outputs: [supplyUtxo],
    });

    await wethGateway.supply(pool.address, proofArgs, extData, {
      value: amount.add(deltaAmount),
    });

    const poolBalance = await aWeth.balanceOf(pool.address);
    expect(poolBalance).to.be.closeTo(amount, deltaAmount);
  });

  it.only('withdraw works', async function () {
    const { pool, wethGateway, weth, aWeth } = await loadFixture(fixture);

    const keyPair = KeyPair.createRandom();
    const supplyAmount = utils.parseEther('1');
    const supplyScaledAmount = await pool.getAaveScaledAmount(supplyAmount);
    const supplyUtxo = new Utxo({ scaledAmount: supplyScaledAmount, keyPair });

    const { proofArgs, extData } = await prepareSupplyProof({
      pool,
      outputs: [supplyUtxo],
    });

    await wethGateway.supply(pool.address, proofArgs, extData, {
      value: supplyAmount.add(deltaAmount),
    });

    const poolBalance = await aWeth.balanceOf(pool.address);
    expect(poolBalance).to.be.closeTo(supplyAmount, deltaAmount);

    await time.increase(2 * ONE_DAY);

    const recipient = randomHex(20);
    const withdrawScaledAmount = supplyScaledAmount;
    const withdrawUtxo = new Utxo({
      scaledAmount: supplyScaledAmount.sub(withdrawScaledAmount),
      keyPair,
    });
    const { proofArgs: withdrawProofArgs, extData: withdrawExtData } = await prepareWithdrawProof({
      pool,
      inputs: [supplyUtxo],
      outputs: [withdrawUtxo],
      recipient: wethGateway.address,
    });

    await wethGateway.withdraw(pool.address, recipient, withdrawProofArgs, withdrawExtData);

    const recipientBalance = await ethers.provider.getBalance(recipient);

    expect(recipientBalance).to.be.gt(supplyAmount);
  });
});
