const { ethers, run } = require("hardhat");
const { mainnet: network_ } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const impl = await ethers.getContract("DVDDistBotUpgradeable");
  try {
    await run("verify:verify", {
      address: impl.address,
      contract: "contracts/DVDDistBot/DVDDistBotUpgradeable.sol:DVDDistBotUpgradeable",
    });
  } catch (e) {
  }

  const implArtifact = await deployments.getArtifact("DVDDistBotUpgradeable");
  const iface = new ethers.utils.Interface(JSON.stringify(implArtifact.abi));
  const data = iface.encodeFunctionData("initialize", [
    network_.DVD.tokenAddress,
    network_.xDVD.tokenAddress,
    network_.Global.uniswapRouter,
    network_.Global.treasuryWalletAddr,
  ]);

  const proxy = await ethers.getContract("DVDDistBotUpgradeableProxy");
  try {
    await run("verify:verify", {
      address: proxy.address,
      constructorArguments: [
        impl.address,
        network_.Global.proxyAdmin,
        data,
      ],
      contract: "contracts/DAOmine/DVDDistBotUpgradeableProxy.sol:DVDDistBotUpgradeableProxy",
    });
  } catch (e) {
  }
};
module.exports.tags = ["mainnet_DVDDistBotUpgradeable_verify"];
