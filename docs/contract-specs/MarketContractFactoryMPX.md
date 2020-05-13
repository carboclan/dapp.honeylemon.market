# MarketContractFactoryMPX (MarketContractFactoryMPX.sol)

View Source: [contracts/marketprotocol/mpx/MarketContractFactoryMPX.sol](../../contracts/marketprotocol/mpx/MarketContractFactoryMPX.sol)

**↗ Extends: [Ownable](Ownable.md)**

**MarketContractFactoryMPX**

## Contract Members
**Constants & Variables**

```js
address public marketContractRegistry;
address public oracleHub;
address public MARKET_COLLATERAL_POOL;

```

**Events**

```js
event MarketContractCreated(address indexed creator, address indexed contractAddress);
```

## Functions

- [(address registryAddress, address collateralPoolAddress, address oracleHubAddress)](#)
- [deployMarketContractMPX(bytes32[3] contractNames, address collateralTokenAddress, uint256[7] contractSpecs, string oracleURL, string oracleStatistic)](#deploymarketcontractmpx)
- [setRegistryAddress(address registryAddress)](#setregistryaddress)
- [setOracleHubAddress(address oracleHubAddress)](#setoraclehubaddress)

### 

deploys our factory and ties it to the supplied registry address

```js
function (address registryAddress, address collateralPoolAddress, address oracleHubAddress) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| registryAddress | address | - address of our MARKET registry | 
| collateralPoolAddress | address | - address of our MARKET Collateral pool | 
| oracleHubAddress | address | - address of the MPX oracle | 

### deployMarketContractMPX

Deploys a new instance of a market contract and adds it to the whitelist.

```js
function deployMarketContractMPX(bytes32[3] contractNames, address collateralTokenAddress, uint256[7] contractSpecs, string oracleURL, string oracleStatistic) external nonpayable onlyOwner 
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| contractNames | bytes32[3] | bytes32 array of names
     contractName            name of the market contract
     longTokenSymbol         symbol for the long token
     shortTokenSymbol        symbol for the short token | 
| collateralTokenAddress | address | address of the ERC20 token that will be used for collateral and pricing | 
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

### setRegistryAddress

allows for the owner to set the desired registry for contract creation.

```js
function setRegistryAddress(address registryAddress) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| registryAddress | address | desired registry address. | 

### setOracleHubAddress

allows for the owner to set a new oracle hub address which is responsible for providing data to our
 contracts

```js
function setOracleHubAddress(address oracleHubAddress) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| oracleHubAddress | address | address of the oracle hub, cannot be null address | 

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
