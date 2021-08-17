// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

import "../interfaces/IUniswapV2Factory.sol";
import "../interfaces/IUniswapV2Router02.sol";

contract DVDDistBotUpgradeable is OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using SafeMathUpgradeable for uint256;
    using AddressUpgradeable for address;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    uint256 public constant SUPPLY = 5500000e18; // 5.5M DVD
    uint256 public constant PERIOD = 180 days; // 6 months

    IERC20Upgradeable public dvd; 
    address public xdvd; 
    address public lpDvdEth;

    address public wallet;
    uint256 public maxAmount;

    uint256 public startTime;
    uint256 public endTime;
    uint256 public amountDistributed;

    event DistDVD(address indexed user, uint256 dvdAmount);
    event SetWallet(address indexed newWallet);
    event SetAmount(uint256 maxAmount);

    /// @dev Require that the caller must be an EOA account to avoid flash loans
    modifier onlyEOA() {
        require(msg.sender == tx.origin, "Not EOA");
        _;
    }

    function initialize(
        IERC20Upgradeable _dvd, 
        address _xdvd, 
        IUniswapV2Router02 _router, 
        address _wallet
    ) external initializer {
        require(address(_dvd) != address(0), "DVD address is invalid");
        require(address(_xdvd) != address(0), "xDVD address is invalid");
        require(address(_router) != address(0), "UniswapV2Router address is invalid");
        require(address(_wallet) != address(0), "Wallet address is invalid");

        __Ownable_init();
        __ReentrancyGuard_init();

        dvd = _dvd;
        xdvd = _xdvd;

        IUniswapV2Factory uniFactory = IUniswapV2Factory(_router.factory());
        lpDvdEth = uniFactory.getPair(address(dvd), address(_router.WETH()));
        require(lpDvdEth != address(0), "LP address is invalid");

        wallet = _wallet;
        maxAmount = 500e18;

        startTime = block.timestamp;
        endTime = startTime.add(PERIOD);
    }

    receive() external payable {}

    function setWallet(address _wallet) external onlyOwner {
        wallet = _wallet;
        emit SetWallet(_wallet);
    }

    function setAmount(uint256 _maxAmount) external onlyOwner {
        maxAmount = _maxAmount;
        emit SetAmount(maxAmount);
    }

    function getDistributableAmount() public returns(uint256) {
        uint256 lastTime = (block.timestamp < endTime) ? block.timestamp : endTime;
        uint256 amountAllowed = SUPPLY.mul(lastTime.sub(startTime)).div(PERIOD);
        return amountAllowed.sub(amountDistributed);
    }

    function distDVD() external onlyEOA nonReentrant {
        uint256 dvdAmount = getDistributableAmount();
        require(0 < dvdAmount, "Nothing to be distributable");
        if (maxAmount < dvdAmount) {
            dvdAmount = maxAmount;
        }

        amountDistributed = amountDistributed.add(dvdAmount);
        uint256 shareForXDVD = dvdAmount.div(3);
        dvd.safeTransfer(xdvd, shareForXDVD);
        dvd.safeTransfer(lpDvdEth, dvdAmount.sub(shareForXDVD));

        emit DistDVD(msg.sender, dvdAmount);
    }

    uint256[42] private __gap;
}