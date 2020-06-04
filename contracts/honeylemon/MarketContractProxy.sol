pragma solidity 0.5.2;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";

import "../marketprotocol/MarketCollateralPool.sol";
import "../marketprotocol/mpx/MarketContractFactoryMPX.sol";
import "../marketprotocol/mpx/MarketContractMPX.sol";

import "../libraries/MathLib.sol";

import "./DSProxy.sol";


/// @title Market Contract Proxy.
/// @notice Handles the interconnection of the Market Protocol with 0x to
/// facilitate issuance of long and short tokens at order execution.
/// @dev This contract is responsible for 1) daily deployment of new market
/// contracts 2) settling old contracts 3) minting of long and short tokens 4)
/// storage of DSProxy info 5) enabling batch token redemption.

contract MarketContractProxy is ReentrancyGuard, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    MarketContractFactoryMPX public marketContractFactoryMPX;

    address public HONEY_LEMON_ORACLE_ADDRESS;
    address public MINTER_BRIDGE_ADDRESS;
    address public COLLATERAL_TOKEN_ADDRESS; //imBTC

    uint public CONTRACT_DURATION_DAYS = 28;
    uint public CONTRACT_DURATION = CONTRACT_DURATION_DAYS * 24 * 60 * 60; // 28 days in seconds
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

    ///@notice Array of all market contracts deployed
    address[] public marketContracts;

    ///@notice Mapping of each market contract address to the associated array index
    mapping(address => uint256) addressToMarketId;

    ///@notice Stores the most recent MRI value
    uint256 internal latestMri = 0;

    ///@notice DSProxy factory to create smart contract wallets for users to enable bulk redemption.
    DSProxyFactory dSProxyFactory;

    ///@notice Mapping to link each trader address to their DSProxy address.
    mapping(address => address) public addressToDSProxy;

    ///@notice Mapping to link each DSProxy address to their traders address.
    mapping(address => address) public dSProxyToAddress;

    /**
     * @notice constructor
     * @dev will deloy a new DSProxy Factory
     * @param _marketContractFactoryMPX market contract factory address
     * @param _honeyLemonOracle honeylemon oracle address
     * @param _minterBridge 0x minter bridge address
     * @param _imBTCTokenAddress imBTC token address
     */
    constructor(
        address _marketContractFactoryMPX,
        address _honeyLemonOracle,
        address _minterBridge,
        address _imBTCTokenAddress
    ) public ReentrancyGuard() {
        marketContractFactoryMPX = MarketContractFactoryMPX(_marketContractFactoryMPX);
        HONEY_LEMON_ORACLE_ADDRESS = _honeyLemonOracle;
        MINTER_BRIDGE_ADDRESS = _minterBridge;
        COLLATERAL_TOKEN_ADDRESS = _imBTCTokenAddress;

        //Deploy a new DSProxyFactory instance to faciliate hot wallet creation
        dSProxyFactory = new DSProxyFactory();
    }

    ////////////////
    //// EVENTS ////
    ////////////////
    event PositionTokensMinted(
        uint256 qtyToMint,
        uint indexed marketId,
        string contractName,
        address indexed longTokenRecipient,
        address longTokenDSProxy,
        address indexed shortTokenRecipient,
        address shortTokenDSProxy,
        address latestMarketContract,
        address longTokenAddress,
        address shortTokenAddress,
        uint time
    );

    event MarketContractSettled(
        address indexed contractAddress,
        uint revenuePerUnit,
        uint index
    );

    event MarketContractDeployed(
        uint currentMRI,
        bytes32 contractName,
        uint expiration,
        uint indexed index,
        address contractAddress,
        uint collateralPerUnit
    );

    event dSProxyCreated(address owner, address DSProxy);

    ///////////////////
    //// MODIFIERS ////
    ///////////////////

    /**
     * @notice modifier to check that the caller is honeylemon oracle address
     */
    modifier onlyHoneyLemonOracle() {
        require(msg.sender == HONEY_LEMON_ORACLE_ADDRESS, "Only Honey Lemon Oracle");
        _;
    }

    /**
     * @notice mofidier to check that the caller is minter bridge address
     */
    modifier onlyMinterBridge() {
        require(msg.sender == MINTER_BRIDGE_ADDRESS, "Only Minter Bridge");
        _;
    }

    /////////////////////////
    //// OWNER FUNCTIONS ////
    /////////////////////////

    /**
     * @notice Set oracle address
     * @dev can only be called by owner
     * @param _honeyLemonOracleAddress oracle address
     */
    function setOracleAddress(address _honeyLemonOracleAddress) external onlyOwner {
        HONEY_LEMON_ORACLE_ADDRESS = _honeyLemonOracleAddress;
    }

    /**
     * @notice Set minter bridge address
     * @dev can only be called by owner
     * @param _minterBridgeAddress 0x minter bridge address
     */
    function setMinterBridgeAddress(address _minterBridgeAddress) external onlyOwner {
        MINTER_BRIDGE_ADDRESS = _minterBridgeAddress;
    }

    /**
     * @notice Set market contract specs
     * @dev can only be called by owner
     * @param _params array of specs
     */
    function setMarketContractSpecs(uint[7] calldata _params) external onlyOwner {
        marketContractSpecs = _params;
    }

    ////////////////////////
    //// PUBLIC GETTERS ////
    ////////////////////////

    /**
     * @notice get amounts of TH that can be filled
     * @param makerAddresses list of makers addresses
     * @return array of fillable amounts
     */
    function getFillableAmounts(address[] calldata makerAddresses)
        external
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

    /**
     * @notice get latest MRI value
     * @return latestMri
     */
    function getLatestMri() external view returns (uint256) {
        return latestMri;
    }

    /**
     * @notice get all market contarcts
     * @return array of market contracts
     */
    function getAllMarketContracts() public view returns (address[] memory) {
        return marketContracts;
    }

    /**
     * @notice calculate the TH amount that can be filled based on owner’s BTC balance and allowance
     * @param makerAddress address or BTC(imBTC) owner
     * @return TH amount
     */
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

        MarketContract latestMarketContract = getLatestMarketContract();

        return
            MathLib.divideFractional(
                1,
                uintMinAllowanceBalance,
                latestMarketContract.COLLATERAL_PER_UNIT()
            );
    }

    /**
     * @notice get latest market contract
     * @return market contract address
     */
    function getLatestMarketContract() public view returns (MarketContractMPX) {
        uint lastIndex = marketContracts.length.sub(1);
        return MarketContractMPX(marketContracts[lastIndex]);
    }

    /**
     * @notice get expiring market contract
     * @dev return address(0) if there is no expired contract
     * @return expired market contract address
     */
    function getExpiringMarketContract() public view returns (MarketContractMPX) {
        uint contractsAdded = marketContracts.length;

        // If the marketContracts array has not had enough markets pushed into it to settle an old one then return 0x0.
        if (contractsAdded < CONTRACT_DURATION_DAYS) {
            return MarketContractMPX(address(0x0));
        }
        uint expiringIndex = contractsAdded.sub(CONTRACT_DURATION_DAYS);
        return MarketContractMPX(marketContracts[expiringIndex]);
    }

    /**
     * @notice get market collateral pool address
     * @param market market contract
     * @return collateral pool address
     */
    function getCollateralPool(MarketContractMPX market)
        public
        view
        returns (MarketCollateralPool)
    {
        return MarketCollateralPool(market.COLLATERAL_POOL_ADDRESS());
    }

    /**
     * @notice get latest market collateral pool address
     * @return collateral pool address
     */
    function getLatestMarketCollateralPool() public view returns (MarketCollateralPool) {
        MarketContractMPX latestMarketContract = getLatestMarketContract();
        return getCollateralPool(latestMarketContract);
    }

    /**
     * @notice calculate collateral needed to mint Long/Short tokens
     * @param amount deposited amount
     * @return needed collateral
     */
    function calculateRequiredCollateral(uint amount) public view returns (uint) {
        MarketContractMPX latestMarketContract = getLatestMarketContract();
        return MathLib.multiply(amount, latestMarketContract.COLLATERAL_PER_UNIT());
    }

    /**
     * @notice get user long token blanace for the current day
     * @dev used to prove to 0x that the wallet balance was correctly transferred.
     * @param owner address
     * @return long token balance
     */
    function balanceOf(address owner) public view returns (uint) {
        address addressToCheck = getUserAddressOrDSProxy(owner);
        MarketContract latestMarketContract = getLatestMarketContract();
        ERC20 longToken = ERC20(latestMarketContract.LONG_POSITION_TOKEN());
        return longToken.balanceOf(addressToCheck);
    }

    /**
     * @notice get current timestamp
     */
    function getTime() public view returns (uint) {
        return now;
    }

    /**
     * @notice generate market contract specs (cap price, expiration timestamp)
     * @param currentMRI current MRI value
     * @param expiration market expiration timestamp
     * @return market specs
     */
    function generateContractSpecs(uint currentMRI, uint expiration)
        public
        view
        returns (uint[7] memory)
    {
        uint[7] memory dailySpecs = marketContractSpecs;
        // capPrice. div by 1e8 for correct scaling
        // dailySpecs[1] =
        //     (CONTRACT_DURATION_DAYS * currentMRI * (CONTRACT_COLLATERAL_RATIO)) /
        //     1e8;
        dailySpecs[1] = (
            CONTRACT_DURATION_DAYS.mul(currentMRI).mul(CONTRACT_COLLATERAL_RATIO)
        )
            .div(1e8);
        // expirationTimeStamp. Fed in directly from oracle to ensure timing is exact, irrespective of block mining times
        dailySpecs[6] = expiration;
        return dailySpecs;
    }

    // If the user has a DSProxy wallet, return that address. Else, return their wallet address
    /**
     * @notice get user address
     * @dev get user own address or DSProxy address if user have one
     * @param inputAddress user address
     * @return address
     */
    function getUserAddressOrDSProxy(address inputAddress) public view returns (address) {
        return
            addressToDSProxy[inputAddress] == address(0)
                ? inputAddress
                : addressToDSProxy[inputAddress];
    }

    ///////////////////////////
    //// DSPROXY FUNCTIONS ////
    ///////////////////////////

    /**
     * @notice create DSProxy wallet
     * @return address of created DSProxy
     */
    function createDSProxyWallet() public returns (address) {
        // Create a new DSProxy for the caller.
        address payable dsProxyWallet = dSProxyFactory.build(msg.sender);
        addressToDSProxy[msg.sender] = dsProxyWallet;
        dSProxyToAddress[dsProxyWallet] = msg.sender;

        emit dSProxyCreated(msg.sender, dsProxyWallet);

        return dsProxyWallet;
    }

    /**
     * @notice batch redeem long or short tokens for different markets
     * @dev called by a DsProxy wallet which passes control from the caller using delegatecal
     * to enable the caller to redeem bulk tokens in one tx. Parameters are parallel arrays.
     * Only one side can be redeemed at a time. This is to simplify redemption as the same caller
     * will likely never be both long and short in the same contract.
     * @param tokenAddresses long/short token addresses
     * @param marketAddresses market contracts addresses
     * @param tokensToRedeem amount of token to redeem
     * @param traderLong true => trader long; false => trader short
     */
    function batchRedeem(
        address[] memory tokenAddresses, // Address of the long or short token to redeem
        address[] memory marketAddresses, // Address of the market protocol
        uint256[] memory tokensToRedeem, // the number of tokens to redeem
        bool[] memory traderLong // if the trader is long or short
    ) public nonReentrant {
        require(
            tokenAddresses.length == marketAddresses.length &&
                tokenAddresses.length == tokensToRedeem.length &&
                tokenAddresses.length == traderLong.length,
            "Invalid input params"
        );
        require(this.owner() == msg.sender, "You don't own this DSProxy GTFO");
        MarketContractMPX marketInstance;
        MarketCollateralPool marketCollateralPool;
        ERC20 tokenInstance;
        // Loop through all tokens and preform redemption
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            marketInstance = MarketContractMPX(marketAddresses[i]);
            marketCollateralPool = getCollateralPool(marketInstance);
            tokenInstance = ERC20(tokenAddresses[i]);

            tokenInstance.approve(address(marketInstance), tokensToRedeem[i]);

            if (traderLong[i]) {
                // redeem n long tokens and 0 short tokens
                marketCollateralPool.settleAndClose(
                    address(marketInstance),
                    tokensToRedeem[i],
                    0
                );
            } else {
                // redeem 0 long tokens and n short tokens
                marketCollateralPool.settleAndClose(
                    address(marketInstance),
                    0,
                    tokensToRedeem[i]
                );
            }
        }
        // Finally redeem collateral back to user.
        ERC20 collateralToken = ERC20(marketInstance.COLLATERAL_TOKEN_ADDRESS());

        // DSProxy balance. address(this) is the DSProxy contract address that will redeem the tokens.
        uint dSProxyBalance = collateralToken.balanceOf(address(this));

        // Move all redeemed tokens from DSProxy back to users wallet. msg.sender is the owner of the DSProxy.
        collateralToken.transfer(msg.sender, dSProxyBalance);
    }

    /////////////////////////////////////
    //// HONEYLEMON ORACLE FUNCTIONS ////
    /////////////////////////////////////

    /**
     * @notice deploy new market and settle last one (if met settlement requirements)
     * @dev can only be called by hinelemon oracle
     * @param lookbackIndexValue  last index value
     * @param currentIndexValue current index value
     * @param marketAndsTokenNames bytes array of market, long and short token names
     * @param newMarketExpiration new market expiration timestamp
     */
    function dailySettlement(
        uint lookbackIndexValue,
        uint currentIndexValue,
        bytes32[3] memory marketAndsTokenNames,
        uint newMarketExpiration
    ) public onlyHoneyLemonOracle {
        require(currentIndexValue != 0, "Current MRI value cant be zero");

        // 1. Settle the past contract, if there is a price and contract exists.
        MarketContractMPX expiringMarketContract = getExpiringMarketContract();
        if (address(expiringMarketContract) != address(0x0)) {
            settleMarketContract(lookbackIndexValue, address(expiringMarketContract));
        }

        // 2. Deploy daily contract for the next 28 days.
        deployContract(currentIndexValue, marketAndsTokenNames, newMarketExpiration);

        // 3. Store the latest MRI value
        latestMri = currentIndexValue;
    }

    /**
     * @notice settle specific market
     * @dev can only be called from honeylemon oracle.
     * Can be called directly to settle expiring market without deploying new one
     * @dev mri MRI value
     * @dev marketContractAddress market contract
     */
    function settleMarketContract(uint mri, address marketContractAddress)
        public
        onlyHoneyLemonOracle
    {
        require(mri != 0, "The mri loockback value can not be 0");
        require(marketContractAddress != address(0x0), "Invalid market contract address");

        MarketContractMPX marketContract = MarketContractMPX(marketContractAddress);
        marketContract.oracleCallBack(mri);

        // Store the most recent mri value to use in fillable amount
        latestMri = mri;

        emit MarketContractSettled(marketContractAddress, mri, marketContracts.length);
    }

    ///////////////////////////////////////////////
    //// 0X-MINTER-BRIDGE PRIVILEGED FUNCTIONS ////
    ///////////////////////////////////////////////
    /**
     * @notice mint long and short tokens
     * @dev can only be called from 0x minter bridge
     * @param qtyToMint long/short quantity to mint
     * @param longTokenRecipient address of long token recipient (will receive token at this address unless address have deployed DSProxy)
     * @param shortTokenRecipient address of short token recipient (will receive token at this address unless address have deployed DSProxy)
     */
    function mintPositionTokens(
        uint qtyToMint,
        address longTokenRecipient,
        address shortTokenRecipient
    ) public onlyMinterBridge nonReentrant {
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
            qtyToMint,
            addressToMarketId[address(latestMarketContract)], // MarketID
            latestMarketContract.CONTRACT_NAME(),
            longTokenRecipient,
            getUserAddressOrDSProxy(longTokenRecipient),
            shortTokenRecipient,
            getUserAddressOrDSProxy(shortTokenRecipient),
            address(latestMarketContract),
            address(longToken),
            address(shortToken),
            getTime()
        );
    }

    ////////////////////////////
    //// INTERNAL FUNCTIONS ////
    ////////////////////////////

    // Deploys the current day Market contract. `indexValue` is used to initialize collateral
    // requirement in its constructor. Stores the new contract address, block it was deployed in,
    // as well as the value of the index we’ll need easy access to the latest values of contract
    // address and index. collateral requirement = indexValue * 28 * overcollateralization_factor
    // returns the address of the new contract
    /**
     * @notice deploy the current Market contract
     * @param currentMRI current MRI value
     * @param marketAndsTokenNames bytes array of market, long and short token names
     * @param expiration expiration timestamp
     */
    function deployContract(
        uint currentMRI,
        bytes32[3] memory marketAndsTokenNames,
        uint expiration
    ) internal returns (address) {
        address contractAddress = marketContractFactoryMPX.deployMarketContractMPX(
            marketAndsTokenNames,
            COLLATERAL_TOKEN_ADDRESS,
            generateContractSpecs(currentMRI, expiration),
            "null", //ORACLE_URL
            "null" // ORACLE_STATISTIC
        );

        // Add new market to storage
        uint index = marketContracts.push(contractAddress) - 1;
        addressToMarketId[contractAddress] = index;
        MarketContractMPX marketContract = MarketContractMPX(contractAddress);
        emit MarketContractDeployed(
            currentMRI,
            marketAndsTokenNames[0],
            expiration,
            index,
            contractAddress,
            marketContract.COLLATERAL_PER_UNIT()
        );
        return (contractAddress);
    }
}
