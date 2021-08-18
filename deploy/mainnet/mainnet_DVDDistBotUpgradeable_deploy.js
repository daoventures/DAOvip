const { ethers } = require("hardhat");
const { mainnet: network_ } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  console.log("Now deploying DVDDistBotUpgradeable on Mainnet...");
  const impl = await deploy("DVDDistBotUpgradeable", {
    from: deployer.address,
  });
  console.log("DVDDistBotUpgradeable impl address: ", impl.address);

  const implArtifact = await deployments.getArtifact("DVDDistBotUpgradeable");
  const iface = new ethers.utils.Interface(JSON.stringify(implArtifact.abi));
  const data = iface.encodeFunctionData("initialize", [
      network_.DVD.tokenAddress,
      network_.xDVD.tokenAddress,
      network_.Global.uniswapRouter,
      network_.Global.treasuryWalletAddr,
  ]);

  console.log("Now deploying DVDDistBotUpgradeableProxy on Mainnet...");
  const proxy = await deploy("DVDDistBotUpgradeableProxy", {
    from: deployer.address,
    args: [
      impl.address,
      network_.Global.proxyAdmin,
      data,
    ],
  });
  console.log("DVDDistBotUpgradeable proxy address: ", proxy.address);
};
module.exports.tags = ["mainnet_DVDDistBotUpgradeable_deploy"];
