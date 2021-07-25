// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@openzeppelin/contracts-upgradeable/math/MathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";

// This contract handles swapping to and from xDVD, DAOventures's vip token
contract xDVD is ERC20Upgradeable {
    using SafeMathUpgradeable for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    struct User {
        uint256 tier;  // It's not used in v2
        uint256 amountDeposited;
    }

    struct TierSnapshots {
        uint256[] blockNumbers;
        uint8[] tiers;
    }

    IERC20Upgradeable public dvd;

    uint256[] public tierAmounts;
    mapping(address => User) user;

    //
    // v2 variables
    //
    address private _owner;
    mapping (address => TierSnapshots) private _accountTierSnapshots;

    event Deposit(address indexed user, uint256 DVDAmount, uint256 xDVDAmount);
    event Withdraw(address indexed user, uint256 DVDAmount, uint256 xDVDAmount);
    event TierAmount(uint256[] newTierAmounts);
    event Tier(address indexed user, uint8 prevTier, uint8 newTier);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /// @dev Require that the caller must be an EOA account to avoid flash loans
    modifier onlyEOA() {
        require(msg.sender == tx.origin, "Not EOA");
        _;
    }

    modifier onlyContract() {
        require(AddressUpgradeable.isContract(msg.sender), "Not a contract");
        _;
    }

    //Define the DVD token contract
    function initialize(address _dvd, string memory _name, string memory _symbol, uint[] memory _tierAmounts) external initializer {
        require(_tierAmounts.length < 10, "Tier range is from 0 to 10");
        __ERC20_init(_name, _symbol);
        dvd = IERC20Upgradeable(_dvd);
        tierAmounts = _tierAmounts; 
    }

    // Pay some DVDs. Earn some shares. Locks DVD and mints xDVD
    function deposit(uint256 _amount) external onlyEOA {
        _deposit(msg.sender, msg.sender, _amount);
    }

    /**
     * @dev This function will be called from DAOmine. The msg.sender is DAOmine.
     */
    function depositByProxy(address _user, uint256 _amount) external onlyContract {
        require(_user != address(0), "Invalid user address");
        _deposit(msg.sender, _user, _amount);
    }

    function _deposit(address _proxy, address _user, uint256 _amount) internal {
        // Gets the amount of DVD locked in the contract
        uint256 totalDVD = dvd.balanceOf(address(this));
        // Gets the amount of xDVD in existence
        uint256 totalShares = totalSupply();
        uint256 what;
        // If no xDVD exists, mint it 1:1 to the amount put in
        if (totalShares == 0) {
            what = _amount;
            _mint(_proxy, _amount);
        }
        // Calculate and mint the amount of xDVD the DVD is worth. The ratio will change overtime
        else {
            what = _amount.mul(totalShares).div(totalDVD);
            _mint(_proxy, what);
        }
        // Lock the DVD in the contract
        dvd.safeTransferFrom(_proxy, address(this), _amount);

        user[_user].amountDeposited = user[_user].amountDeposited.add(_amount);
        _updateSnapshot(_user, user[_user].amountDeposited);

        emit Deposit(_user, _amount, what);
    }

    // Claim back your DVDs. Unclocks the staked + gained DVD and burns xDVD
    function withdraw(uint256 _share) public {
        // Gets the amount of xDVD in existence
        uint256 totalShares = totalSupply();
        // Calculates the amount of DVD the xDVD is worth
        uint256 what = _share.mul(dvd.balanceOf(address(this))).div(
            totalShares
        );

        uint256 _depositedAmount = user[msg.sender]
        .amountDeposited
        .mul(_share)
        .div(balanceOf(msg.sender));

        
        user[msg.sender].amountDeposited = user[msg.sender].amountDeposited.sub(_depositedAmount);
        _updateSnapshot(msg.sender, user[msg.sender].amountDeposited);

        _burn(msg.sender, _share);
        dvd.safeTransfer(msg.sender, what);

        emit Withdraw(msg.sender, what, _share);
    }

    function setTierAmount(uint[] memory _tierAmounts) external onlyOwner {
        require(_tierAmounts.length < 10, "Tier range is from 0 to 10");
        tierAmounts = _tierAmounts; 
        emit TierAmount(tierAmounts);
    }

    function _calculateTier(uint256 _depositedAmount) internal view returns (uint8) {
        if (_depositedAmount == 0) {
            // No tier bonus
            return 0;
        }
        for (uint8 i = 0; i < tierAmounts.length ; i ++) {
            if (_depositedAmount <= tierAmounts[i]) {
                return (i + 1);
            }
        }
        return uint8(tierAmounts.length) + 1;
    }

    function getTier(address _account) public view returns (uint8 _tier, uint256 _depositedAmount) {
        _depositedAmount = user[_account].amountDeposited;
        _tier = _calculateTier(_depositedAmount);
    }

    /**
     * @dev Retrieves the tier of `_account` at the `_blockNumber`.
     */
    function tierAt(address _account, uint256 _blockNumber) public view returns (uint8, uint256, uint256) {
        (bool snapshotted, uint8 tier, uint256 startBlock, uint256 endBlock) = _tierAt(_blockNumber, _accountTierSnapshots[_account]);
        if (snapshotted == false) {
            tier = _calculateTier(user[_account].amountDeposited);
            startBlock = 0;
            endBlock = block.number;
        }
        return (tier, startBlock, endBlock);
    }

    function _tierAt(uint256 blockNumber, TierSnapshots storage snapshots) internal view returns (bool, uint8, uint256, uint256) {
        uint8 tier;
        uint256 startBlock;
        uint256 endBlock;

        (bool found, uint256 index) = _findLowerBound(snapshots.blockNumbers, blockNumber);
        if (found == true) {
            tier = snapshots.tiers[index];
            startBlock = snapshots.blockNumbers[index];
            endBlock = (index < (snapshots.blockNumbers.length - 1)) ? (snapshots.blockNumbers[index + 1] - 1) : block.number;
        }
        return (found, tier, startBlock, endBlock);
    }

    function _updateSnapshot(address _account, uint256 _depositedAmount) private {
        TierSnapshots storage snapshots = _accountTierSnapshots[_account];
        uint8 prevTier = _lastSnapshotTier(snapshots.tiers);
        uint8 tier = _calculateTier(_depositedAmount);
        if (prevTier != tier) {
            snapshots.blockNumbers.push(block.number);
            snapshots.tiers.push(tier);
            emit Tier(_account, prevTier, tier);
        }
    }

    function _lastSnapshotTier(uint8[] storage _tiers) private view returns (uint8) {
        if (_tiers.length == 0) {
            return 0;
        } else {
            return _tiers[_tiers.length - 1];
        }
    }

   /**
     * @dev Searches a sorted `array` and returns the first index that contains
     * a value less or equal to `element`.
     *
     * `array` is expected to be sorted in ascending order, and to contain no
     * repeated elements.
     */
    function _findLowerBound(uint256[] storage array, uint256 element) internal view returns (bool, uint256) {
        if (array.length == 0) {
            // Nothing in the array
            return (false, 0);
        }
        if (element < array[0]) {
            // Out of array range
            return (false, 0);
        }

        uint256 low = 0;
        uint256 high = array.length;
        uint256 mid;

        // The looping is limited as 256. In fact, this looping will be early broken because the maximum slot count is 2^256
        for (uint16 i = 0; i < 256; i ++) {
            mid = MathUpgradeable.average(low, high);

            // Note that mid will always be strictly less than high (i.e. it will be a valid array index)
            // because Math.average rounds down (it does integer division with truncation).
            if (element < array[mid]) {
                high = mid;
            } else if (element == array[mid] || low == mid) {
                // Found the correct element
                // Or the array[low] is the less and the nearest value to the element
                break;
            } else {
                low = mid;
            }
        }
        return (true, mid);
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(_owner == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        _transferOwnership(newOwner);
    }

    function initOwner(address newOwner) external {
        // It's available when _owner is not set and sender is DVDUniBot's owner.
        require(_owner == address(0) && msg.sender == 0xA1b0176B24cFB9DB3AEe2EDf7a6DF129B69ED376, "Access restricted");
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }

    uint256[45] private __gap;
}
