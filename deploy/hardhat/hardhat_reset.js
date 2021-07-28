const { network } = require("hardhat");
require("dotenv").config();

const mainnetUrl = process.env.ALCHEMY_URL_MAINNET;
const mainnetBlockNumber = 12910300;

module.exports = async () => {
  await network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: mainnetUrl,
          blockNumber: mainnetBlockNumber,
        },
      },
    ],
  });
};
module.exports.tags = ["hardhat_reset"];
