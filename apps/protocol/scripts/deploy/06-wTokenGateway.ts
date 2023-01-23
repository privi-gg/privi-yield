import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { networks } from '../../config';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  const token = Object.keys(networks[chainId].assets)[0];
  const tokenAddress = networks[chainId].assets[token];

  await deploy('wTokenGateway', {
    from: deployer,
    contract: 'WTokenGateway',
    args: [tokenAddress],
    log: true,
    autoMine: true,
  });
};

deploy.tags = ['wTokenGateway'];
export default deploy;
