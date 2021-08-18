const {
  getNamedAccounts,
  getUnnamedAccounts,
  deployments,
  getChainId,
  ethers,
  network,
} = require("hardhat");
const { assert, expect } = require("chai");
const ERC20_ABI = require("../node_modules/@openzeppelin/contracts/build/contracts/ERC20.json").abi;
const { mainnet: network_ } = require("../parameters");

const { AddressZero, advanceBlocks, blockNumber, UInt256Max } = require('./utils/Ethereum');

describe("DVDDistBot", async () => {

  let owner, wallet;
  let dist, dvd;
  let xdvdAddress, lpDvdEthAddress;
  let startTime, endTime;

  before(async () => {
    [deployer, a1, a2, ...accounts] = await ethers.getSigners();

    await deployments.fixture(["hardhat_DVDDistBotUpgradeable_deploy"])

    const implArtifact = await deployments.getArtifact("DVDDistBotUpgradeable");
    const dvdDistBotUpgradeableProxy = await ethers.getContract("DVDDistBotUpgradeableProxy")
    dist = new ethers.Contract(dvdDistBotUpgradeableProxy.address, implArtifact.abi, a1);

    dvd = new ethers.Contract(network_.DVD.tokenAddress, ERC20_ABI, a1);

    owner = await ethers.getSigner(network_.xDVD.proxyAdmin);
    wallet = await ethers.getSigner(network_.Global.treasuryWalletAddr);
    xdvdAddress = network_.xDVD.tokenAddress;
    lpDvdEthAddress = await dist.lpDvdEth();
    startTime = await dist.startTime();
    endTime = await dist.endTime();

    const vault = await ethers.getSigner(network_.DVD.vaultAddress);
    await dvd.connect(vault).transfer(wallet.address, await dvd.balanceOf(vault.address));
    await dvd.connect(wallet).approve(dist.address, UInt256Max());
  });

  describe('initial value', () => {
    it("Should be set with correct initial vaule", async () => {
        expect(await dist.owner()).equal(deployer.address);
        assert.equal(await dist.dvd(), dvd.address, "The DVD address disagreement");
        assert.equal(await dist.xdvd(), xdvdAddress, "The xDVD address disagreement");
        assert.notEqual(await dist.lpDvdEth(), AddressZero(), "lpDvdEth is invalid");
        assert.equal(await dist.wallet(), network_.Global.treasuryWalletAddr, "The wallet address is invalid");
        assert.equal(await dist.maxAmount(), ethers.utils.parseEther("500"), "The maxAmount is invalid");
        expect(startTime).greaterThan(0);
        expect(endTime).equal(parseInt(startTime) + 180*24*3600);
    });
  });

});