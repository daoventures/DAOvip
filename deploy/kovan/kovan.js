const { deployments } = require("hardhat");

module.exports = async () => {
  const xDVG = await deployments.get("xDVG");
  const DVGUniBot = await deployments.get("DVGUniBot");

  console.log("Summary:");
  console.log("xDVG address: ", xDVG.address);
  console.log("DVGUniBot address: ", DVGUniBot.address);
};
module.exports.tags = ["kovan"];
module.exports.dependencies = [
  "kovan_deploy",
  "kovan_verify",
];
