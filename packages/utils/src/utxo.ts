import { BigNumber, type BigNumberish } from 'ethers';
import { KeyPair } from './keyPair';
import { poseidonHash, randomBN, toFixedBuffer } from './helpers';

export class Utxo {
  scaledAmount: BigNumberish;
  blinding: BigNumberish;
  keyPair: KeyPair;
  leafIndex?: number;
  private _commitment?: string;
  private _nullifier?: string;

  constructor({
    scaledAmount,
    keyPair,
    blinding = randomBN(),
    leafIndex,
  }: {
    scaledAmount: BigNumberish;
    keyPair: KeyPair;
    blinding?: BigNumberish;
    leafIndex?: number;
  }) {
    this.scaledAmount = BigNumber.from(scaledAmount);
    this.blinding = BigNumber.from(blinding);
    this.keyPair = keyPair;
    this.leafIndex = leafIndex;
  }

  /**
   * Returns commitment for this UTXO
   */
  get commitment() {
    if (!this._commitment) {
      this._commitment = poseidonHash(this.scaledAmount, this.keyPair.publicKey, this.blinding);
    }
    return this._commitment;
  }

  /**
   * Returns nullifier for this UTXO
   */
  get nullifier() {
    if (!this._nullifier) {
      if (
        this.scaledAmount > 0 &&
        (!isFinite(this.leafIndex as number) || !this.keyPair.privateKey === undefined)
      ) {
        throw new Error('Can not compute nullifier without utxo index or private key');
      }
      const signature = this.keyPair.privateKey
        ? this.keyPair.sign(this.commitment, this.leafIndex || 0)
        : 0;
      this._nullifier = poseidonHash(this.commitment, this.leafIndex || 0, signature);
    }
    return this._nullifier;
  }

  /**
   * Encrypt UTXO data using the current keyPair
   */
  encrypt() {
    const bytes = Buffer.concat([
      toFixedBuffer(this.scaledAmount, 31),
      toFixedBuffer(this.blinding, 31),
    ]);
    return this.keyPair.encrypt(bytes);
  }

  /**
   * Zero valued random utxo
   */
  static zero() {
    return new Utxo({
      scaledAmount: BigNumber.from(0),
      keyPair: KeyPair.createRandom(),
    });
  }

  /**
   * Decrypt a UTXO
   */
  static decrypt(keyPair: KeyPair, data: string, index: number) {
    const buf = keyPair.decrypt(data);
    return new Utxo({
      scaledAmount: BigNumber.from('0x' + buf.subarray(0, 31).toString('hex')) as any,
      blinding: BigNumber.from('0x' + buf.subarray(31, 62).toString('hex')),
      keyPair,
      leafIndex: index,
    });
  }
}
