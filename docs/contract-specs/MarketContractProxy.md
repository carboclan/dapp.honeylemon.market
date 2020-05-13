# Market Contract Proxy. (MarketContractProxy.sol)

View Source: [contracts/honeylemon/MarketContractProxy.sol](../../contracts/honeylemon/MarketContractProxy.sol)

**↗ Extends: [Ownable](Ownable.md)**

**MarketContractProxy**

Handles the interconnection of the Market Protocol with 0x to
 facilitate issuance of long and short tokens at order execution.

## Contract Members
**Constants & Variables**

```js
//internal members
contract MarketContractFactoryMPX internal marketContractFactoryMPX;
mapping(address => uint256) internal addressToMarketId;
uint256 internal latestMri;
contract DSProxyFactory internal dSProxyFactory;

//public members
address public HONEY_LEMON_ORACLE_ADDRESS;
address public MINTER_BRIDGE_ADDRESS;
address public COLLATERAL_TOKEN_ADDRESS;
string public ORACLE_URL;
string public ORACLE_STATISTIC;
uint256 public CONTRACT_DURATION_DAYS;
uint256 public CONTRACT_DURATION;
uint256 public CONTRACT_COLLATERAL_RATIO;
uint256[7] public marketContractSpecs;
address[] public marketContracts;
mapping(address => address) public addressToDSProxy;
mapping(address => address) public dSProxyToAddress;

```

**Events**

```js
event PositionTokensMinted(uint256 indexed marketId, string  contractName, address indexed longTokenRecipient, address  longTokenDSProxy, address indexed shortTokenRecipient, address  shortTokenDSProxy, uint256  qtyToMint, address  latestMarketContract, address  longTokenAddress, address  shortTokenAddress, uint256  time);
event BatchTokensRedeemed(address  tokenAddresses, address  marketAddresses, uint256  tokensToRedeem, bool  traderLong);
event LogEvent(address  msgsender, address  addressthis, uint256  param, address  tokenAddress);
```

## Modifiers

