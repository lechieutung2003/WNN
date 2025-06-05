const hre = require("hardhat");

async function main() {
  // Lấy contract factory
  const ArtMuseumNFT = await hre.ethers.getContractFactory("ArtMuseumNFT");
  
  // Triển khai smart contract
  const artMuseumNFT = await ArtMuseumNFT.deploy();
  
  // Đợi cho đến khi transaction được xác nhận (thay vì dùng deployed())
  await artMuseumNFT.waitForDeployment();
  
  // Lấy địa chỉ contract đã triển khai
  const contractAddress = await artMuseumNFT.getAddress();
  
  console.log("ArtMuseumNFT đã được triển khai tới địa chỉ:", contractAddress);
  
  // Lưu địa chỉ contract để sử dụng sau này
  const fs = require("fs");
  const contractsDir = __dirname + "/../contractAddress";
  
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }
  
  fs.writeFileSync(
    contractsDir + "/address.json",
    JSON.stringify({ ArtMuseumNFT: contractAddress }, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });