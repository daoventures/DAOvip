// SPDX-License-Identifier: MIT
pragma solidity >= 0.7.0 < 0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

/// DAOmine token interface
interface IDAOmine {
    
    /**
     * @dev This function will be called from contracts.
     */
    function depositByProxy(address _account, uint256 _pid, uint256 _amount) external;

    /**
     * @dev Returns the pid of xDVD pool in DAOmine.
     */
    function xdvdPid() external returns(uint256);
}