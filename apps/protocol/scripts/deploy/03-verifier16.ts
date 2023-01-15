import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  await deploy('verifier16', {
    from: deployer,
    contract: 'contracts/verifiers/Verifier16.sol:Verifier',
    args: [],
    log: true,
    autoMine: true,
  });
};

deploy.tags = ['verifier', 'verifier16'];
export default deploy;
