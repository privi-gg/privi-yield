import { upgrades, ethers } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { networks } from '../config';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId, network } = hre;
  const { deployer } = await getNamedAccounts();
  const deployerSigner = (await ethers.getSigners()).find((s) => s.address === deployer);
  if (!deployerSigner) {
    throw new Error('No deployer signer found');
  }
  const chainId = await getChainId();

  const allDeployments = await deployments.all();
  const hasher = allDeployments[`${network.name}-hasher`].address;
  const verifier2 = allDeployments[`${network.name}-verifier2`].address;
  const verifier16 = allDeployments[`${network.name}-verifier16`].address;
  //@todo Get token from cmd line
  const token = networks[chainId].nativeWToken;
  const deploymentName = `${network.name}-${token}-poolProxy`;

  const tokenAddress = networks[chainId].tokens[token].address;
  const numLevels = networks[chainId].tokens[token].numTreeLevels;
  const sanctionsList = networks[chainId].sanctionsList;
  const aavePoolAddressProvider = networks[chainId].aavePoolAddressProvider;
  const maxSupplyAmount = networks[chainId].tokens[token].maxSupplyAmount;

  //@todo check possibility to skip

  const PoolImplFactory = await ethers.getContractFactory('Pool', deployerSigner);
  const pool = await upgrades.deployProxy(PoolImplFactory, [maxSupplyAmount], {
    kind: 'uups',
    constructorArgs: [
      numLevels,
      tokenAddress,
      aavePoolAddressProvider,
      hasher,
      verifier2,
      verifier16,
      sanctionsList,
    ],
    unsafeAllow: ['constructor', 'state-variable-immutable'],
  });
  deployments.log(`deploying "${deploymentName}" (tx: ${pool.deployTransaction.hash})...: `);
  await pool.deployed();
  const poolImplArtifact = await deployments.getExtendedArtifact('Pool');

  deployments.log(`deployed at ${pool.address}`);
  await deployments.save(deploymentName, {
    abi: poolImplArtifact.abi,
    bytecode: poolImplArtifact.bytecode,
    address: pool.address,
  });
};

deploy.tags = ['pool'];
deploy.dependencies = ['hasher', 'verifier'];
export default deploy;
