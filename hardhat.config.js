require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-truffle5");
require("@nomiclabs/hardhat-web3");
require("hardhat-deploy");
require("hardhat-deploy-ethers");

require('dotenv').config();

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork:"hardhat",

  networks: {
    hardhat: {
      forking: {
        url: process.env.MAINNET_URL,
        blockNumber: 12170855 
      },
      gas: 9500000,  //default:9500000
      blockGasLimit: 12500000,  //default:9500000
      accounts: {
        count: 1000  //default:20
      }
    },
    /* 
    kovan: {
      url: process.env.KOVAN_URL,
      from: process.env.ACCOUNT,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    },

    mainnet: {
      url: process.env.MAINNET_URL,
      from: process.env.ACCOUNT,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    }*/
  },

  /*
  etherscan: {
    apikey: process.env.ETHERSCAN_API_KEY
  },
  */

  solidity: {
    optimizer: {
      enabled: true,
      runs: 200
    },
    compilers: [
      {
      version: "0.7.6"
      }
    ]
  },

  mocha: {
    timeout: 2000000  // default: 20000
  },

  gasReporter: {
    showTimeSpent: true
  }
};

