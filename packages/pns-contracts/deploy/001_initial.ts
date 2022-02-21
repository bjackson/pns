import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';

import RegistryABI from '../artifacts/contracts/Registry.sol/Registry.json';
import { Registry } from '../typechain';

const initialDeployment: DeployFunction = async (
  hre: HardhatRuntimeEnvironment
) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const [deployerSigner] = await ethers.getSigners();

  const result = await deploy('Registry', {
    from: deployer,
    args: [
      'poly',
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (hardhat, ganache), no effect on live networks
  });

  const deployedAddress = result.address;

  const RegistryContract = new ethers.Contract(deployedAddress, RegistryABI.abi, deployerSigner) as unknown as Registry;

  await RegistryContract.connect(deployerSigner).register('brett', {
    value: ethers.utils.parseEther('5'),
  });
};

export default initialDeployment;

initialDeployment.tags = ['Registry'];
