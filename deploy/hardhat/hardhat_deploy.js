const { ethers, network, artifacts, upgrades } = require("hardhat");
const { mainnet: network_ } = require("../../addresses");

const dvgAddress = network_.DVG;
/* const proxyAdmin = network_.ProxyAdmin 
const uniswapV2Router02Address = network_.UniswapV2Router02;
const walletAddress = process.env.WALLET_ADDRESS; */

module.exports = async ({deployments}) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  const IMPL = await ethers.getContractFactory("xDVD")
  const impl = await upgrades.deployProxy(IMPL,[dvgAddress])

  await impl.deployed() 
  
  console.log("Proxy xDVD address", impl.address)
}

module.exports.tags = ["hardhat_deploy"];
