import { ethers } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { networks } from '../../config';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deployer } = await getNamedAccounts();

  const { hasher, verifier2, verifier16 } = await deployments.all();

  const numLevels = 20;
  const maxDepositAmount = ethers.utils.parseEther('5');
  const chainId = await getChainId();

  const token = Object.keys(networks[chainId].assets)[0];
  const tokenAddress = networks[chainId].assets[token];
  const aavePoolAddressProvider = networks[chainId].aavePoolAddressProvider;

  await deployments.deploy('pool', {
    contract: 'Pool',
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
