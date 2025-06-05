require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20", // Đổi từ 0.8.20 xuống 0.8.17
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545",
      accounts: ["0xb075468d0e12b4b55d3692417a082c9aebd01a52e1736b80398f47fa36f23d01"]
    }
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
};