- [onlyHoneyLemonOracle](#onlyhoneylemonoracle)
- [onlyMinterBridge](#onlyminterbridge)

### onlyHoneyLemonOracle

modifier to check that the caller is honeylemon oracle address

```js
modifier onlyHoneyLemonOracle() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### onlyMinterBridge

mofidier to check that the caller is minter bridge address

```js
modifier onlyMinterBridge() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

## Functions

- [(address _marketContractFactoryMPX, address _honeyLemonOracle, address _minterBridge, address _imBTCTokenAddress)](#)
- [setOracleAddress(address _honeyLemonOracleAddress)](#setoracleaddress)
- [setMinterBridgeAddress(address _minterBridgeAddress)](#setminterbridgeaddress)
- [setMarketContractSpecs(uint256[7] _params)](#setmarketcontractspecs)
- [getFillableAmounts(address[] makerAddresses)](#getfillableamounts)
- [getLatestMri()](#getlatestmri)
- [getAllMarketContracts()](#getallmarketcontracts)
- [getFillableAmount(address makerAddress)](#getfillableamount)
- [getLatestMarketContract()](#getlatestmarketcontract)
- [getExpiringMarketContract()](#getexpiringmarketcontract)
- [getCollateralPool(MarketContractMPX market)](#getcollateralpool)
- [getLatestMarketCollateralPool()](#getlatestmarketcollateralpool)
- [calculateRequiredCollateral(uint256 amount)](#calculaterequiredcollateral)
- [balanceOf(address owner)](#balanceof)
- [getTime()](#gettime)
- [generateContractSpecs(uint256 currentMRI, uint256 expiration)](#generatecontractspecs)
- [getUserAddressOrDSProxy(address inputAddress)](#getuseraddressordsproxy)
- [createDSProxyWallet()](#createdsproxywallet)
- [batchRedeem(address[] tokenAddresses, address[] marketAddresses, uint256[] tokensToRedeem, bool[] traderLong)](#batchredeem)
- [dailySettlement(uint256 lookbackIndexValue, uint256 currentIndexValue, bytes32[3] marketAndsTokenNames, uint256 newMarketExpiration)](#dailysettlement)
- [mintPositionTokens(uint256 qtyToMint, address longTokenRecipient, address shortTokenRecipient)](#mintpositiontokens)
- [settleMarketContract(uint256 mri, address marketContractAddress)](#settlemarketcontract)
- [deployContract(uint256 currentMRI, bytes32[3] marketAndsTokenNames, uint256 expiration)](#deploycontract)

### 

constructor

```js
function (address _marketContractFactoryMPX, address _honeyLemonOracle, address _minterBridge, address _imBTCTokenAddress) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _marketContractFactoryMPX | address | market contract factory address | 
| _honeyLemonOracle | address | honeylemon oracle address | 
| _minterBridge | address | 0x minter bridge address | 
| _imBTCTokenAddress | address | imBTC token address | 

### setOracleAddress

Set oracle address

```js
function setOracleAddress(address _honeyLemonOracleAddress) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _honeyLemonOracleAddress | address | oracle address | 

### setMinterBridgeAddress

Set minter bridge address

```js
function setMinterBridgeAddress(address _minterBridgeAddress) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _minterBridgeAddress | address | 0x minter bridge address | 

### setMarketContractSpecs

Set market contract specs

```js
function setMarketContractSpecs(uint256[7] _params) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _params | uint256[7] | array of specs | 

### getFillableAmounts

get amounts of TH that can be filled

```js
function getFillableAmounts(address[] makerAddresses) external view
returns(fillableAmounts uint256[])
```

**Returns**

array of fillable amounts

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| makerAddresses | address[] | list of makers addresses | 

### getLatestMri

get latest MRI value

```js
function getLatestMri() external view
returns(uint256)
```

**Returns**

latestMri

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getAllMarketContracts

get all market contarcts

```js
function getAllMarketContracts() public view
returns(address[])
```

**Returns**

array of market contracts

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getFillableAmount

calculate the TH amount that can be filled based on owner’s BTC balance and allowance

```js
function getFillableAmount(address makerAddress) public view
returns(uint256)
```

**Returns**

TH amount

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| makerAddress | address | address or BTC(imBTC) owner | 

### getLatestMarketContract

get latest market contract

```js
function getLatestMarketContract() public view
returns(contract MarketContractMPX)
```

**Returns**

market contract address

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getExpiringMarketContract

get expiring market contract

```js
function getExpiringMarketContract() public view
returns(contract MarketContractMPX)
```

**Returns**

expired market contract address

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getCollateralPool

get market collateral pool address

```js
function getCollateralPool(MarketContractMPX market) public view
returns(contract MarketCollateralPool)
```

**Returns**

collateral pool address

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| market | MarketContractMPX | market contract | 

### getLatestMarketCollateralPool

get latest market collateral pool address

```js
function getLatestMarketCollateralPool() public view
returns(contract MarketCollateralPool)
```

**Returns**

collateral pool address

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### calculateRequiredCollateral

calculate collateral needed to mint Long/Short tokens

```js
function calculateRequiredCollateral(uint256 amount) public view
returns(uint256)
```

**Returns**

needed collateral

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| amount | uint256 | deposited amount | 

### balanceOf

get user long token blanace for the current day

```js
function balanceOf(address owner) public nonpayable
returns(uint256)
```

**Returns**

long token balance

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| owner | address | address | 

### getTime

get current timestamp

```js
function getTime() public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### generateContractSpecs

generate market contract specs (cap price, expiration timestamp)

```js
function generateContractSpecs(uint256 currentMRI, uint256 expiration) public view
returns(uint256[7])
```

**Returns**

market specs

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| currentMRI | uint256 | current MRI value | 
| expiration | uint256 | market expiration timestamp | 

### getUserAddressOrDSProxy

get user address

```js
function getUserAddressOrDSProxy(address inputAddress) public view
returns(address)
```

**Returns**

address

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| inputAddress | address | user address | 

### createDSProxyWallet

create DSProxy wallet

```js
function createDSProxyWallet() public nonpayable
returns(address)
```

**Returns**

address of created DSProxy

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### batchRedeem

batch redeem long or short tokens for different markets

```js
function batchRedeem(address[] tokenAddresses, address[] marketAddresses, uint256[] tokensToRedeem, bool[] traderLong) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| tokenAddresses | address[] | long/short token addresses | 
| marketAddresses | address[] | market contracts addresses | 
| tokensToRedeem | uint256[] | amount of token to redeem | 
| traderLong | bool[] | true => trader long; false => trader short | 

### dailySettlement

deploy new market and settle last one (if met settlement requirements)

```js
function dailySettlement(uint256 lookbackIndexValue, uint256 currentIndexValue, bytes32[3] marketAndsTokenNames, uint256 newMarketExpiration) public nonpayable onlyHoneyLemonOracle 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| lookbackIndexValue | uint256 | last index value | 
| currentIndexValue | uint256 | current index value | 
| marketAndsTokenNames | bytes32[3] | bytes array of market, long and short token names | 
| newMarketExpiration | uint256 | new market expiration timestamp | 

### mintPositionTokens

mint long and short tokens

```js
function mintPositionTokens(uint256 qtyToMint, address longTokenRecipient, address shortTokenRecipient) public nonpayable onlyMinterBridge 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| qtyToMint | uint256 | long/short quantity to mint | 
| longTokenRecipient | address | address of long token recipient (will receive token at this address unless address have deployed DSProxy) | 
| shortTokenRecipient | address | address of short token recipient (will receive token at this address unless address have deployed DSProxy) | 

### settleMarketContract

settle specific market

```js
function settleMarketContract(uint256 mri, address marketContractAddress) public nonpayable onlyHoneyLemonOracle 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| mri | uint256 |  | 
| marketContractAddress | address |  | 

### deployContract

deploy the current Market contract

```js
function deployContract(uint256 currentMRI, bytes32[3] marketAndsTokenNames, uint256 expiration) internal nonpayable
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| currentMRI | uint256 | current MRI value | 
| marketAndsTokenNames | bytes32[3] | bytes array of market, long and short token names | 
| expiration | uint256 | expiration timestamp | 

## Contracts

* [Address](Address.md)
* [CollateralToken](CollateralToken.md)
* [DSAuth](DSAuth.md)
* [DSAuthEvents](DSAuthEvents.md)
* [DSAuthority](DSAuthority.md)
* [DSNote](DSNote.md)
* [DSProxy](DSProxy.md)
* [DSProxyCache](DSProxyCache.md)
* [DSProxyFactory](DSProxyFactory.md)
* [ERC20](ERC20.md)
* [ERC20Burnable](ERC20Burnable.md)
* [IERC20](IERC20.md)
* [InitialAllocationCollateralToken](InitialAllocationCollateralToken.md)
* [MarketCollateralPool](MarketCollateralPool.md)
* [MarketContract](MarketContract.md)
* [MarketContractFactoryMPX](MarketContractFactoryMPX.md)
* [MarketContractMPX](MarketContractMPX.md)
* [MarketContractProxy](MarketContractProxy.md)
* [MarketContractRegistry](MarketContractRegistry.md)
* [MarketContractRegistryInterface](MarketContractRegistryInterface.md)
* [MarketToken](MarketToken.md)
* [MathLib](MathLib.md)
* [Migrations](Migrations.md)
* [MinterBridge](MinterBridge.md)
* [Ownable](Ownable.md)
* [PaymentToken](PaymentToken.md)
* [PositionToken](PositionToken.md)
* [SafeERC20](SafeERC20.md)
* [SafeMath](SafeMath.md)
* [StringLib](StringLib.md)
* [UpgradeableTarget](UpgradeableTarget.md)
* [UpgradeableToken](UpgradeableToken.md)
* [UpgradeableTokenMock](UpgradeableTokenMock.md)
