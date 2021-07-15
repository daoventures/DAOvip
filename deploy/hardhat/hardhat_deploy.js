const { ethers, network, artifacts, upgrades } = require("hardhat");
const { mainnet: network_ } = require("../../addresses");

const dvgAddress = network_.DVG;
/* const proxyAdmin = network_.ProxyAdmin 
const uniswapV2Router02Address = network_.UniswapV2Router02;
const walletAddress = process.env.WALLET_ADDRESS; */

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy, catchUnknownSigner } = deployments;
  const [deployer] = await ethers.getSigners();

  // const IMPL = await ethers.getContractFactory("xDVD");
  // const impl = await upgrades.deployProxy(IMPL, [dvgAddress]);
  let xDVD;

  await catchUnknownSigner(
    (xDVD = deploy("xDVD", {
      from: deployer.address,
      proxyContract: "OpenZeppelinTransparentProxy",
      proxy: {
        owner: deployer.address, // Owner of proxy
        methodName: "initialize", // Method to execute when deploying proxy
      },
      args: [dvgAddress],
    }))
  );

  // you could pause the deployment here and wait for input to continue

  // await xDVD.deployed();

  console.log("Proxy xDVD address", xDVD.address);
};

module.exports.tags = ["hardhat_deploy"];
