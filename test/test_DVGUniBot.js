const {getNamedAccounts, getUnnamedAccounts, deployments, getChainId, ethers, network} = require("hardhat");
const { assert } = require("chai")

const {mainnet: network_} = require("../addresses");

const usdtAddress= network_.USDT;
const dvgAddress= network_.DVG;
const uniswapV2Router02Address = network_.UniswapV2Router02;
const walletAddress = process.env.WALLET_ADDRESS;

const usdtABI = require("../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json").abi;
const dvgABI = require("../artifacts/contracts/interfaces/IDVGToken.sol/IDVGToken.json").abi;
const uniswapV2Router02ABI = require("../artifacts/contracts/interfaces/IUniswapV2Router02.sol/IUniswapV2Router02.json").abi;

let dvg, xdvg, usdt, uniswapV2Router02, signer, deployer, userAddress, walletUSDTBalance, tx;

contract("DVGUniBot", async () => {
    beforeEach(async () => {
        await deployments.fixture(["hardhat_xDVG"]);

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [walletAddress],
        });
        signer = await ethers.getSigner(walletAddress);

        [deployer, user] = await ethers.getSigners();
        deployerAddress = deployer.address;
        userAddress = user.address;  
    
        dvg = new ethers.Contract(dvgAddress, dvgABI, signer);
        usdt = new ethers.Contract(usdtAddress, usdtABI, signer);
        uniswapV2Router02 = new ethers.Contract(uniswapV2Router02Address, uniswapV2Router02ABI, signer);
    
        xdvg = await ethers.getContract("xDVG");
        dvgUniBot = await ethers.getContract("DVGUniBot");      
    });

    it("Should succeed to buy DVG from UniswapV2 using the funds in wallet", async () => {
        assert.equal(await dvg.balanceOf(xdvg.address), 0);
        console.log("DVG balance of xDVG smart contract before bought:", (parseInt(await dvg.balanceOf(xdvg.address)) / parseInt(ethers.utils.parseEther("1"))));

        walletUSDTBalance = await usdt.balanceOf(walletAddress);

        await usdt.approve(dvgUniBot.address, walletUSDTBalance);

        tx = await dvgUniBot.connect(deployer).setToken(usdt.address, true, 1e6);
        assert.equal((await dvgUniBot.token(usdt.address))["allowed"], true);
        assert.equal((await dvgUniBot.token(usdt.address))["decimals"], 1e6);

        tx = await dvgUniBot.connect(deployer).setAmount(1, 1);

        tx = await dvgUniBot.connect(user).buyDVG(usdt.address);
        const amount = await dvgUniBot.amount();
        assert.equal(await usdt.balanceOf(walletAddress), walletUSDTBalance - amount * 1e6);
        assert.notEqual(await dvg.balanceOf(xdvg.address), 0); 
        console.log("DVG balance of xDVG smart contract after bought:", (parseInt(await dvg.balanceOf(xdvg.address)) / parseInt(ethers.utils.parseEther("1"))));
        console.log("DVG price in USD:", amount / (parseInt(await dvg.balanceOf(xdvg.address)) / parseInt(ethers.utils.parseEther("1"))));
    });

    it ("Should succeed to change the token information", async () => {
        await dvgUniBot.connect(deployer).setToken(usdt.address, true, 1e6);
        assert.equal((await dvgUniBot.token(usdt.address))["allowed"], true);
        assert.equal((await dvgUniBot.token(usdt.address))["decimals"], 1e6);

        await dvgUniBot.connect(deployer).setToken(usdt.address, false, 0);
        assert.equal((await dvgUniBot.token(usdt.address))["allowed"], false);
        assert.equal((await dvgUniBot.token(usdt.address))["decimals"], 0);
    });

});