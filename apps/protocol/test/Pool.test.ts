import { expect } from 'chai';
import { artifacts, ethers } from 'hardhat';
import { loadFixture, mine, time } from '@nomicfoundation/hardhat-network-helpers';
import { deployContract } from './helpers/utils';
import { AAVE_POOL_ADDRESS_PROVIDER, ASSET_WETH, TREE_HEIGHT } from './helpers/constants';
import { transactSupply, transactWithdraw, transactTransfer } from './helpers/proofs';
import { KeyPair, Utxo } from '@privi-yield/common';
import { deployHasher } from './helpers/hasher';
import { randomHex } from 'privi-utils';

const { utils } = ethers;
const { parseEther } = utils;

const aavePoolAddressProviderArtifact = artifacts.readArtifactSync('IAavePoolAddressProvider');
const aavePoolArtifact = artifacts.readArtifactSync('IAavePool');
const wTokenArtifact = artifacts.readArtifactSync('WTokenMock');
const aTokenArtifact = artifacts.readArtifactSync('IAToken');

const ONE_ETHER = parseEther('1');
const DELTA_SEC = 5 * 60;
const ONE_DAY = 24 * 60 * 60;
const TOLERANCE = parseEther('0.0001');

describe('Pool', function () {
  async function fixture() {
    const aavePoolAddressProvider = await ethers.getContractAtFromArtifact(
      aavePoolAddressProviderArtifact,
      AAVE_POOL_ADDRESS_PROVIDER
    );
    const aavePoolAddress = await aavePoolAddressProvider.getPool();
    const aavePool = await ethers.getContractAtFromArtifact(aavePoolArtifact, aavePoolAddress);
    const reserve = await aavePool.getReserveData(ASSET_WETH);

    const token = await ethers.getContractAtFromArtifact(wTokenArtifact, ASSET_WETH);
    const aToken = await ethers.getContractAtFromArtifact(aTokenArtifact, reserve.aTokenAddress);

    const hasher = await deployHasher();
    const verifier2 = await deployContract('contracts/verifiers/Verifier2.sol:Verifier');
    const verifier16 = await deployContract('contracts/verifiers/Verifier16.sol:Verifier');
    const maxDepositAmt = utils.parseEther('10');

    const pool = await deployContract(
      'Pool',
      TREE_HEIGHT,
      maxDepositAmt,
      token.address,
      AAVE_POOL_ADDRESS_PROVIDER,
      hasher.address,
      verifier2.address,
      verifier16.address
    );

    const [u1, u2, u3] = await ethers.getSigners();

    const amount = utils.parseEther('8000').toString();
    await token.connect(u1).deposit({ value: amount });
    await token.connect(u2).deposit({ value: amount });
    await token.connect(u3).deposit({ value: amount });
    await token.connect(u1).approve(pool.address, amount);
    await token.connect(u2).approve(pool.address, amount);
    await token.connect(u3).approve(pool.address, amount);

    return { hasher, pool, token, aToken };
  }

  describe('Supply', function () {
    it('single supply', async function () {
      const { pool, token, aToken } = await loadFixture(fixture);

      const keyPair = KeyPair.createRandom();
      const amount = utils.parseEther('1');

      let [scaledAmount] = await pool.getAaveScaledAmountAdjusted(amount, DELTA_SEC);

      const supplyUtxo = new Utxo({ scaledAmount, keyPair });
      await transactSupply({ pool, amount, outputs: [supplyUtxo] });

      let poolATokenBalance = await aToken.balanceOf(pool.address);
      let userBalance = await pool.getBalance(scaledAmount);
      expect(poolATokenBalance).to.be.closeTo(userBalance, TOLERANCE);

      await time.increase(1000 * ONE_DAY);

      poolATokenBalance = await aToken.balanceOf(pool.address);
      userBalance = await pool.getBalance(scaledAmount);
      expect(poolATokenBalance).to.be.closeTo(userBalance, TOLERANCE);
    }).timeout(80000);

    it('two supplies', async function () {
      const { pool, token, aToken } = await loadFixture(fixture);

      const keyPair1 = KeyPair.createRandom();
      const amount1 = utils.parseEther('1');
      const [scaledAmount1] = await pool.getAaveScaledAmountAdjusted(amount1, DELTA_SEC);
      const supplyUtxo1 = new Utxo({ scaledAmount: scaledAmount1, keyPair: keyPair1 });
      await transactSupply({ pool, amount: amount1, outputs: [supplyUtxo1] });

      const keyPair2 = KeyPair.createRandom();
      const amount2 = utils.parseEther('1');
      const [scaledAmount2] = await pool.getAaveScaledAmountAdjusted(amount2, DELTA_SEC);
      const supplyUtxo2 = new Utxo({ scaledAmount: scaledAmount2, keyPair: keyPair2 });
      await transactSupply({ pool, amount: amount1, outputs: [supplyUtxo2] });

      let poolATokenBalance = await aToken.balanceOf(pool.address);
      let userBalance1 = await pool.getBalance(scaledAmount1);
      let userBalance2 = await pool.getBalance(scaledAmount2);
      expect(poolATokenBalance).to.be.closeTo(userBalance1.add(userBalance2), TOLERANCE);

      await time.increase(1000 * ONE_DAY);

      poolATokenBalance = await aToken.balanceOf(pool.address);
      userBalance1 = await pool.getBalance(scaledAmount1);
      userBalance2 = await pool.getBalance(scaledAmount2);
      expect(poolATokenBalance).to.be.closeTo(userBalance1.add(userBalance2), TOLERANCE);
    }).timeout(80000);

    it('multiple supplies', async function () {
      const { pool, token, aToken } = await loadFixture(fixture);

      const keyPair1 = KeyPair.createRandom();
      const amount1 = utils.parseEther('1');
      const [scaledAmount1] = await pool.getAaveScaledAmountAdjusted(amount1, DELTA_SEC);
      const supplyUtxo1 = new Utxo({ scaledAmount: scaledAmount1, keyPair: keyPair1 });

      const keyPair2 = KeyPair.createRandom();
      const amount2 = utils.parseEther('1');
      const [scaledAmount2] = await pool.getAaveScaledAmountAdjusted(amount2, DELTA_SEC);
      const supplyUtxo2 = new Utxo({ scaledAmount: scaledAmount2, keyPair: keyPair2 });

      const keyPair3 = KeyPair.createRandom();
      const amount3 = utils.parseEther('1');
      const [scaledAmount3] = await pool.getAaveScaledAmountAdjusted(amount3, DELTA_SEC);
      const supplyUtxo3 = new Utxo({ scaledAmount: scaledAmount3, keyPair: keyPair3 });

      await transactSupply({ pool, amount: amount1, outputs: [supplyUtxo1] });
      await transactSupply({ pool, amount: amount2, outputs: [supplyUtxo2] });
      await transactSupply({ pool, amount: amount3, outputs: [supplyUtxo3] });

      let poolATokenBalance = await aToken.balanceOf(pool.address);
      let userBalance1 = await pool.getBalance(scaledAmount1);
      let userBalance2 = await pool.getBalance(scaledAmount2);
      let userBalance3 = await pool.getBalance(scaledAmount3);
      expect(poolATokenBalance).to.be.closeTo(
        userBalance1.add(userBalance2).add(userBalance3),
        TOLERANCE
      );

      await mine(100000);

      poolATokenBalance = await aToken.balanceOf(pool.address);
      userBalance1 = await pool.getBalance(scaledAmount1);
      userBalance2 = await pool.getBalance(scaledAmount2);
      userBalance3 = await pool.getBalance(scaledAmount3);
      expect(poolATokenBalance).to.be.closeTo(
        userBalance1.add(userBalance2).add(userBalance3),
        TOLERANCE
      );
    }).timeout(80000);
  });

  describe('Withdraws', function () {
    it('single supply & withdraw', async function () {
      const { pool, token, aToken } = await loadFixture(fixture);

      const keyPair = KeyPair.createRandom();
      const amount = utils.parseEther('1');
      const recipient = randomHex(20);

      let [scaledAmount] = await pool.getAaveScaledAmountAdjusted(amount, DELTA_SEC);

      const supplyUtxo = new Utxo({ scaledAmount, keyPair });
      await transactSupply({ pool, amount, outputs: [supplyUtxo] });

      await time.increase(1000 * ONE_DAY);

      const withdrawScaledAmount = scaledAmount;
      const withdrawAmount = await pool.getBalance(withdrawScaledAmount);
      const withdrawUtxo = new Utxo({
        scaledAmount: scaledAmount.sub(withdrawScaledAmount),
        keyPair,
      });

      await transactWithdraw({
        pool,
        inputs: [supplyUtxo],
        outputs: [withdrawUtxo],
        recipient,
      });
      const userBalance = await token.balanceOf(recipient);

      expect(userBalance).to.be.closeTo(withdrawAmount, TOLERANCE);
    }).timeout(80000);

    it('multiple supply & withdraw', async function () {
      const { pool, token, aToken } = await loadFixture(fixture);

      const keyPair = KeyPair.createRandom();
      const amount = utils.parseEther('1');
      const recipient = randomHex(20);

      let [scaledAmount] = await pool.getAaveScaledAmountAdjusted(amount, DELTA_SEC);

      const supplyUtxo1 = new Utxo({ scaledAmount, keyPair });
      const supplyUtxo2 = new Utxo({ scaledAmount, keyPair });
      await transactSupply({ pool, amount, outputs: [supplyUtxo1] });
      await transactSupply({ pool, amount, outputs: [supplyUtxo2] });

      await time.increase(1000 * ONE_DAY);

      const totalScaledBalance = scaledAmount.mul(2);
      const withdrawScaledAmount = totalScaledBalance;
      const withdrawAmount = await pool.getBalance(withdrawScaledAmount);
      const withdrawUtxo = new Utxo({
        scaledAmount: totalScaledBalance.sub(withdrawScaledAmount),
        keyPair,
      });

      await transactWithdraw({
        pool,
        inputs: [supplyUtxo1, supplyUtxo2],
        outputs: [withdrawUtxo],
        recipient,
      });
      const userBalance = await token.balanceOf(recipient);

      expect(userBalance).to.be.closeTo(withdrawAmount, TOLERANCE);
    }).timeout(80000);

    it('partial withdraw', async function () {
      const { pool, token, aToken } = await loadFixture(fixture);

      const keyPair = KeyPair.createRandom();
      const amount = utils.parseEther('1');
      const recipient = randomHex(20);

      let [scaledAmount] = await pool.getAaveScaledAmountAdjusted(amount, DELTA_SEC);

      const supplyUtxo = new Utxo({ scaledAmount, keyPair });
      await transactSupply({ pool, amount, outputs: [supplyUtxo] });

      await time.increase(1000 * ONE_DAY);

      // First Withdraw
      const scaledWithdrawAmount1 = scaledAmount.div(3);
      const withdrawAmount1 = await pool.getBalance(scaledWithdrawAmount1);
      const withdrawUtxo1 = new Utxo({
        scaledAmount: scaledAmount.sub(scaledWithdrawAmount1),
        keyPair,
      });

      await transactWithdraw({
        pool,
        inputs: [supplyUtxo],
        outputs: [withdrawUtxo1],
        recipient,
      });
      const userBalance1 = await token.balanceOf(recipient);

      expect(userBalance1).to.be.closeTo(withdrawAmount1, TOLERANCE);

      await time.increase(21 * ONE_DAY);

      // Second Withdraw
      scaledAmount = scaledAmount.sub(scaledWithdrawAmount1);
      const scaledWithdrawAmount2 = scaledAmount.div(2);
      const withdrawAmount2 = await pool.getBalance(scaledWithdrawAmount2);
      const withdrawUtxo2 = new Utxo({
        scaledAmount: scaledAmount.sub(scaledWithdrawAmount2),
        keyPair,
      });

      await transactWithdraw({
        pool,
        inputs: [withdrawUtxo1],
        outputs: [withdrawUtxo2],
        recipient,
      });
      const userBalance2 = await token.balanceOf(recipient);

      expect(userBalance2).to.be.closeTo(userBalance1.add(withdrawAmount2), TOLERANCE);
    }).timeout(80000);
  });

  describe.skip('Transfers', function () {
    it('simple supply & transfer', async function () {
      const { pool, token, aToken } = await loadFixture(fixture);

      const keyPairAlice = KeyPair.createRandom();
      const supplyAmount = utils.parseEther('1');
      const [supplyScaledAmount] = await pool.getAaveScaledAmountAdjusted(ONE_ETHER, DELTA_SEC);

      const supplyUtxo = new Utxo({ scaledAmount: supplyScaledAmount, keyPair: keyPairAlice });
      await transactSupply({ pool, amount: supplyAmount, outputs: [supplyUtxo] });

      await time.increase(1000 * ONE_DAY);

      // Alice sends to Bob
      const keyPairBob = KeyPair.createRandom();
      const transferScaledAmount = supplyScaledAmount.div(2);
      const transferAmount = await pool.getBalance(transferScaledAmount);
      const transferUtxo = new Utxo({
        scaledAmount: supplyScaledAmount.sub(transferScaledAmount),
        keyPair: keyPairBob,
      });
      const changeUtxo = new Utxo({
        scaledAmount: supplyScaledAmount.sub(transferScaledAmount),
        keyPair: keyPairAlice,
      });

      await transactTransfer({
        pool,
        inputs: [supplyUtxo],
        outputs: [transferUtxo, changeUtxo],
      });

      // expect(userBalance).to.be.closeTo(transferAmount, TOLERANCE);
    });
  });
});
