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
  const MAX_AMOUNT = ethers.utils.parseEther("100000");
  const DENOMINATOR = 10000;
  const percentOfShareForXDVD = 3333;

  let owner, wallet;
  let dist, dvd, lpDvdEth;
  let xdvdAddress;
  let startTime, endTime;

  before(async () => {
    [owner, a1, a2, ...accounts] = await ethers.getSigners();

    await deployments.fixture(["hardhat_DVDDistBotUpgradeable_deploy"])

    const implArtifact = await deployments.getArtifact("DVDDistBotUpgradeable");
    const dvdDistBotUpgradeableProxy = await ethers.getContract("DVDDistBotUpgradeableProxy");
    dist = new ethers.Contract(dvdDistBotUpgradeableProxy.address, implArtifact.abi, a1);

    dvd = new ethers.Contract(network_.DVD.tokenAddress, ERC20_ABI, a1);

    const lpArtifact = await deployments.getArtifact("IUniswapV2Pair");
    lpDvdEth = new ethers.Contract(await dist.lpDvdEth(), lpArtifact.abi, a1);

    wallet = await ethers.getSigner(network_.Global.treasuryWalletAddr);
    xdvdAddress = network_.xDVD.tokenAddress;
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
        assert.equal(await dist.maxAmount(), MAX_AMOUNT.toString(), "The maxAmount is invalid");
        assert.equal(await dist.supply(), SUPPLY.toString(), "The supply disagreement");
        assert.equal(await dist.period(), PERIOD, "The period disagreement");
        assert.equal(await dist.percentOfShareForXDVD(), percentOfShareForXDVD, "The percentOfShareForXDVD disagreement");
        assert.equal(await dist.percentOfShareForLP(), DENOMINATOR-percentOfShareForXDVD, "The percentOfShareForLP disagreement");
        expect(parseInt(startTime)).greaterThan(0);
        expect(parseInt(endTime)).equal(parseInt(startTime) + PERIOD);

        const token0 = await lpDvdEth.token0();
        const token1 = await lpDvdEth.token1();
        expect(token0 == dvd.address || token1 == dvd.address).equal(true);
    });
    
    it("Should be set correctly", async () => {
      await expectRevert(dist.setWallet(network_.xDVD.proxyAdmin), "Ownable: caller is not the owner");
      await dist.connect(owner).setWallet(network_.xDVD.proxyAdmin);
      expect(await dist.wallet()).equal(network_.xDVD.proxyAdmin);
      await dist.connect(owner).setWallet(network_.Global.treasuryWalletAddr);

      await expectRevert(dist.setMaxAmount(ethers.utils.parseEther("1000").toString()), "Ownable: caller is not the owner");
      await dist.connect(owner).setMaxAmount(ethers.utils.parseEther("1000").toString());
      expect(await dist.maxAmount()).equal(ethers.utils.parseEther("1000").toString());
      await dist.connect(owner).setMaxAmount(MAX_AMOUNT.toString());

      await expectRevert(dist.setPeriod(30*24*3600), "Ownable: caller is not the owner");
      await dist.connect(owner).setPeriod(30*24*3600);
      expect(await dist.period()).equal(30*24*3600);
      await dist.connect(owner).setPeriod(PERIOD);

      await expectRevert(dist.setSupply(0), "Ownable: caller is not the owner");
      await dist.connect(owner).setSupply(0);
      expect(await dist.supply()).equal(0);
      await dist.connect(owner).setSupply(SUPPLY.toString());

      await expectRevert(dist.setPercentOfShare(2000, 8001), "Ownable: caller is not the owner");
      await expectRevert(dist.connect(owner).setPercentOfShare(2000, 8001), "The value should be equal or less than 10000");
      await dist.connect(owner).setPercentOfShare(2000, 8000);
      expect(await dist.percentOfShareForXDVD()).equal(2000);
      expect(await dist.percentOfShareForLP()).equal(8000);
      await dist.connect(owner).setPercentOfShare(percentOfShareForXDVD, DENOMINATOR-percentOfShareForXDVD);
    });
  });

  describe('distribute', () => {
    it('simple distribute with correct percent', async () => {
      var curTime = await blockTimestamp();
      await increaseTime(parseInt(startTime) + PERIOD/6 - curTime);

      var [distributable, curAmountOnXDVD, rewardForXDVD, curAmountOnUniLP, rewardForUniLP] = await dist.getDistributableAmount();
      expect(distributable).equal(SUPPLY.div(6).integerValue().toString());
      expect(await dvd.balanceOf(xdvdAddress)).equal(curAmountOnXDVD);
      expect(await dvd.balanceOf(lpDvdEth.address)).equal(curAmountOnUniLP);
      expect(rewardForXDVD).equal(distributable.mul(percentOfShareForXDVD).div(DENOMINATOR));
      expect(rewardForUniLP).equal(distributable.mul(DENOMINATOR-percentOfShareForXDVD).div(DENOMINATOR));
      const [reserve0, reserve1, ]  = await lpDvdEth.getReserves();

      await dist.distDVD();
      expect(await dist.amountDistributed()).equal(MAX_AMOUNT);
      const xdvdReceived = (await dvd.balanceOf(xdvdAddress)).sub(curAmountOnXDVD);
      const lpReceived = (await dvd.balanceOf(lpDvdEth.address)).sub(curAmountOnUniLP);
      expect(xdvdReceived).equal(MAX_AMOUNT.mul(percentOfShareForXDVD).div(DENOMINATOR));
      expect(lpReceived).equal(MAX_AMOUNT.mul(DENOMINATOR-percentOfShareForXDVD).div(DENOMINATOR));

      const [r0, r1, ]  = await lpDvdEth.getReserves();
      var dvdChange;
      if ((await lpDvdEth.token0()) == dvd.address) {
        dvdChange = r0.sub(reserve0);
      } else {
        dvdChange = r1.sub(reserve1);
      }
      expect(lpReceived).equal(dvdChange);

      // Check if setSupply works correctly
      await expectRevert(dist.connect(owner).setSupply(MAX_AMOUNT.sub(1)), "New supply must be equal or greater than amountDistributed");
      await dist.connect(owner).setSupply(MAX_AMOUNT);
      expect(await dist.supply()).equal(MAX_AMOUNT);
      await increaseTime(3600);
      [distributable, , , , ] = await dist.getDistributableAmount();
      expect(distributable).equal(0);
      await dist.connect(owner).setSupply(SUPPLY.toString());

      // Check if setPeriod works correctly
      await expectRevert(dist.connect(owner).setPeriod(PERIOD/6), "The calculated endTime should be greater than current time");
    });

    it('end of distribute', async () => {
      await dist.connect(owner).setMaxAmount(SUPPLY.multipliedBy(2).toString());
      await increaseTime(parseInt(startTime) + PERIOD*2 - (await blockTimestamp()));
      var [distributable, , , , ] = await dist.getDistributableAmount();
      expect(distributable).equal(SUPPLY.minus(MAX_AMOUNT.toString()).toString());
      await dist.distDVD();
      expect(await dist.amountDistributed()).equal(SUPPLY.integerValue().toString());
    });
  });
});