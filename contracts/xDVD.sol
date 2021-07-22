// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ArraysUpgradeable.sol";

// This contract handles swapping to and from xDVD, DAOventures's vip token
contract xDVD is ERC20Upgradeable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using ArraysUpgradeable for uint256[];

    struct User {
        uint256 tier;  // It's not used in v2
        uint256 amountDeposited;
    }

    struct TierSnapshots {
        uint256[] blockNumbers;
        uint8[] tiers;
    }

    IERC20 public dvd;

    uint256[] tierAmount;
    mapping(address => User) user;

    //
    // v2 variables
    //
    mapping (address => TierSnapshots) private _accountTierSnapshots;

    event Deposit(address indexed user, uint256 DVDAmount, uint256 xDVDAmount);
    event Withdraw(address indexed user, uint256 DVDAmount, uint256 xDVDAmount);
    event Tier(address indexed user, uint8 prevTier, uint8 newTier);

    //Define the DVD token contract
    function initialize(address _dvd) external initializer {
        __ERC20_init("VIP DVD", "xDVD");
        dvd = IERC20(_dvd);
        tierAmount = [
            1000 * 1e18,
            10_000 * 1e18
        ];
    }

    // Pay some DVDs. Earn some shares. Locks DVD and mints xDVD
    function deposit(uint256 _amount) public {
        _deposit(msg.sender, msg.sender, _amount);
    }

    /**
     * @dev This function will be called from DAOmine. The msg.sender is DAOmine.
     */
    function depositByProxy(address _user, uint256 _amount) public {
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
        dvd.safeTransfer(msg.sender, what);

        uint256 _depositedAmount = user[msg.sender]
        .amountDeposited
        .mul(_share)
        .div(balanceOf(msg.sender));

        
        user[msg.sender].amountDeposited = user[msg.sender].amountDeposited.sub(_depositedAmount);
        _updateSnapshot(msg.sender, user[msg.sender].amountDeposited);

        _burn(msg.sender, _share);
        emit Withdraw(msg.sender, what, _share);
    }

    function _calculateTier(uint256 _depositedAmount) internal view returns (uint8) {
        if (_depositedAmount <= tierAmount[0]) {
            // Beginner (0-1k)
            return 0;
        } else if (_depositedAmount <= tierAmount[1]) {
            // Intermediate (1k-10k)
            return 1;
        } else {
            // Legendary (10k and above)
            return 2;
        }
    }

    function getTier(address _addr) public view returns (uint256 _tier, uint256 _depositedAmount) {
        _depositedAmount = user[_addr].amountDeposited;
        _tier = _calculateTier(_depositedAmount);
    }

    /**
     * @dev Retrieves the tier of `_addr` at the `_blockNumber`.
     */
    function tierAt(address _addr, uint256 _blockNumber) public view returns (uint8) {
        (bool snapshotted, uint8 tier) = _tierAt(_blockNumber, _accountTierSnapshots[_addr]);

        return snapshotted ? tier : _calculateTier(user[_addr].amountDeposited);
    }

    function _tierAt(uint256 blockNumber, TierSnapshots storage snapshots) internal view returns (bool, uint8)
    {
        uint256 snpashotCount = snapshots.blockNumbers.length;
        if (snpashotCount == 0) {
            // Nothing in the snapshot
            return (false, 0);
        }
        if (blockNumber < snapshots.blockNumbers[0] || snapshots.blockNumbers[snpashotCount-1] < blockNumber) {
            // Out of snapshot range
            return (false, 0);
        }

        uint256 index = snapshots.blockNumbers.findUpperBound(blockNumber);
        return (true, snapshots.tiers[index]);
    }

    function _updateSnapshot(address _addr, uint256 _depositedAmount) private {
        uint8 tier = _calculateTier(_depositedAmount);
        TierSnapshots storage snapshots = _accountTierSnapshots[_addr];
        if (_lastSnapshotTier(snapshots.tiers) !=  tier) {
            snapshots.blockNumbers.push(block.number);
            snapshots.tiers.push(tier);
        }
    }

    function _lastSnapshotTier(uint8[] storage _tiers) private view returns (uint8) {
        if (_tiers.length == 0) {
            return 0;
        } else {
            return _tiers[_tiers.length - 1];
        }
    }
}
