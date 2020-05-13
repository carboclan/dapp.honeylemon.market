# Upgradeable Token Mock for testing only. (UpgradeableTokenMock.sol)

View Source: [contracts/marketprotocol/tokens/UpgradeableTokenMock.sol](../../contracts/marketprotocol/tokens/UpgradeableTokenMock.sol)

**↗ Extends: [UpgradeableToken](UpgradeableToken.md), [UpgradeableTarget](UpgradeableTarget.md)**

**UpgradeableTokenMock**

A token to be able to test upgrade from another token

## Contract Members
**Constants & Variables**

```js
address public PREVIOUS_TOKEN_ADDRESS;

```

## Functions

- [(address previousTokenAddress)](#)
- [upgradeFrom(address from, uint256 value)](#upgradefrom)

### 

```js
function (address previousTokenAddress) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| previousTokenAddress | address |  | 

### upgradeFrom

⤾ overrides [UpgradeableTarget.upgradeFrom](UpgradeableTarget.md#upgradefrom)

```js
function upgradeFrom(address from, uint256 value) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| from | address |  | 
| value | uint256 |  | 

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
