// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre from 'hardhat';

import type { Domains } from '../typechain';

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const [owner, superCoder] = await hre.ethers.getSigners();
  const domainContractFactory = await hre.ethers.getContractFactory('Domains');
  const tld = 'poly';
  const domainContract: Domains = await domainContractFactory.deploy('poly');
  await domainContract.deployed();
  console.log('Contract deployed to:', domainContract.address);
  console.log('Contract deployed by:', owner.address);

  const domain1 = 'bjacksontest';

  let txn = await domainContract.register(domain1, {
    value: hre.ethers.utils.parseEther('1'),
  });
  await txn.wait();
  console.log('Domain registered:', domain1);

  const balance = await hre.ethers.provider.getBalance(domainContract.address);
  console.log('Contract balance:', hre.ethers.utils.formatEther(balance));

  // Quick! Grab the funds from the contract! (as superCoder)
  try {
    txn = await domainContract.connect(superCoder).withdraw();
    await txn.wait();
  } catch (error) {
    console.log('Could not rob contract');
  }

  // Let's look in their wallet so we can compare later
  let ownerBalance = await hre.ethers.provider.getBalance(owner.address);
  console.log(
    'Balance of owner before withdrawal:',
    hre.ethers.utils.formatEther(ownerBalance)
  );

  // Oops, looks like the owner is saving their money!
  txn = await domainContract.connect(owner).withdraw();
  await txn.wait();

  // Fetch balance of contract & owner
  const contractBalance = await hre.ethers.provider.getBalance(
    domainContract.address
  );
  ownerBalance = await hre.ethers.provider.getBalance(owner.address);

  txn = await domainContract.setRecord(domain1, 'It be me.');
  await txn.wait();
  console.log(`Set record for ${domain1}.${tld}:`);

  const domainAddress = await domainContract.getAddress(domain1);
  console.log(`Owner of domain ${domain1}: ${domainAddress}`);

  console.log(
    'Contract balance after withdrawal:',
    hre.ethers.utils.formatEther(contractBalance)
  );
  console.log(
    'Balance of owner after withdrawal:',
    hre.ethers.utils.formatEther(ownerBalance)
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
