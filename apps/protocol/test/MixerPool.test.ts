import { expect } from 'chai';
import { artifacts, ethers } from 'hardhat';
import { loadFixture, mine, time } from '@nomicfoundation/hardhat-network-helpers';
import { deployHasher } from '../scripts/hasher';
import { deployContract, randomHex } from './helpers/utils';
import { AAVE_POOL_ADDRESS_PROVIDER, ASSET_WMATIC, TREE_HEIGHT } from './helpers/constants';
import {
  prepareTransaction,
  transactDeposit,
  transactWithdraw,
  transactTransfer,
} from './helpers/proofs';
import { KeyPair, Utxo } from '@praave/utils';

const { utils, BigNumber } = ethers;
const { parseEther, formatEther } = utils;

const aavePoolAddressProviderArtifact = artifacts.readArtifactSync('IAavePoolAddressProvider');
const aavePoolArtifact = artifacts.readArtifactSync('IAavePool');
const wTokenArtifact = artifacts.readArtifactSync('WTokenMock');
const aTokenArtifact = artifacts.readArtifactSync('IAToken');

const DELTA_SEC = 5 * 60;
const ONE_DAY = 24 * 60 * 60;
const TOLERANCE = parseEther('0.0001');

describe.only('MixerPool', function () {
  async function fixture() {
    const aavePoolAddressProvider = await ethers.getContractAtFromArtifact(
      aavePoolAddressProviderArtifact,
      AAVE_POOL_ADDRESS_PROVIDER,
    );
    const aavePoolAddress = await aavePoolAddressProvider.getPool();
    const aavePool = await ethers.getContractAtFromArtifact(aavePoolArtifact, aavePoolAddress);
    const reserve = await aavePool.getReserveData(ASSET_WMATIC);
    const token = await ethers.getContractAtFromArtifact(wTokenArtifact, ASSET_WMATIC);
    const aToken = await ethers.getContractAtFromArtifact(aTokenArtifact, reserve.aTokenAddress);

    const hasher = await deployHasher();
    const verifier2 = await deployContract('contracts/verifiers/Verifier2.sol:Verifier');
    const verifier16 = await deployContract('contracts/verifiers/Verifier16.sol:Verifier');
    const maxDepositAmt = utils.parseEther('10');

    const pool = await deployContract(
      'MixerPool',
      TREE_HEIGHT,
      maxDepositAmt,
      token.address,
      AAVE_POOL_ADDRESS_PROVIDER,
      hasher.address,
      verifier2.address,
      verifier16.address,
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

  describe('Transaction', function () {
    describe('Deposits', function () {
      it('single deposit', async function () {
        const { pool, token, aToken } = await loadFixture(fixture);

        const keyPair = KeyPair.createRandom();
        const amount = utils.parseEther('1');

        let [scaledAmount] = await pool.getAaveScaledAmountAdjusted(amount, DELTA_SEC);

        const depositUtxo = new Utxo({ scaledAmount, keyPair });
        await transactDeposit({ pool, amount, outputs: [depositUtxo] });

        let poolATokenBalance = await aToken.balanceOf(pool.address);
        let userBalance = await pool.getBalance(scaledAmount);
        expect(poolATokenBalance).to.be.closeTo(userBalance, TOLERANCE);

        await time.increase(1000 * ONE_DAY);

        poolATokenBalance = await aToken.balanceOf(pool.address);
        userBalance = await pool.getBalance(scaledAmount);
        expect(poolATokenBalance).to.be.closeTo(userBalance, TOLERANCE);
      }).timeout(80000);

      it('two deposits', async function () {
        const { pool, token, aToken } = await loadFixture(fixture);

        const keyPair1 = KeyPair.createRandom();
        const amount1 = utils.parseEther('1');
        const [scaledAmount1] = await pool.getAaveScaledAmountAdjusted(amount1, DELTA_SEC);
        const depositUtxo1 = new Utxo({ scaledAmount: scaledAmount1, keyPair: keyPair1 });
        await transactDeposit({ pool, amount: amount1, outputs: [depositUtxo1] });

        const keyPair2 = KeyPair.createRandom();
        const amount2 = utils.parseEther('1');
        const [scaledAmount2] = await pool.getAaveScaledAmountAdjusted(amount2, DELTA_SEC);
        const depositUtxo2 = new Utxo({ scaledAmount: scaledAmount2, keyPair: keyPair2 });
        await transactDeposit({ pool, amount: amount1, outputs: [depositUtxo2] });

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

      it('multiple deposits', async function () {
        const { pool, token, aToken } = await loadFixture(fixture);

        const keyPair1 = KeyPair.createRandom();
        const amount1 = utils.parseEther('1');
        const [scaledAmount1] = await pool.getAaveScaledAmountAdjusted(amount1, DELTA_SEC);
        const depositUtxo1 = new Utxo({ scaledAmount: scaledAmount1, keyPair: keyPair1 });

        const keyPair2 = KeyPair.createRandom();
        const amount2 = utils.parseEther('1');
        const [scaledAmount2] = await pool.getAaveScaledAmountAdjusted(amount2, DELTA_SEC);
        const depositUtxo2 = new Utxo({ scaledAmount: scaledAmount2, keyPair: keyPair2 });

        const keyPair3 = KeyPair.createRandom();
        const amount3 = utils.parseEther('1');
        const [scaledAmount3] = await pool.getAaveScaledAmountAdjusted(amount3, DELTA_SEC);
        const depositUtxo3 = new Utxo({ scaledAmount: scaledAmount3, keyPair: keyPair3 });

        await transactDeposit({ pool, amount: amount1, outputs: [depositUtxo1] });
        await transactDeposit({ pool, amount: amount2, outputs: [depositUtxo2] });
        await transactDeposit({ pool, amount: amount3, outputs: [depositUtxo3] });

        let poolATokenBalance = await aToken.balanceOf(pool.address);
        let userBalance1 = await pool.getBalance(scaledAmount1);
        let userBalance2 = await pool.getBalance(scaledAmount2);
        let userBalance3 = await pool.getBalance(scaledAmount3);
        expect(poolATokenBalance).to.be.closeTo(
          userBalance1.add(userBalance2).add(userBalance3),
          TOLERANCE,
        );

        await mine(100000);

        poolATokenBalance = await aToken.balanceOf(pool.address);
        userBalance1 = await pool.getBalance(scaledAmount1);
        userBalance2 = await pool.getBalance(scaledAmount2);
        userBalance3 = await pool.getBalance(scaledAmount3);
        expect(poolATokenBalance).to.be.closeTo(
          userBalance1.add(userBalance2).add(userBalance3),
          TOLERANCE,
        );
      }).timeout(80000);
    });

    describe('Withdraws', function () {
      it('simple deposit & withdraw', async function () {
        const { pool, token, aToken } = await loadFixture(fixture);

        const keyPair = KeyPair.createRandom();
        const amount = utils.parseEther('1');
        const recipient = randomHex(20);

        let [scaledAmount] = await pool.getAaveScaledAmountAdjusted(amount, DELTA_SEC);

        const depositUtxo = new Utxo({ scaledAmount, keyPair });
        await transactDeposit({ pool, amount, outputs: [depositUtxo] });

        await time.increase(1000 * ONE_DAY);

        const withdrawScaledAmount = scaledAmount;
        const withdrawAmount = await pool.getBalance(withdrawScaledAmount);
        const withdrawUtxo = new Utxo({
          scaledAmount: scaledAmount.sub(withdrawScaledAmount),
          keyPair,
        });

        await transactWithdraw({
          pool,
          inputs: [depositUtxo],
          outputs: [withdrawUtxo],
          recipient,
        });
        const userBalance = await token.balanceOf(recipient);

        expect(userBalance).to.be.closeTo(withdrawAmount, TOLERANCE);
      }).timeout(80000);

      it.only('partial withdraw', async function () {
        const { pool, token, aToken } = await loadFixture(fixture);

        const keyPair = KeyPair.createRandom();
        const amount = utils.parseEther('1');
        const recipient = randomHex(20);

        let [scaledAmount] = await pool.getAaveScaledAmountAdjusted(amount, DELTA_SEC);

        const depositUtxo = new Utxo({ scaledAmount, keyPair });
        await transactDeposit({ pool, amount, outputs: [depositUtxo] });

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
          inputs: [depositUtxo],
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

    describe('Transfers', function () {});

    it('transfer works', async function () {
      const { pool, token } = await loadFixture(fixture);
      const keyPair = KeyPair.createRandom();
      const amount = utils.parseEther('0.1');
      let [scaledAmount, nextLiqIdx] = await pool.getAaveScaledAmountAdjusted(amount);

      const depositUtxo = new Utxo({ scaledAmount, keyPair });

      const { proofArgs, extData } = await prepareTransaction({
        pool,
        inputs: [],
        outputs: [depositUtxo],
        txType: 'deposit',
      });
      await pool.deposit(amount, proofArgs, extData);

      await mine(10000);

      const transferUtxo = new Utxo({ scaledAmount: scaledAmount.div(2), keyPair });
      const recipient = randomHex(20);
      const { proofArgs: proofArgs2, extData: extData2 } = await prepareTransaction({
        recipient: recipient,
        pool,
        inputs: [depositUtxo],
        outputs: [transferUtxo],
        txType: 'transfer',
      });
      await pool.transfer(proofArgs2, extData2);
    });

    // it('should deposit, transact and withdraw', async function () {
    //   const { pool, token } = await loadFixture(fixture);

    //   // Alice deposits into pool
    //   const aliceKeyPair = KeyPair.createRandom();
    //   const aliceDepositAmount = utils.parseEther('0.1');
    //   const aliceDepositUtxo = new Utxo({ amount: aliceDepositAmount, keyPair: aliceKeyPair });
    //   await transaction({ pool, outputs: [aliceDepositUtxo] });

    //   // Bob gives Alice address to send some eth inside the shielded pool
    //   const bobKeyPair = new KeyPair(); // contains private and public keys
    //   const bobAddress = bobKeyPair.address(); // contains only public key

    //   // Alice sends some funds to Bob
    //   const bobSendAmount = utils.parseEther('0.06');
    //   const bobSendUtxo = new Utxo({
    //     amount: bobSendAmount,
    //     keyPair: KeyPair.fromAddress(bobAddress),
    //   });
    //   const aliceChangeUtxo = new Utxo({
    //     amount: aliceDepositAmount.sub(bobSendAmount),
    //     keyPair: aliceDepositUtxo.keyPair,
    //   });
    //   await transaction({
    //     pool,
    //     inputs: [aliceDepositUtxo],
    //     outputs: [bobSendUtxo, aliceChangeUtxo],
    //   });

    //   // Bob parses chain to detect incoming funds
    //   const filter = pool.filters.NewCommitment();
    //   const fromBlock = await ethers.provider.getBlock('latest');
    //   const events = await pool.queryFilter(filter, fromBlock.number);
    //   let bobReceiveUtxo;
    //   try {
    //     bobReceiveUtxo = Utxo.decrypt(
    //       bobKeyPair,
    //       events[0].args?.encryptedOutput,
    //       events[0].args?.index,
    //     );
    //   } catch (e) {
    //     // we try to decrypt another output here because it shuffles outputs before sending to blockchain
    //     bobReceiveUtxo = Utxo.decrypt(
    //       bobKeyPair,
    //       events[1].args?.encryptedOutput,
    //       events[1].args?.index,
    //     );
    //   }
    //   expect(bobReceiveUtxo.amount).to.be.equal(bobSendAmount);

    //   // Bob withdraws a part of his funds from the shielded pool
    //   const bobWithdrawAmount = utils.parseEther('0.05');
    //   const bobEthAddress = '0xDeaD00000000000000000000000000000000BEEf';
    //   const bobChangeUtxo = new Utxo({
    //     amount: bobSendAmount.sub(bobWithdrawAmount),
    //     keyPair: bobKeyPair,
    //   });
    //   await transaction({
    //     pool,
    //     inputs: [bobReceiveUtxo],
    //     outputs: [bobChangeUtxo],
    //     recipient: bobEthAddress,
    //   });

    //   const bobBalance = await ethers.provider.getBalance(bobEthAddress);
    //   expect(bobBalance).to.be.equal(bobWithdrawAmount);
    // }).timeout(80000);

    // it('should work with 16 inputs', async function () {
    //   const { pool } = await loadFixture(fixture);

    //   const keyPair = KeyPair.createRandom();
    //   const depositAmount = utils.parseEther('0.07');
    //   const depositUtxo = new Utxo({ amount: depositAmount, keyPair });
    //   await transaction({
    //     pool,
    //     inputs: [Utxo.zero(), Utxo.zero(), Utxo.zero()],
    //     outputs: [depositUtxo],
    //   });
    // });

    // it.only('withdraw should work with relayers', async function () {
    //   const { pool, token } = await loadFixture(fixture);

    //   const [sender, relayer] = await ethers.getSigners();

    //   const recipientAddress = randomHex(20);

    //   // Alice deposits into pool
    //   const aliceKeyPair = KeyPair.createRandom();
    //   const aliceDepositAmount = utils.parseEther('0.5');
    //   const aliceDepositUtxo = new Utxo({ amount: aliceDepositAmount, keyPair: aliceKeyPair });
    //   await transaction({ pool, outputs: [aliceDepositUtxo] });

    //   // Alice withdraws
    //   const relayerFee = utils.parseEther('0.01');
    //   const aliceWithdrawAmount = utils.parseEther('0.2');
    //   const total = aliceWithdrawAmount.add(relayerFee);

    //   const aliceChangeAmount = aliceDepositAmount.sub(total);
    //   const aliceChangeUtxo = new Utxo({ amount: aliceChangeAmount, keyPair: aliceKeyPair });

    //   await transaction({
    //     pool,
    //     inputs: [aliceDepositUtxo],
    //     outputs: [aliceChangeUtxo],
    //     fee: relayerFee,
    //     relayer: relayer.address,
    //     recipient: recipientAddress,
    //   });

    //   const relayerBal = await token.balanceOf(relayer.address);
    //   const recipientBal = await ethers.provider.getBalance(recipientAddress);

    //   expect(recipientBal).to.be.equal(aliceWithdrawAmount);
    //   expect(relayerBal).to.be.equal(relayerFee);
    // });

    // it.only('transfer should work with relayers', async function () {
    //   const { pool, token } = await loadFixture(fixture);

    //   const [sender, relayer] = await ethers.getSigners();

    //   const recipientAddress = randomHex(20);

    //   // Alice deposits into pool
    //   const aliceKeyPair = KeyPair.createRandom();
    //   const aliceDepositAmount = utils.parseEther('0.5');
    //   const aliceDepositUtxo = new Utxo({ amount: aliceDepositAmount, keyPair: aliceKeyPair });
    //   await transaction({ pool, outputs: [aliceDepositUtxo] });

    //   const bobKeyPair = KeyPair.createRandom();

    //   // Alice sends to bob
    //   const relayerFee = utils.parseEther('0.01');
    //   const bobReceiveAmount = utils.parseEther('0.2');
    //   const total = bobReceiveAmount.add(relayerFee);

    //   const aliceChangeAmount = aliceDepositAmount.sub(total);
    //   const aliceChangeUtxo = new Utxo({ amount: aliceChangeAmount, keyPair: aliceKeyPair });
    //   const bobReceiveUtxo = new Utxo({ amount: bobReceiveAmount, keyPair: bobKeyPair });

    //   await transaction({
    //     pool,
    //     inputs: [aliceDepositUtxo],
    //     outputs: [aliceChangeUtxo, bobReceiveUtxo],
    //     fee: relayerFee,
    //     relayer: relayer.address,
    //     recipient: recipientAddress,
    //   });

    //   const relayerBal = await token.balanceOf(relayer.address);
    //   // const recipientBal = await ethers.provider.getBalance(recipientAddress);
    //   // expect(recipientBal).to.be.equal(bobReceiveAmount);
    //   expect(relayerBal).to.be.equal(relayerFee);
    // });
  });
});
