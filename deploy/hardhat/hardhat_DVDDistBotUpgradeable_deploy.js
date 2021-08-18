const { ethers, network } = require("hardhat");
const { mainnet: network_ } = require("../../parameters");

module.exports = async ({ deployments }) => {
  await network.provider.request({method: "hardhat_impersonateAccount", params: [network_.Global.treasuryWalletAddr]});
  await network.provider.request({method: "hardhat_impersonateAccount", params: [network_.DVD.vaultAddress]});
};

module.exports.tags = ["hardhat_DVDDistBotUpgradeable_deploy"];
module.exports.dependencies = [
  "hardhat_reset",
  "mainnet_DVDDistBotUpgradeable_deploy",
];
