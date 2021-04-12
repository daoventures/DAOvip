const { ethers, network } = require("hardhat");
const { mainnet: network_ } = require("../../addresses");

const dvgAddress = network_.DVG;
const uniswapV2Router02Address = network_.UniswapV2Router02;
const walletAddress = process.env.WALLET_ADDRESS;

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  const xDVG = await deploy("xDVG", {
    from: deployer.address,
    args: [dvgAddress],
  });

  const DVGUniBot = await deploy("DVGUniBot", {
    from: deployer.address,
    args: [
      dvgAddress,
      xDVG.address,
      uniswapV2Router02Address,
      walletAddress,
    ],
  });

};
module.exports.tags = ["hardhat_xDVG"]
