const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  // Deploy ArtMuseumNFT
  const ArtMuseumNFT = await ethers.getContractFactory("ArtMuseumNFT");
  const artMuseumNFT = await ArtMuseumNFT.deploy();
  await artMuseumNFT.waitForDeployment();

  const nftAddress = await artMuseumNFT.getAddress();
  console.log("ArtMuseumNFT deployed to:", nftAddress);

  // Deploy Marketplace
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy();
  await marketplace.waitForDeployment();

  const marketplaceAddress = await marketplace.getAddress();
  console.log("Marketplace deployed to:", marketplaceAddress);

  // Lưu địa chỉ contracts
  const fs = require('fs');
  const contractAddresses = {
    ArtMuseumNFT: nftAddress,
    Marketplace: marketplaceAddress,
    network: "localhost", // Ganache
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    './contractAddress/addresses.json',
    JSON.stringify(contractAddresses, null, 2)
  );

  console.log("Contract addresses saved to contractAddress/addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });