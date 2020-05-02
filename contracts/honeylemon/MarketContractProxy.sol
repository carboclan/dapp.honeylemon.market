pragma solidity 0.5.2;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

import '../marketprotocol/MarketCollateralPool.sol';
import '../marketprotocol/mpx/MarketContractFactoryMPX.sol';
import '../marketprotocol/mpx/MarketContractMPX.sol';

import '../libraries/MathLib.sol';

import './DSProxy.sol';


contract MarketContractProxy is Ownable {
    MarketContractFactoryMPX marketContractFactoryMPX;

    address public HONEY_LEMON_ORACLE_ADDRESS;
    address public MINTER_BRIDGE_ADDRESS;
    address public COLLATERAL_TOKEN_ADDRESS; //imBTC

    string public ORACLE_URL = 'null';
    string public ORACLE_STATISTIC = 'null';

    uint public CONTRACT_DURATION_DAYS = 28;
    uint public CONTRACT_DURATION = CONTRACT_DURATION_DAYS * 10; // 28 days in seconds
    uint public CONTRACT_COLLATERAL_RATIO = 135000000; //1.35e8; 1.35, with 8 decimal places

    uint[7] public marketContractSpecs = [
        0, // floorPrice - the lower bound price for the CFD [constant]
        0, // capPrice - the upper bound price for the CFD [updated before deployment]
        8, // priceDecimalPlaces - number of decimals used to convert prices [constant]
        1, // qtyMultiplier - multiply traded qty by this value from base units of collateral token. [constant]
        0, // feeInBasisPoints - fee for minting tokens [constant]
        0, // mktFeeInBasisPoints - fees charged by the market in MKT [constant]
        0 // expirationTimeStamp [updated before deployment]
    ];

    // Array of all market contracts deployed
    address[] public marketContracts;

    // Mapping of each market contract address to the associated array index
    mapping(address => uint256) addressToMarketId;

    // Stores the most recent MRI value
    uint256 latestMri = 0;

    // DSProxy factory to create smart contract wallets for users to enable bulk redemption.
    DSProxyFactory dSProxyFactory;

    // Mapping to link each trader address to their DSProxy address.
    mapping(address => address) public addressToDSProxy;

    // Mapping to link each DSProxy address to their traders address.
    mapping(address => address) public dSProxyToAddress;

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

        //Deploy a new DSProxyFactory instance to faciliate hot wallet creation
        dSProxyFactory = new DSProxyFactory();
    }

    event PositionTokensMinted(
        uint indexed marketId,
        string contractName,
        address indexed longTokenRecipient,
        address indexed shortTokenRecipient,
        uint256 qtyToMint,
        address latestMarketContract,
        address longTokenAddress,
        address shortTokenAddress,
        bytes bridgeData,
        uint time
    );

    event BatchTokensRedeemed(
        address tokenAddresses,
        address marketAddresses,
        uint tokensToRedeem,
        bool traderLong
    );

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

    function getFillableAmounts(address[] memory makerAddresses)
        public
        view
        returns (uint256[] memory fillableAmounts)
    {
        uint256 length = makerAddresses.length;
        fillableAmounts = new uint256[](length);

        for (uint256 i = 0; i != length; i++) {
            fillableAmounts[i] = getFillableAmount(makerAddresses[i]);
        }

        return fillableAmounts;
    }

    // The TH amount that can currently be filled based on owner’s BTC balance and allowance
    function getFillableAmount(address makerAddress) public view returns (uint256) {
        ERC20 collateralToken = ERC20(COLLATERAL_TOKEN_ADDRESS);

        uint minerBalance = collateralToken.balanceOf(makerAddress);
        uint minerAllowance = collateralToken.allowance(
            makerAddress,
            MINTER_BRIDGE_ADDRESS
        );

        uint uintMinAllowanceBalance = minerBalance < minerAllowance
            ? minerBalance
            : minerAllowance;

        return uintMinAllowanceBalance / (latestMri * CONTRACT_DURATION_DAYS);
    }

    function getLatestMarketContract() public view returns (MarketContractMPX) {
        uint lastIndex = marketContracts.length - 1;
        return MarketContractMPX(marketContracts[lastIndex]);
    }

    function getExpiringMarketContract() public view returns (MarketContractMPX) {
        uint contractsAdded = marketContracts.length;

        // If the marketContracts array has not had enough markets pushed into it to settle an old one then return 0x0.
        if (contractsAdded <= CONTRACT_DURATION_DAYS) {
            return MarketContractMPX(address(0x0));
        }
        uint expiringIndex = contractsAdded - CONTRACT_DURATION_DAYS;
        return MarketContractMPX(marketContracts[expiringIndex]);
    }

    function getCollateralPool(MarketContractMPX market)
        public
        view
        returns (MarketCollateralPool)
    {
        return MarketCollateralPool(market.COLLATERAL_POOL_ADDRESS());
    }

    function getLatestMarketCollateralPool() public view returns (MarketCollateralPool) {
        MarketContractMPX latestMarketContract = getLatestMarketContract();
        return getCollateralPool(latestMarketContract);
    }

    function calculateRequiredCollateral(uint amount) public view returns (uint) {
        MarketContractMPX latestMarketContract = getLatestMarketContract();
        return MathLib.multiply(amount, latestMarketContract.COLLATERAL_PER_UNIT());
    }

    function getAllMarketContracts() public returns (address[] memory) {
        return marketContracts;
    }

    // Return `balanceOf` for current day PositionTokenLong. This is used to prove to
    // 0x that the wallet balance was correctly transferred.
    function balanceOf(address owner) public returns (uint) {
        address addressToCheck = getUserAddressOrDSProxy(owner);
        MarketContract latestMarketContract = getLatestMarketContract();
        ERC20 longToken = ERC20(latestMarketContract.LONG_POSITION_TOKEN());
        return longToken.balanceOf(addressToCheck);
    }

    function getTime() public returns (uint) {
        return now;
    }

    // If the user has a DSProxy wallet, return that address. Else, return their wallet address
    function getUserAddressOrDSProxy(address inputAddress) public returns (address) {
        return
            addressToDSProxy[inputAddress] == address(0)
                ? inputAddress
                : addressToDSProxy[inputAddress];
    }

    ///////////////////////////
    //// DSPROXY FUNCTIONS ////
    ///////////////////////////

    function createDSProxyWallet() public returns (address) {
        // Create a new DSProxy for the caller.
        address payable dsProxyWallet = dSProxyFactory.build(msg.sender);
        addressToDSProxy[msg.sender] = dsProxyWallet;
        dSProxyToAddress[dsProxyWallet] = msg.sender;
        return dsProxyWallet;
    }

    // Function called by a DsProxy wallet which passes control from the caller using delegatecal
    // to enable the caller to redeem bulk tokens in one tx. Parameters are parallel arrays.
    // Note: only one side can be redeemed at a time. This is to simplify redemption as the same caller
    // will likely never be both long and short in the same contract.
    function batchRedeem(
        address[] memory tokenAddresses, // Address of the long or short token to redeem
        address[] memory marketAddresses, // Address of the market protocol
        uint256[] memory tokensToRedeem, // the number of tokens to redeem
        bool[] memory traderLong // if the trader is long or short
    ) public returns (uint256) {
        require(
            tokenAddresses.length == marketAddresses.length &&
                tokenAddresses.length == tokensToRedeem.length &&
                tokenAddresses.length == traderLong.length,
            'Invalid input params'
        );
        require(
            dSProxyToAddress[address(this)] != address(0),
            'Caller is not valid DSProxy'
        );
        // Loop through all tokens and preform redemption
        // for (uint256 i = 0; i < tokenAddresses.length; i++) {
        //     MarketContractMPX marketInstance = MarketContractMPX(marketAddresses[i]);
        //     MarketCollateralPool marketCollateralPool = getCollateralPool(marketInstance);
        //     ERC20 tokenInstance = ERC20(tokenAddresses[i]);

        //     tokenInstance.approve(address(marketInstance), tokensToRedeem[i]);

        //     if (traderLong[i]) {
        //         // redeem n long tokens and 0 short tokens
        //         marketCollateralPool.settleAndClose(
        //             address(marketInstance),
        //             tokensToRedeem[i],
        //             0
        //         );
        //     } else {
        //         // redeem 0 long tokens and n short tokens
        //         marketCollateralPool.settleAndClose(
        //             address(marketInstance),
        //             0,
        //             tokensToRedeem[i]
        //         );
        //     }
        // }
        // // Finally redeem collateral back to user.
        // ERC20 collateralToken = ERC20(COLLATERAL_TOKEN_ADDRESS);

        // // DSProxy balance
        // uint dSProxyBalance = collateralToken.balanceOf(msg.sender);

        // // Move all redeemed tokens from DSProxy back to users wallet.
        // collateralToken.transfer(dSProxyToAddress[msg.sender], dSProxyBalance);

        emit BatchTokensRedeemed(
            tokenAddresses[0],
            marketAddresses[0],
            tokensToRedeem[0],
            traderLong[0]
        );
        return 16;
    }

    /////////////////////////////////////
    //// ORACLE PRIVILEGED FUNCTIONS ////
    /////////////////////////////////////

    // Settles old contract and deploys the new contract
    function dailySettlement(
        uint lookbackIndexValue,
        uint currentIndexValue,
        bytes32[3] memory marketAndsTokenNames,
        uint newMarketExpiration
    ) public onlyHoneyLemonOracle {
        require(currentIndexValue != 0, 'Current MRI value cant be zero');

        // 1. Settle the past contract, if there is a price and contract exists.
        MarketContractMPX expiringMarketContract = getExpiringMarketContract();
        if (address(expiringMarketContract) != address(0x0)) {
            settleMarketContract(lookbackIndexValue, address(expiringMarketContract));
            //TODO: emit an event here
        }

        // 2. Deploy daily contract for the next 28 days.
        deployContract(currentIndexValue, marketAndsTokenNames, newMarketExpiration);

        // 3. Store the latest MRI value
        latestMri = currentIndexValue;
    }

    ////////////////////////////////////////////////
    //// 0X-MINTER-BRIDGE PRIVILEGED FUNCTIONS /////
    ////////////////////////////////////////////////

    function mintPositionTokens(
        uint qtyToMint,
        address longTokenRecipient,
        address shortTokenRecipient,
        bytes memory bridgeData
    ) public onlyMinterBridge {
        uint collateralNeeded = calculateRequiredCollateral(qtyToMint);

        // Create instance of the latest market contract for today
        MarketContractMPX latestMarketContract = getLatestMarketContract();
        // Create instance of the market collateral pool
        MarketCollateralPool marketCollateralPool = getLatestMarketCollateralPool();

        // Long token sent to the investor
        ERC20 longToken = ERC20(latestMarketContract.LONG_POSITION_TOKEN());
        // Short token sent to the miner
        ERC20 shortToken = ERC20(latestMarketContract.SHORT_POSITION_TOKEN());
        // Collateral token (imBTC)
        ERC20 collateralToken = ERC20(COLLATERAL_TOKEN_ADDRESS);

        // Move tokens from the MinterBridge to this proxy address
        collateralToken.transferFrom(
            MINTER_BRIDGE_ADDRESS,
            address(this),
            collateralNeeded
        );

        // Permission market contract to spent collateral token
        collateralToken.approve(address(marketCollateralPool), collateralNeeded);

        // Generate long and short tokens to sent to invester and miner
        marketCollateralPool.mintPositionTokens(
            address(latestMarketContract),
            qtyToMint,
            false
        );

        // Send the tokens. If the user has a DSProxy wallet then send it to there, else
        // send it to their normal wallet address.
        longToken.transfer(getUserAddressOrDSProxy(longTokenRecipient), qtyToMint);
        shortToken.transfer(getUserAddressOrDSProxy(shortTokenRecipient), qtyToMint);

        emit PositionTokensMinted(
            addressToMarketId[address(latestMarketContract)], // MarketID
            latestMarketContract.CONTRACT_NAME(),
            longTokenRecipient,
            shortTokenRecipient,
            qtyToMint,
            address(latestMarketContract),
            address(longToken),
            address(shortToken),
            bridgeData,
            getTime()
        );
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

    // function called daily to settle the current expiring 28 day contract.
    function settleMarketContract(uint mri, address marketContractAddress)
        public
        onlyHoneyLemonOracle
    {
        require(mri != 0, 'The mri loockback value can not be 0');
        require(marketContractAddress != address(0x0));

        MarketContractMPX marketContract = MarketContractMPX(marketContractAddress);
        marketContract.oracleCallBack(mri);

        // Store the most recent mri value to use in fillable amount
        latestMri = mri;
    }

    // Deploys the current day Market contract. `indexValue` is used to initialize collateral
    // requirement in its constructor. Stores the new contract address, block it was deployed in,
    // as well as the value of the index we’ll need easy access to the latest values of contract
    // address and index. collateral requirement = indexValue * 28 * overcollateralization_factor
    // returns the address of the new contract
    function deployContract(
        uint currentMRI,
        bytes32[3] memory marketAndsTokenNames,
        uint expiration
    ) public onlyOwner returns (address) {
        address contractAddress = marketContractFactoryMPX.deployMarketContractMPX(
            marketAndsTokenNames,
            COLLATERAL_TOKEN_ADDRESS,
            generateContractSpecs(currentMRI, expiration),
            ORACLE_URL,
            ORACLE_STATISTIC
        );

        // Add new market to storage
        uint index = marketContracts.push(contractAddress) - 1;
        addressToMarketId[contractAddress] = index;
        return (contractAddress);
        //TODO: emit event
    }

    function generateContractSpecs(uint currentMRI, uint expiration)
        public
        returns (uint[7] memory)
    {
        uint[7] memory dailySpecs = marketContractSpecs;
        // capPrice. div by 1e8 for correct scaling
        dailySpecs[1] =
            (CONTRACT_DURATION_DAYS * currentMRI * (CONTRACT_COLLATERAL_RATIO)) /
            1e8;
        // expirationTimeStamp. Fed in directly from oracle to ensure timing is exact, irrespective of block mining times
        dailySpecs[6] = expiration;
        return dailySpecs;
    }
}
