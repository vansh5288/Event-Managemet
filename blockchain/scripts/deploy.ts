import { ethers } from 'hardhat';

async function main() {
  console.log('Deploying EventHub contract...');

  const EventHub = await ethers.getContractFactory('EventHub');
  const contract = await EventHub.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`EventHub deployed to: ${address}`);

  // Save deployment info
  const fs = require('fs');
  const path = require('path');
  const deployment = {
    address,
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    timestamp: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, '../deployments.json');
  fs.writeFileSync(outputPath, JSON.stringify(deployment, null, 2));
  console.log(`Deployment info saved to ${outputPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

