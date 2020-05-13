# CollateralToken.sol

View Source: [contracts/marketprotocol/tokens/CollateralToken.sol](../../contracts/marketprotocol/tokens/CollateralToken.sol)

**↗ Extends: [ERC20](ERC20.md)**
**↘ Derived Contracts: [InitialAllocationCollateralToken](InitialAllocationCollateralToken.md)**

**CollateralToken**

## Contract Members
**Constants & Variables**

```js
string public name;
string public symbol;
uint8 public decimals;

```

## Functions

- [(string tokenName, string tokenSymbol, uint256 initialSupply, uint8 tokenDecimals)](#)

### 

Constructor that gives msg.sender all of existing tokens.

```js
function (string tokenName, string tokenSymbol, uint256 initialSupply, uint8 tokenDecimals) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| tokenName | string |  | 
| tokenSymbol | string |  | 
| initialSupply | uint256 |  | 
| tokenDecimals | uint8 |  | 

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
