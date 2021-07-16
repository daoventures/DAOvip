const { ethers, network } = require("hardhat");
const { mainnet: network_ } = require("../../addresses");

const dvgAddress = network_.DVG;
const uniswapV2Router02Address = network_.UniswapV2Router02;
const walletAddress = process.env.WALLET_ADDRESS;

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  const xDVD = await ethers.getContract("xDVD") //address of proxy
  console.log('xDVD.address', xDVD.address)

  const DVDUniBot = await deploy("DVDUniBot", {
    from: deployer.address,
    args: [dvgAddress, xDVD.address, uniswapV2Router02Address, walletAddress],
  });
  console.log("DVDUniBot address: ", DVDUniBot.address);
};
module.exports.tags = ["mainnet_deploy_bot"];
// module.exports.dependencies = ["mainnet_deploy"]
