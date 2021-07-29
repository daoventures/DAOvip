const { ethers, network } = require("hardhat");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  const xDVD = await deploy("xDVD", {
    from: deployer.address,
  });
  console.log("xDVD address: ", xDVD.address);
};
module.exports.tags = ["kovan_xDVD_v2_deploy"];
