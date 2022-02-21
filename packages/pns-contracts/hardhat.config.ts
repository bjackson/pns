import * as dotenv from 'dotenv';

import { HardhatUserConfig, task } from 'hardhat/config';
import 'hardhat-deploy';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import { Wallet } from 'ethers';

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const initialBalance = '100000000000000000000';

const config: HardhatUserConfig = {
  solidity: '0.8.10',
  networks: {
    ropsten: {
      url: process.env.ROPSTEN_URL || '',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    mumbai: {
      url: process.env.MUMBAI_URL || '',
      accounts: [process.env.TEST_PRIVATE_KEY || ''],
    },
    hardhat: {
      chainId: 31337,
      accounts: [
        {
          privateKey: process.env.TEST_PRIVATE_KEY || '',
          balance: initialBalance,
        },
        ...[...Array(10).keys()].map(_ => {
          const wallet = Wallet.createRandom();
          return {
            privateKey: wallet.privateKey,
            balance: initialBalance,
          };
        })
      ],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: '0x049044c53c354ba4A24Cb6a4fE172329880d3B62',
    }
  },
};

export default config;
