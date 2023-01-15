import { ethers } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { networks } from './config';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deployer } = await getNamedAccounts();

  const { hasher, verifier2, verifier16 } = await deployments.all();

  const numLevels = 20;
  const maxDepositAmount = ethers.utils.parseEther('1');
  const chainId = await getChainId();
  const tokenAddress = networks[chainId].assets.wmatic;
  const aavePoolAddressProvider = networks[chainId].aavePoolAddressProvider;

  await deployments.deploy('pool', {
    contract: 'MixerPool',
    from: deployer,
    args: [
      numLevels,
      maxDepositAmount,
      tokenAddress,
      aavePoolAddressProvider,
      hasher.address,
      verifier2.address,
      verifier16.address,
    ],
    log: true,
    autoMine: true,
  });
};

deploy.tags = ['pool'];
deploy.dependencies = ['hasher', 'verifier'];
export default deploy;
