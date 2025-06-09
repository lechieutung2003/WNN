require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20", // Đổi từ 0.8.20 xuống 0.8.17
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545",
      accounts: ["0xaa9d1ce6a9cea86b7c0da50661ff695d66038ca1d1ead6139994f4efaa593b8c"]
    }
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
};