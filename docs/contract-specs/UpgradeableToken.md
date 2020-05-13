# Upgradeable Token (UpgradeableToken.sol)

View Source: [contracts/marketprotocol/tokens/UpgradableToken.sol](../../contracts/marketprotocol/tokens/UpgradableToken.sol)

**↗ Extends: [Ownable](Ownable.md), [ERC20Burnable](ERC20Burnable.md)**
**↘ Derived Contracts: [MarketToken](MarketToken.md), [UpgradeableTokenMock](UpgradeableTokenMock.md)**

**UpgradeableToken**

allows for us to update some of the needed functionality in our tokens post deployment. Inspiration taken
 from Golems migrate functionality.

## Contract Members
**Constants & Variables**

```js
address public upgradeableTarget;
uint256 public totalUpgraded;

```

**Events**

```js
event Upgraded(address indexed from, address indexed to, uint256  value);
```

## Functions

- [upgrade(uint256 value)](#upgrade)
- [setUpgradeableTarget(address upgradeAddress)](#setupgradeabletarget)

### upgrade

Update token to the new upgraded token

```js
function upgrade(uint256 value) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| value | uint256 | The amount of token to be migrated to upgraded token | 

### setUpgradeableTarget

Set address of upgrade target process.

```js
function setUpgradeableTarget(address upgradeAddress) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| upgradeAddress | address | The address of the UpgradeableTarget contract. | 

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
