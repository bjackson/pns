import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const initialDeployment: DeployFunction = async (
  hre: HardhatRuntimeEnvironment
) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const result = await deploy('Registry', {
    from: deployer,
    args: [
      'poly',
    ],
    // log: true,
    autoMine: true, // speed up deployment on local network (hardhat, ganache), no effect on live networks
  });
};

export default initialDeployment;

initialDeployment.tags = ['Registry'];
