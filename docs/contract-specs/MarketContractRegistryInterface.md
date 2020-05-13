# MarketContractRegistryInterface.sol

View Source: [contracts/marketprotocol/MarketContractRegistryInterface.sol](../../contracts/marketprotocol/MarketContractRegistryInterface.sol)

**↘ Derived Contracts: [MarketContractRegistry](MarketContractRegistry.md)**

**MarketContractRegistryInterface**

## Functions

- [addAddressToWhiteList(address contractAddress)](#addaddresstowhitelist)
- [isAddressWhiteListed(address contractAddress)](#isaddresswhitelisted)

### addAddressToWhiteList

⤿ Overridden Implementation(s): [MarketContractRegistry.addAddressToWhiteList](MarketContractRegistry.md#addaddresstowhitelist)

```js
function addAddressToWhiteList(address contractAddress) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| contractAddress | address |  | 

### isAddressWhiteListed

⤿ Overridden Implementation(s): [MarketContractRegistry.isAddressWhiteListed](MarketContractRegistry.md#isaddresswhitelisted)

```js
function isAddressWhiteListed(address contractAddress) external view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| contractAddress | address |  | 

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
