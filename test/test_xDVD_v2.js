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

const MAX_INT = ethers.constants.MaxUint256;
const ZERO = ethers.constants.Zero;

describe("xDVD v2", async () => {

  let owner, user;
  let xdvd, dvd;

  before(async () => {
    [deployer, a1, a2, ...accounts] = await ethers.getSigners();

    owner = await ethers.getSigner(network_.xDVD.proxyAdmin);
  });

  beforeEach(async () => {
    await deployments.fixture(["hardhat_xDVD_v2_deploy"])

    const implArtifact = await deployments.getArtifact("xDVD");
    xdvd = new ethers.Contract(network_.xDVD.tokenAddress, implArtifact.abi, deployer);

    dvd = new ethers.Contract(network_.DVD.tokenAddress, ERC20_ABI, deployer);

    user = await ethers.getSigner(network_.DVD.vaultAddress);
  });

  describe("Token Info", async function () {
    it("1. Should have token symbol xDVD", async () => {
      const symbol = await xdvd.symbol();
      console.log("🚀 | 1. | symbol", symbol);
      expect(symbol).to.equal("xDVD");
    });

    it("2. Should have token name VIP DVD", async () => {
      const name = await xdvd.name();
      console.log("🚀 | 2. | name", name);
      expect(name).to.equal("VIP DVD");
    });
  });

  describe("Deposit/Withdrawal", async function () {
    it("3. Should Deposit Successfully", async () => {
      const balanceBefore = await dvd.balanceOf(user.address);
      console.log("🚀 | 3. | balanceBefore", balanceBefore.toString());
      const depositAmount = ethers.utils.parseEther("1.0");
      console.log("🚀 | 3. | depositAmount", depositAmount.toString());
      await dvd.increaseAllowance(xdvd.address, depositAmount);
      await xdvd.connect(user).deposit(depositAmount);
      const balanceAfter = await dvd.balanceOf(user.address);
      console.log("🚀 | 3. | balanceAfter", balanceAfter.toString());
      expect(balanceBefore.sub(balanceAfter)).to.equal(depositAmount);

      const balanceXDVD = await xdvd.balanceOf(user.address);
      console.log("🚀 | 3. | balanceXDVD", balanceXDVD.toString());
      expect(balanceXDVD).to.equal(depositAmount);
    });

    it("4. Should Withdraw Successfully", async () => {
      const balanceBefore = await dvd.balanceOf(user.address);
      console.log("🚀 | 4. | balanceBefore", balanceBefore.toString());

      let balanceXDVD = await xdvd.balanceOf(user.address);
      console.log("🚀 | 4. | balanceXDVD", balanceXDVD.toString());
      const withdrawAmount = ethers.utils.parseEther("1.0");
      console.log(
        "🚀 | 4. | withdrawAmount",
        ethers.utils.formatEther(withdrawAmount)
      );
      await xdvd.connect(user).withdraw(withdrawAmount);
      const balanceAfter = await dvd.balanceOf(user.address);
      console.log("🚀 | 4. | balanceAfter", balanceAfter.toString());
      expect(balanceAfter.sub(balanceBefore)).to.equal(withdrawAmount);
      balanceXDVD = await xdvd.balanceOf(user.address);
      expect(balanceXDVD).to.equal(ZERO);

      [_, depositedAmount] = await xdvd.getTier(user.address);
      console.log(
        "🚀 | 4. | depositedAmount",
        ethers.utils.formatEther(depositedAmount)
      );
      expect(depositedAmount).to.equal(ZERO);
    });
  });

  describe("VIP Tiers", async function () {
    it("5. Should Display correct tiers", async () => {
      let balanceBefore,
        balanceXDVD,
        currentTier,
        depositedAmount,
        depositAmount,
        withdrawAmount;

      balanceBefore = await dvd.balanceOf(user.address);
      console.log("🚀 | 5. | balanceBefore", balanceBefore.toString());

      balanceXDVD = await xdvd.balanceOf(user.address);
      console.log("🚀 | 5. | balanceXDVD", balanceXDVD.toString());
      expect(balanceXDVD).to.equal(ZERO);

      [currentTier, depositedAmount] = await xdvd.getTier(user.address);
      console.log("🚀 | 5. | currentTier", currentTier.toString());
      console.log(
        "🚀 | 5. | depositedAmount",
        ethers.utils.formatEther(depositedAmount)
      );
      expect(currentTier.toString()).to.equal("0");

      await dvd.increaseAllowance(xdvd.address, MAX_INT);

      // Deposited amount = 999 => Tier 1
      depositAmount = ethers.utils.parseEther("999.0");
      console.log("🚀 | 5. | depositAmount", depositAmount.toString());
      await xdvd.connect(user).deposit(depositAmount);
      [currentTier, depositedAmount] = await xdvd.getTier(user.address);
      console.log("🚀 | 5. | currentTier", currentTier.toString());
      console.log(
        "🚀 | 5. | depositedAmount",
        ethers.utils.formatEther(depositedAmount)
      );
      expect(currentTier.toString()).to.equal("0");

      // Deposited amount = 2000 => Tier 1
      depositAmount = ethers.utils.parseEther("1001.0");
      console.log("🚀 | 5. | depositAmount", depositAmount.toString());
      await xdvd.connect(user).deposit(depositAmount);
      [currentTier, depositedAmount] = await xdvd.getTier(user.address);
      console.log("🚀 | 5. | currentTier", currentTier.toString());
      console.log(
        "🚀 | 5. | depositedAmount",
        ethers.utils.formatEther(depositedAmount)
      );
      expect(currentTier.toString()).to.equal("1");

      // Deposited amount = 1000 => Tier 0
      withdrawAmount = ethers.utils.parseEther("1000.0");
      console.log(
        "🚀 | 5. | withdrawAmount",
        ethers.utils.formatEther(withdrawAmount)
      );
      await xdvd.connect(user).withdraw(withdrawAmount);
      [currentTier, depositedAmount] = await xdvd.getTier(user.address);
      console.log("🚀 | 5. | currentTier", currentTier.toString());
      console.log(
        "🚀 | 5. | depositedAmount",
        ethers.utils.formatEther(depositedAmount)
      );
      expect(currentTier.toString()).to.equal("0");

      // Deposited amount = 10001 => Tier 2
      depositAmount = ethers.utils.parseEther("9001.0");
      console.log("🚀 | 5. | depositAmount", depositAmount.toString());
      await xdvd.connect(user).deposit(depositAmount);
      [currentTier, depositedAmount] = await xdvd.getTier(user.address);
      console.log("🚀 | 5. | currentTier", currentTier.toString());
      console.log(
        "🚀 | 5. | depositedAmount",
        ethers.utils.formatEther(depositedAmount)
      );
      expect(currentTier.toString()).to.equal("2");

      // Deposited amount = 50001 => Tier 3
      depositAmount = ethers.utils.parseEther("40000.0");
      console.log("🚀 | 5. | depositAmount", depositAmount.toString());
      await xdvd.connect(user).deposit(depositAmount);
      [currentTier, depositedAmount] = await xdvd.getTier(user.address);
      console.log("🚀 | 5. | currentTier", currentTier.toString());
      console.log(
        "🚀 | 5. | depositedAmount",
        ethers.utils.formatEther(depositedAmount)
      );
      expect(currentTier.toString()).to.equal("3");

      // Deposited amount = 50001 => Tier 3
      depositAmount = ethers.utils.parseEther("50000.0");
      console.log("🚀 | 5. | depositAmount", depositAmount.toString());
      await xdvd.connect(user).deposit(depositAmount);
      [currentTier, depositedAmount] = await xdvd.getTier(user.address);
      console.log("🚀 | 5. | currentTier", currentTier.toString());
      console.log(
        "🚀 | 5. | depositedAmount",
        ethers.utils.formatEther(depositedAmount)
      );
      expect(currentTier.toString()).to.equal("4");
    });
  });
});
