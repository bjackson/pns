import 'dotenv/config';
import dgram from 'dgram';
import { ethers } from 'ethers';
import type { Registry } from 'pns-contracts/typechain';
import RegistryABI from 'pns-contracts/artifacts/contracts/Registry.sol/Registry.json';


import dnsPacket from 'dns-packet';

export type DnsPacket = dnsPacket.Packet;

const registryAddress ='0xa0fE1D087B9f1E38c62e9eA00C3D4EEc30C11675'

const parseDnsPacket = (packet: Buffer): DnsPacket => {
  return dnsPacket.decode(packet);
};

console.log(process.env.RPC_PROVIDER_URL);

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_PROVIDER_URL);

const RegistryContract = new ethers.Contract(registryAddress, RegistryABI.abi, provider) as unknown as Registry;

const resolveFromPNS = async (packet: DnsPacket) => {
  const domainName = packet.questions[0].name.split('.poly')[0];
  const resp = await RegistryContract.getDomainOwner(domainName);
  console.log(resp);
};

const server = dgram.createSocket('udp4');

server.on('message', (msg) => {
  const packet = parseDnsPacket(msg);

  console.log(packet);
  resolveFromPNS(packet);
});

server.on('listening', () => {
  const address = server.address();
  console.log(`Listening on ${address.address}:${address.port}`);
});

server.bind(8853);
