import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import dotenv from 'dotenv';

dotenv.config();

const rpcPolygonMumbai = process.env.RPC_POLYGON_MUMBAI as string;
const rpcPolygonMainnet = process.env.RPC_POLYGON_MAINNET as string;

const privateKeys = (process.env.PRIVATE_KEYS_TEST as string).split(',');
const forkEnabled = process.env.HARDHAT_FORK === 'true';

const config: HardhatUserConfig = {
  solidity: { compilers: [{ version: '0.8.17' }, { version: '0.6.11' }] },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      forking: {
        url: rpcPolygonMainnet,
        blockNumber: 28876152,
      },
    },
    mumbai: {
      url: rpcPolygonMumbai,
      accounts: privateKeys,
    },
  },
};

export default config;
