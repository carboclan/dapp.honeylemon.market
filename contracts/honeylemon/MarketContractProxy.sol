pragma solidity 0.5.2;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

import '../marketprotocol/MarketCollateralPool.sol';
import '../marketprotocol/mpx/MarketContractFactoryMPX.sol';
import '../marketprotocol/mpx/MarketContractMPX.sol';

import '../libraries/MathLib.sol';


contract MarketContractProxy is Ownable {
    MarketContractFactoryMPX marketContractFactoryMPX;

    address public HONEY_LEMON_ORACLE_ADDRESS;
    address public MINTER_BRIDGE_ADDRESS;
    address public COLLATERAL_TOKEN_ADDRESS; //imBTC

    string public ORACLE_URL = 'null';
    string public ORACLE_STATISTIC = 'null';

    uint CONTRACT_DURATION = 60 * 60 * 24 * 28; // 28 days in seconds

    uint[7] public marketContractSpecs = [
        1, // floorPrice - the lower bound price for the CFD [constant]
        0, // capPrice - the upper bound price for the CFD [updated before deployment]
        8, // priceDecimalPlaces - number of decimals used to convert prices [constant]
        1, // qtyMultiplier - multiply traded qty by this value from base units of collateral token. [constant]
        0, // feeInBasisPoints - fee for minting tokens [constant]
        0, // mktFeeInBasisPoints - fees charged by the market in MKT [constant]
        0 // expirationTimeStamp [updated before deployment]
    ];

    address[] public marketContracts;

    constructor(
        address _marketContractFactoryMPX,
        address _honeyLemonOracle,
        address _minterBridge,
        address _imBTCTokenAddress
    ) public {
        marketContractFactoryMPX = MarketContractFactoryMPX(_marketContractFactoryMPX);
        HONEY_LEMON_ORACLE_ADDRESS = _honeyLemonOracle;
        MINTER_BRIDGE_ADDRESS = _minterBridge;
        COLLATERAL_TOKEN_ADDRESS = _imBTCTokenAddress;
    }

    //////////////////////////////////////
    //// PERMISSION SCOPING MODIFIERS ////
    //////////////////////////////////////

    modifier onlyHoneyLemonOracle() {
        require(msg.sender == HONEY_LEMON_ORACLE_ADDRESS, 'Only Honey Lemon Oracle');
        _;
    }

    modifier onlyMinterBridge() {
        require(msg.sender == MINTER_BRIDGE_ADDRESS, 'Only Minter Bridge');
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

    //TODO: refactor this to return an interface
    function getLatestMarketContract() public view returns (MarketContract) {
        uint lastIndex = marketContracts.length - 1;
        return MarketContract(marketContracts[lastIndex]);
    }

    //TODO: refactor this to return an interface
    function getLatestMarketCollateralPool() public view returns (MarketCollateralPool) {
        MarketContract latestMarketContract = getLatestMarketContract();
        return MarketCollateralPool(latestMarketContract.COLLATERAL_POOL_ADDRESS());
    }

    function calculateRequiredCollateral(uint amount) public view returns (uint) {
        MarketContract latestMarketContract = getLatestMarketContract();
        return MathLib.multiply(amount, latestMarketContract.COLLATERAL_PER_UNIT());
    }

    function getAllMarketContracts() public returns (address[] memory) {
        return marketContracts;
    }

    /////////////////////////////////////
    //// ORACLE PRIVILEGED FUNCTIONS ////
    /////////////////////////////////////

    // Settles old contract and deploys the new contract
    function dailySettlement(uint currentIndexValue, uint lookbackIndexValue, uint timestamp)
        public
        onlyHoneyLemonOracle
    {}

    ////////////////////////////////////////////////
    //// 0X-MINTER-BRIDGE PRIVILEGED FUNCTIONS /////
    ////////////////////////////////////////////////

    function mintPositionTokens(uint qtyToMint, address longTokenRecipient, address shortTokenRecipient)
        public
        onlyMinterBridge
    {
        // We need to call `mintPositionTo/*  */kens(CURRENT_CONTRACT_ADDRESS, amount, false)` on the
        // MarketCollateralPool. We can get to the pool this way:
        uint collateralNeeded = calculateRequiredCollateral(qtyToMint);

        // Create instance of the latest market contract for today
        MarketContract latestMarketContract = getLatestMarketContract();
        // Create instance of the market collateral pool
        MarketCollateralPool marketCollateralPool = getLatestMarketCollateralPool();

        // Long token sent to the investor
        ERC20 longToken = ERC20(latestMarketContract.LONG_POSITION_TOKEN());
        // Short token sent to the miner
        ERC20 shortToken = ERC20(latestMarketContract.SHORT_POSITION_TOKEN());
        // Collateral token (imBTC)
        ERC20 collateralToken = ERC20(COLLATERAL_TOKEN_ADDRESS);

        // Move tokens from the MinterBridge to this proxy address
        collateralToken.transferFrom(MINTER_BRIDGE_ADDRESS, address(this), collateralNeeded);

        // Permission market contract to spent collateral token
        collateralToken.increaseAllowance(address(latestMarketContract), collateralNeeded);

        // Generate long and short tokens to sent to invester and miner
        marketCollateralPool.mintPositionTokens(address(latestMarketContract), qtyToMint, false);

        // Send the tokens
        longToken.transfer(longTokenRecipient, qtyToMint);
        shortToken.transfer(shortTokenRecipient, qtyToMint);
    }

    ////////////////////////////////////
    //// OWNER (DEPLOYER) FUNCTIONS ////
    ////////////////////////////////////

    function setOracleAddress(address _honeyLemonOracleAddress) public onlyOwner {
        HONEY_LEMON_ORACLE_ADDRESS = _honeyLemonOracleAddress;
    }

    function setMinterBridgeAddress(address _minterBridgeAddress) public onlyOwner {
        MINTER_BRIDGE_ADDRESS = _minterBridgeAddress;
    }

    function setMarketContractSpecs(uint[7] memory _params) public onlyOwner {
        marketContractSpecs = _params;
    }

    ////////////////////////////
    //// INTERNAL FUNCTIONS ////
    ////////////////////////////

    // Internal function to add the current index price to the oracle and push settlement price into MPX.
    function pushOraclePriceIndex(uint currentIndexValue, uint lookbackIndexValue, uint timestamp) internal {}

    // function called daily to settle the current expiring 28 day contract.
    function settleLatestMarketContract() internal {}

    // Deploys the current day Market contract. `indexValue` is used to initialize collateral requirement in its constructor
    // Stores the new contract address, block it was deployed in, as well as the value of the index
    // we’ll need easy access to the latest values of contract address and index.
    // collateral requirement = indexValue * 28 * overcollateralization_factor
    // returns the address of the new contract
    function deployContract() public onlyOwner returns (address) {
        address contractAddress = marketContractFactoryMPX.deployMarketContractMPX(
            generateContractNames(),
            COLLATERAL_TOKEN_ADDRESS,
            generateContractSpecs(),
            ORACLE_URL,
            ORACLE_STATISTIC
        );
        marketContracts.push(contractAddress);
        return (contractAddress);
    }

    function generateContractSpecs() public returns (uint[7] memory) {
        //TODO: replace elements in this array with the correct parms
        uint[7] memory todaysMarketContractSpecs = marketContractSpecs;
        todaysMarketContractSpecs[1] = 100000; // capPrice
        todaysMarketContractSpecs[6] = now + CONTRACT_DURATION; // expirationTimeStamp
        return todaysMarketContractSpecs;
    }

    function generateContractNames() public returns (bytes32[3] memory) {
        //TODO: replace this with a function that dynamically generates names. Use the `DateLib.sol`
        return [
            bytes32('MRI-BTC-28D-20200501'),
            bytes32('MRI-BTC-28D-20200501-Long'),
            bytes32('MRI-BTC-28D-20200501-Short')
        ];
    }
}
