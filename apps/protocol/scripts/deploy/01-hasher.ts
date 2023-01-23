import { poseidonArtifact } from 'privi-utils';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;

  const abi = poseidonArtifact.abi;
  const bytecode = poseidonArtifact.bytecode as string;

  await deploy('hasher', {
    from: deployer,
    contract: {
      abi,
      bytecode,
    },
    log: true,
    autoMine: true,
  });
};

deploy.tags = ['hasher'];
export default deploy;
