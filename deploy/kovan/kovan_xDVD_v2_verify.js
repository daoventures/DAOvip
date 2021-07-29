const { ethers, run } = require("hardhat");

module.exports = async () => {
  const xDVD = await ethers.getContract("xDVD");
  await run("verify:verify", {
    address: xDVD.address,
    contract: "contracts/xDVD.sol:xDVD",
  });
};

module.exports.tags = ["kovan_xDVD_v2_verify"];
