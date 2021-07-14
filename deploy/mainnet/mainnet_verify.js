const { ethers, run } = require("hardhat");
const { mainnet: network_ } = require("../../addresses");

const dvgAddress = network_.DVG;
const uniswapV2Router02Address = network_.UniswapV2Router02;
const walletAddress = process.env.WALLET_ADDRESS;

module.exports = async () => {
  // const xDVG = await ethers.getContract("xDVG");
  // await run("verify:verify", {
  //   address: xDVG.address,
  //   constructorArguments: [dvgAddress],
  //   contract: "contracts/xDVG.sol:xDVG",
  // });
  // const DVGUniBot = await ethers.getContract("DVGUniBot");
  // await run("verify:verify", {
  //   address: DVGUniBot.address,
  //   constructorArguments: [
  //     dvgAddress,
  //     xDVG.address,
  //     uniswapV2Router02Address,
  //     walletAddress,
  //   ],
  //   contract: "contracts/DVGUniBot.sol:DVGUniBot",
  // });
};

module.exports.tags = ["mainnet_verify"];
