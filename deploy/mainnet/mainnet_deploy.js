const { ethers, network, artifacts, upgrades } = require("hardhat");
const { mainnet: network_ } = require("../../addresses");

const dvgAddress = network_.DVG;

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy, catchUnknownSigner } = deployments;
  const [deployer] = await ethers.getSigners();

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

  let impl = await ethers.getContract("xDVD_Implementation")
  console.log('Implementation address', impl.address)
  // you could pause the deployment here and wait for input to continue

  // await xDVD.deployed();

  console.log("Proxy xDVD address", (await xDVD).address);
};

module.exports.tags = ["mainnet_deploy"];
