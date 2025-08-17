const hre = require('hardhat');

async function main() {
  const [owner] = await hre.ethers.getSigners();
  const registry = await hre.ethers.getContractAt('BarcodeRegistry', '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512');
  const producer = (await hre.ethers.getSigners())[1];

  console.log('Adding producer', producer.address);
  let tx = await registry.connect(owner).addProducer(producer.address, 'Test Producer');
  await tx.wait();
  console.log('Producer added');

  console.log('Registering product from owner on behalf of producer');
  tx = await registry.connect(owner).registerProduct('0000000000001', 'Test Product', producer.address);
  await tx.wait();
  console.log('Product registered');
}

main().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
