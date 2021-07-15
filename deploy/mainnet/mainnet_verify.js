const { ethers, run } = require("hardhat");
const { mainnet: network_ } = require("../../addresses");

const dvgAddress = network_.DVG;
const uniswapV2Router02Address = network_.UniswapV2Router02;
const walletAddress = process.env.WALLET_ADDRESS;

module.exports = async () => {
  const xDVD = await ethers.getContract("xDVD_Implementation");
  const xDVDProxy = await ethers.getContract("xDVD");

  //verify implementation
  await run("verify:verify", {
    address: xDVD.address,
    contract: "contracts/xDVD.sol:xDVD",
  });
  
  const DVGUniBot = await ethers.getContract("DVDUniBot");
  await run("verify:verify", {
    address: DVGUniBot.address,
    constructorArguments: [
      dvgAddress,
      xDVDProxy.address,
      uniswapV2Router02Address,
      walletAddress,
    ],
    contract: "contracts/DVDUniBot.sol:DVDUniBot",
  });
};

module.exports.tags = ["mainnet_verify"];
module.exports.dependencies = ["mainnet_deploy_bot"]
