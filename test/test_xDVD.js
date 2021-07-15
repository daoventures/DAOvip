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
const MAX_INT = ethers.constants.MaxUint256;
const ZERO = ethers.constants.Zero;

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
  describe("Token Info", async function () {
    before(async () => {
      await executeDeployment();
    });
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
    before(async () => {
      await executeDeployment();
    });
    it("3. Should Deposit Successfully", async () => {
      const balanceBefore = await dvg.balanceOf(signer.address);
      console.log("🚀 | 3. | balanceBefore", balanceBefore.toString());
      const depositAmount = ethers.utils.parseEther("1.0");
      console.log("🚀 | 3. | depositAmount", depositAmount.toString());
      await dvg.increaseAllowance(xdvd.address, depositAmount);
      await xdvd.connect(signer).deposit(depositAmount);
      const balanceAfter = await dvg.balanceOf(signer.address);
      console.log("🚀 | 3. | balanceAfter", balanceAfter.toString());
      expect(balanceBefore.sub(balanceAfter)).to.equal(depositAmount);

      const balanceXDVD = await xdvd.balanceOf(signer.address);
      console.log("🚀 | 3. | balanceXDVD", balanceXDVD.toString());
      expect(balanceXDVD).to.equal(depositAmount);
    });

    it("4. Should Withdraw Successfully", async () => {
      const balanceBefore = await dvg.balanceOf(signer.address);
      console.log("🚀 | 4. | balanceBefore", balanceBefore.toString());

      let balanceXDVD = await xdvd.balanceOf(signer.address);
      console.log("🚀 | 4. | balanceXDVD", balanceXDVD.toString());
      const withdrawAmount = ethers.utils.parseEther("1.0");
      console.log(
        "🚀 | 4. | withdrawAmount",
        ethers.utils.formatEther(withdrawAmount)
      );
      await xdvd.connect(signer).withdraw(withdrawAmount);
      const balanceAfter = await dvg.balanceOf(signer.address);
      console.log("🚀 | 4. | balanceAfter", balanceAfter.toString());
      expect(balanceAfter.sub(balanceBefore)).to.equal(withdrawAmount);
      balanceXDVD = await xdvd.balanceOf(signer.address);
      expect(balanceXDVD).to.equal(ZERO);

      [_, depositedAmount] = await xdvd.getTier(signer.address);
      console.log(
        "🚀 | 4. | depositedAmount",
        ethers.utils.formatEther(depositedAmount)
      );
      expect(depositedAmount).to.equal(ZERO);
    });
  });

  describe("VIP Tiers", async function () {
    before(async () => {
      await executeDeployment();
    });
    it("5. Should Display correct tiers", async () => {
      let balanceBefore,
        balanceXDVD,
        currentTier,
        depositedAmount,
        depositAmount,
        withdrawAmount;

      balanceBefore = await dvg.balanceOf(signer.address);
      console.log("🚀 | 5. | balanceBefore", balanceBefore.toString());

      balanceXDVD = await xdvd.balanceOf(signer.address);
      console.log("🚀 | 5. | balanceXDVD", balanceXDVD.toString());
      expect(balanceXDVD).to.equal(ZERO);

      [currentTier, depositedAmount] = await xdvd.getTier(signer.address);
      console.log("🚀 | 5. | currentTier", currentTier.toString());
      console.log(
        "🚀 | 5. | depositedAmount",
        ethers.utils.formatEther(depositedAmount)
      );
      expect(currentTier.toString()).to.equal("0");

      await dvg.increaseAllowance(xdvd.address, MAX_INT);

      // Deposited amount = 999 => Tier 1
      depositAmount = ethers.utils.parseEther("999.0");
      console.log("🚀 | 5. | depositAmount", depositAmount.toString());
      await xdvd.connect(signer).deposit(depositAmount);
      [currentTier, depositedAmount] = await xdvd.getTier(signer.address);
      console.log("🚀 | 5. | currentTier", currentTier.toString());
      console.log(
        "🚀 | 5. | depositedAmount",
        ethers.utils.formatEther(depositedAmount)
      );
      expect(currentTier.toString()).to.equal("0");

      // Deposited amount = 2000 => Tier 1
      depositAmount = ethers.utils.parseEther("1001.0");
      console.log("🚀 | 5. | depositAmount", depositAmount.toString());
      await xdvd.connect(signer).deposit(depositAmount);
      [currentTier, depositedAmount] = await xdvd.getTier(signer.address);
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
      await xdvd.connect(signer).withdraw(withdrawAmount);
      [currentTier, depositedAmount] = await xdvd.getTier(signer.address);
      console.log("🚀 | 5. | currentTier", currentTier.toString());
      console.log(
        "🚀 | 5. | depositedAmount",
        ethers.utils.formatEther(depositedAmount)
      );
      expect(currentTier.toString()).to.equal("0");

      // Deposited amount = 10001 => Tier 2
      depositAmount = ethers.utils.parseEther("9001.0");
      console.log("🚀 | 5. | depositAmount", depositAmount.toString());
      await xdvd.connect(signer).deposit(depositAmount);
      [currentTier, depositedAmount] = await xdvd.getTier(signer.address);
      console.log("🚀 | 5. | currentTier", currentTier.toString());
      console.log(
        "🚀 | 5. | depositedAmount",
        ethers.utils.formatEther(depositedAmount)
      );
      expect(currentTier.toString()).to.equal("2");

      // Deposited amount = 50001 => Tier 3
      depositAmount = ethers.utils.parseEther("40000.0");
      console.log("🚀 | 5. | depositAmount", depositAmount.toString());
      await xdvd.connect(signer).deposit(depositAmount);
      [currentTier, depositedAmount] = await xdvd.getTier(signer.address);
      console.log("🚀 | 5. | currentTier", currentTier.toString());
      console.log(
        "🚀 | 5. | depositedAmount",
        ethers.utils.formatEther(depositedAmount)
      );
      expect(currentTier.toString()).to.equal("3");

      // Deposited amount = 50001 => Tier 3
      depositAmount = ethers.utils.parseEther("50000.0");
      console.log("🚀 | 5. | depositAmount", depositAmount.toString());
      await xdvd.connect(signer).deposit(depositAmount);
      [currentTier, depositedAmount] = await xdvd.getTier(signer.address);
      console.log("🚀 | 5. | currentTier", currentTier.toString());
      console.log(
        "🚀 | 5. | depositedAmount",
        ethers.utils.formatEther(depositedAmount)
      );
      expect(currentTier.toString()).to.equal("4");
    });
  });
});

async function executeDeployment() {
  await deployments.fixture(["hardhat_deploy"]);

  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [walletAddress],
  });

  signer = await ethers.getSigner(walletAddress);

  [deployer, user] = await ethers.getSigners();
  deployerAddress = deployer.address;
  userAddress = user.address;

  const usdtABI = (await hre.artifacts.readArtifact("ERC20")).abi;
  // console.log("🚀 | usdtABI", usdtABI);
  const dvgABI = (await hre.artifacts.readArtifact("ERC20")).abi;
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
}
