const {
  getNamedAccounts,
  getUnnamedAccounts,
  deployments,
  getChainId,
  ethers,
  network,
} = require("hardhat");
const { expectRevert } = require('@openzeppelin/test-helpers');
const { assert, expect } = require("chai");
const { BigNumber } = require('bignumber.js');
BigNumber.config({
  EXPONENTIAL_AT: 1e+9,
  ROUNDING_MODE: BigNumber.ROUND_FLOOR,
})

const ERC20_ABI = require("../node_modules/@openzeppelin/contracts/build/contracts/ERC20.json").abi;
const { mainnet: network_ } = require("../parameters");

const { AddressZero, blockTimestamp, increaseTime, UInt256Max } = require('./utils/Ethereum');

describe("DVDDistBot", async () => {

  const SUPPLY = (new BigNumber(5500000)).shiftedBy(18);
  const PERIOD = 180*24*3600;

  let owner, wallet;
  let dist, dvd;
  let xdvdAddress, lpDvdEthAddress;
  let startTime, endTime;

  before(async () => {
    [owner, a1, a2, ...accounts] = await ethers.getSigners();

    await deployments.fixture(["hardhat_DVDDistBotUpgradeable_deploy"])

    const implArtifact = await deployments.getArtifact("DVDDistBotUpgradeable");
    const dvdDistBotUpgradeableProxy = await ethers.getContract("DVDDistBotUpgradeableProxy");
    dist = new ethers.Contract(dvdDistBotUpgradeableProxy.address, implArtifact.abi, a1);

    dvd = new ethers.Contract(network_.DVD.tokenAddress, ERC20_ABI, a1);

    wallet = await ethers.getSigner(network_.Global.treasuryWalletAddr);
    xdvdAddress = network_.xDVD.tokenAddress;
    lpDvdEthAddress = await dist.lpDvdEth();
    startTime = await dist.startTime();
    endTime = await dist.endTime();

    const vault = await ethers.getSigner(network_.DVD.vaultAddress);
    await dvd.connect(vault).transfer(wallet.address, await dvd.balanceOf(vault.address));
    await dvd.connect(wallet).approve(dist.address, UInt256Max());
  });

  describe('configuration', () => {
    it("Should be set with correct initial vaule", async () => {
        expect(await dist.owner()).equal(owner.address);
        assert.equal(await dist.dvd(), dvd.address, "The DVD address disagreement");
        assert.equal(await dist.xdvd(), xdvdAddress, "The xDVD address disagreement");
        assert.notEqual(await dist.lpDvdEth(), AddressZero(), "lpDvdEth is invalid");
        assert.equal(await dist.wallet(), network_.Global.treasuryWalletAddr, "The wallet address is invalid");
        assert.equal(await dist.maxAmount(), ethers.utils.parseEther("500").toString(), "The maxAmount is invalid");
        expect(parseInt(startTime)).greaterThan(0);
        expect(parseInt(endTime)).equal(parseInt(startTime) + PERIOD);
    });
    
    it("Should be set correctly", async () => {
      await expectRevert(dist.setWallet(network_.xDVD.proxyAdmin), "Ownable: caller is not the owner");
      await dist.connect(owner).setWallet(network_.xDVD.proxyAdmin);
      expect(await dist.wallet()).equal(network_.xDVD.proxyAdmin);
      await dist.connect(owner).setWallet(network_.Global.treasuryWalletAddr);

      await expectRevert(dist.setAmount(ethers.utils.parseEther("1000").toString()), "Ownable: caller is not the owner");
      await dist.connect(owner).setAmount(ethers.utils.parseEther("1000").toString());
      expect(await dist.maxAmount()).equal(ethers.utils.parseEther("1000").toString());
      await dist.connect(owner).setAmount(ethers.utils.parseEther("500").toString());
    });
  });

  describe('distribute', () => {
    it('simple distribute', async () => {
      var curTime = await blockTimestamp();
      await increaseTime(parseInt(startTime) + PERIOD/6 - curTime);
      var amount = await dist.getDistributableAmount();
      expect(amount).equal(SUPPLY.div(6).integerValue().toString());

      const xdvdOldBalance = await dvd.balanceOf(xdvdAddress);
      const lpOldBalance = await dvd.balanceOf(lpDvdEthAddress);
      await dist.distDVD();
      expect(await dist.amountDistributed()).equal(ethers.utils.parseEther("500"));
      const xdvdReceived = (await dvd.balanceOf(xdvdAddress)).sub(xdvdOldBalance);
      const lpReceived = (await dvd.balanceOf(lpDvdEthAddress)).sub(lpOldBalance);
      expect(xdvdReceived).equal(ethers.utils.parseEther("500").div(3));
      expect(lpReceived).equal(ethers.utils.parseEther("500").sub(xdvdReceived));
    });

    it('end of distribute', async () => {
      await dist.connect(owner).setAmount(SUPPLY.multipliedBy(2).toString());
      await increaseTime(parseInt(startTime) + PERIOD*2 - (await blockTimestamp()));
      expect(await dist.getDistributableAmount()).equal(SUPPLY.minus(ethers.utils.parseEther("500").toString()).toString());
      await dist.distDVD();
      expect(await dist.amountDistributed()).equal(SUPPLY.integerValue().toString());
    });
  });
});