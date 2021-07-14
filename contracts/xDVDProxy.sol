pragma solidity 0.7.6;

import "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol";

contract xDVDProxy is TransparentUpgradeableProxy {
    constructor(address _logic, address _admin, bytes memory _data) TransparentUpgradeableProxy(_logic, _admin, _data){
    }

    function getAdmin() external view returns (address ){
        return _admin();
    }
    
    function getImplementation() external view returns (address ){
        return _implementation();
    }
}