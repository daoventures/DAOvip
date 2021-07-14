const {
  getNamedAccounts,
  getUnnamedAccounts,
  deployments,
  getChainId,
  ethers,
  network,
} = require("hardhat");
const { assert, expect } = require("chai");

const { mainnet: network_ } = require("../addresses");

const usdtAddress = network_.USDT;
const dvgAddress = network_.DVG;
const uniswapV2Router02Address = network_.UniswapV2Router02;

// Random Wallet with tokens
const walletAddress = "0x44bdb19db1cd29d546597af7dc0549e7f6f9e480";

let dvg,
  xdvg,
  usdt,
  uniswapV2Router02,
  signer,
  deployer,
  userAddress,
  walletUSDTBalance,
  tx;

// Test Depositing DVG
// TODO: change to DVD later on

// Test Withdrawing DVG
// TODO: change to DVD later on

// Test Token Name = "DVD"

contract("xDVD", async () => {
  beforeEach(async () => {
    await deployments.fixture(["hardhat_deploy"]);

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [walletAddress],
    });

    signer = await ethers.getSigner(walletAddress);

    [deployer, user] = await ethers.getSigners();
    deployerAddress = deployer.address;
    userAddress = user.address;

    const usdtABI = (await hre.artifacts.readArtifact("IERC20")).abi;
    // console.log("🚀 | usdtABI", usdtABI);
    const dvgABI = (await hre.artifacts.readArtifact("IDVGToken")).abi;
    const uniswapV2Router02ABI = (
      await hre.artifacts.readArtifact("IUniswapV2Router02")
    ).abi;

    // TODO: change to DVD later on
    dvg = new ethers.Contract(dvgAddress, dvgABI, signer);
    usdt = new ethers.Contract(usdtAddress, usdtABI, signer);
    uniswapV2Router02 = new ethers.Contract(
      uniswapV2Router02Address,
      uniswapV2Router02ABI,
      signer
    );

    xdvd = await ethers.getContract("xDVD");

    // TODO: Test Uni Bot later
    // dvgUniBot = await ethers.getContract("DVGUniBot");
  });

  it("Should have token symbol xDVD", async () => {
    const symbol = xdvd.symbol();
    console.log("🚀 | it | symbol", symbol);
  });

  it("Should deposit DVD successfully", async () => {
    await dvgUniBot.connect(deployer).setToken(usdt.address, true, 1e6);
    assert.equal((await dvgUniBot.token(usdt.address))["allowed"], true);
    assert.equal((await dvgUniBot.token(usdt.address))["decimals"], 1e6);

    await dvgUniBot.connect(deployer).setToken(usdt.address, false, 0);
    assert.equal((await dvgUniBot.token(usdt.address))["allowed"], false);
    assert.equal((await dvgUniBot.token(usdt.address))["decimals"], 0);
  });
});
