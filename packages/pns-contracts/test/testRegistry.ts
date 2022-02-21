import { deployments, ethers } from 'hardhat';
import hre from 'hardhat';
import chai from 'chai';


import { Registry } from '../typechain';
import { BigNumber } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const { expect } = chai;

describe('Registry', async () => {
  let RegistryC: Registry;
  const domainName = 'testDomain';
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  let price: BigNumber;

  before(async () => {
    await deployments.fixture(['Registry']);

    user1 = (await hre.ethers.getSigners())[0];
    user2 = (await hre.ethers.getUnnamedSigners())[0];
    console.log(user1);


    RegistryC = await ethers.getContract('Registry');

    price = await RegistryC.priceToRegisterDomain(domainName);
  });

  it('should allow registering domains', async () => {
    await RegistryC.connect(user1).register(domainName, {
      value: price.mul(2),
    });

    const owner = await RegistryC.getDomainOwner(domainName);

    expect(owner).to.be.equal(user1.address);
  });

  it('should be able to get the owner', async () => {
    const owner = await RegistryC.getDomainOwner(domainName);

    expect(owner).to.be.equal(user1.address);
  });

  it('should be able to transfer domains', async () => {
    const owner = await RegistryC.getDomainOwner(domainName);

    await RegistryC.connect(user1).transferDomain(domainName, user2.address);

    const newOwner = await RegistryC.getDomainOwner(domainName);

    expect(newOwner).to.be.equal(user2.address);
  });
});
