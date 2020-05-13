# MarketContractMPX - a MarketContract designed to be used with our internal oracle service (MarketContractMPX.sol)

View Source: [contracts/marketprotocol/mpx/MarketContractMPX.sol](../../contracts/marketprotocol/mpx/MarketContractMPX.sol)

**↗ Extends: [MarketContract](MarketContract.md)**

**MarketContractMPX**

## Contract Members
**Constants & Variables**

```js
address public ORACLE_HUB_ADDRESS;
string public ORACLE_URL;
string public ORACLE_STATISTIC;

```

## Modifiers

- [onlyOracleHub](#onlyoraclehub)

### onlyOracleHub

allows calls only from the oracle hub.

```js
modifier onlyOracleHub() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

## Functions

- [(bytes32[3] contractNames, address[3] baseAddresses, address oracleHubAddress, uint256[7] contractSpecs, string oracleURL, string oracleStatistic)](#)
- [oracleCallBack(uint256 price)](#oraclecallback)
- [arbitrateSettlement(uint256 price)](#arbitratesettlement)
- [setOracleHubAddress(address oracleHubAddress)](#setoraclehubaddress)

### 

```js
function (bytes32[3] contractNames, address[3] baseAddresses, address oracleHubAddress, uint256[7] contractSpecs, string oracleURL, string oracleStatistic) public nonpayable MarketContract 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| contractNames | bytes32[3] | bytes32 array of names
     contractName            name of the market contract
     longTokenSymbol         symbol for the long token
     shortTokenSymbol        symbol for the short token | 
| baseAddresses | address[3] | array of 2 addresses needed for our contract including:
     ownerAddress                    address of the owner of these contracts.
     collateralTokenAddress          address of the ERC20 token that will be used for collateral and pricing
     collateralPoolAddress           address of our collateral pool contract | 
| oracleHubAddress | address | address of our oracle hub providing the callbacks | 
| contractSpecs | uint256[7] | array of unsigned integers including:
     floorPrice              minimum tradeable price of this contract, contract enters settlement if breached
     capPrice                maximum tradeable price of this contract, contract enters settlement if breached
     priceDecimalPlaces      number of decimal places to convert our queried price from a floating point to
                             an integer
     qtyMultiplier           multiply traded qty by this value from base units of collateral token.
     feeInBasisPoints    fee amount in basis points (Collateral token denominated) for minting.
     mktFeeInBasisPoints fee amount in basis points (MKT denominated) for minting.
     expirationTimeStamp     seconds from epoch that this contract expires and enters settlement | 
| oracleURL | string | url of data | 
| oracleStatistic | string | statistic type (lastPrice, vwap, etc) | 

### oracleCallBack

called only by our oracle hub when a new price is available provided by our oracle.

```js
function oracleCallBack(uint256 price) public nonpayable onlyOracleHub 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| price | uint256 | lastPrice provided by the oracle. | 

### arbitrateSettlement

allows us to arbitrate a settlement price by updating the settlement value, and resetting the
 delay for funds to be released. Could also be used to allow us to force a contract into early settlement
 if a dispute arises that we believe is best resolved by early settlement.

```js
function arbitrateSettlement(uint256 price) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| price | uint256 | settlement price | 

### setOracleHubAddress

allows for the owner of the contract to change the oracle hub address if needed

```js
function setOracleHubAddress(address oracleHubAddress) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| oracleHubAddress | address |  | 

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
