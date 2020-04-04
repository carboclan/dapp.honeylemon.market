pragma solidity 0.5.2;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "../marketprotocol/MarketCollateralPool.sol";
import "../marketprotocol/mpx/MarketContractFactoryMPX.sol";


contract MarketContractProxy is Ownable {

    MarketContractFactoryMPX marketContractFactoryMPX;
    
    address public HONEY_LEMON_ORACLE_ADDRESS;
    address public MINTER_BRIDGE_ADDRESS;

    uint[7] public marketProtocolContractSpecifications;

    constructor(address _marketContractFactoryMPX, address _honeyLemonOracle, address _minterBridge) public{

        marketContractFactoryMPX = MarketContractFactoryMPX(_marketContractFactoryMPX);
        HONEY_LEMON_ORACLE_ADDRESS = _honeyLemonOracle;
        MINTER_BRIDGE_ADDRESS = _minterBridge;
    }


    //////////////////////////////////////
    //// PERMISSION SCOPING MODIFIERS ////
    //////////////////////////////////////
    
    modifier onlyHoneyLemonOracle(){
        require(msg.sender == HONEY_LEMON_ORACLE_ADDRESS);
        _;
    }

    modifier onlyMinterBridge(){
        require(msg.sender == MINTER_BRIDGE_ADDRESS);
        _;
    }

    //////////////////////////
    //// PUBLIC FUNCTIONS ////
    //////////////////////////
    
    function balanceOf(address _owner) public view returns (uint256 balance) {
        // Return `balanceOf` for current day PositionTokenLong
    }

    // What’s the TH amount that can currently be filled based on owner’s BTC balance and allowance
    function fillableAmount(address _owner) public view returns (uint256 amount) {
        // return min(imBTC.balanceOf(_owner), imBTC.allowance(_owner, MARKET_PROTOCOL_POOL_ADDRESS)) / (indexValue * CONTRACT_DURATION)
    }

    /////////////////////////////////////
    //// ORACLE PRIVILEGED FUNCTIONS ////
    /////////////////////////////////////

              // Settles old contract and deploys the new contract
    function dailySettlement(uint currentIndexValue, uint lookbackIndexValue, uint timestamp) public onlyHoneyLemonOracle {

    }
    /////////////////////////////////////
    //// 0X-MINTER-BRIDGE FUNCTIONS /////
    /////////////////////////////////////

    function mintPositionTokens(
        address marketContractAddress,
        uint qtyToMint    
    ) public onlyMinterBridge
    {
        // We need to call `mintPositionTo/*  */kens(CURRENT_CONTRACT_ADDRESS, amount, false)` on the
        // MarketCollateralPool. We can get to the pool this way:
        // CURRENT_CONTRACT_ADDRESS -> COLLATERAL_POOL_ADDRESS
    }

    ////////////////////////////
    //// INTERNAL FUNCTIONS ////
    ////////////////////////////

    // Internal function to add the current index price to the oracle and push settlement price into MPX.
    function pushOraclePriceIndex(uint currentIndexValue, uint lookbackIndexValue, uint timestamp) internal {}

    // function called daily to settle the current expiring 28 day contract.
    function settleLatestMarketContract() internal {}


     // It is much safer to deploy Market contracts from the contract. This ensures that the code deployed
    // cannot be substituted (e.g. to steal the collateral)
    function deployContract(uint indexValue) internal {
    // Deploys the current day Market contract. `indexValue` is used to initialize collateral requirement in its constructor
    // Stores the new contract address, block it was deployed in, as well as the value of the index
    // we’ll need easy access to the latest values of contract address and index.
    // collateral requirement = indexValue * 28 * overcollateralization_factor
    // returns the address of the new contract
    }

    

    // function generateContractSpecs() internal returns(unit[7]){},

    // function generateContractNames() internal returns(bytes32[3]){},


}