const { ethers, network } = require("hardhat");
const { mainnet: network_ } = require("../../addresses");

const dvgAddress = network_.DVG;
const uniswapV2Router02Address = network_.UniswapV2Router02;
const walletAddress = process.env.WALLET_ADDRESS;

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  const xDVG = await deploy("xDVD", {
    from: deployer.address,
    args: [dvgAddress],
  });
  console.log("xDVG address: ", xDVG.address);

  const DVGUniBot = await deploy("DVDUniBot", {
    from: deployer.address,
    args: [dvgAddress, xDVG.address, uniswapV2Router02Address, walletAddress],
  });
  console.log("DVDUniBot address: ", DVGUniBot.address);
};
module.exports.tags = ["mainnet_deploy"];
