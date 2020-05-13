# Burnable Token (ERC20Burnable.sol)

View Source: [openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol](../../openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol)

**↗ Extends: [ERC20](ERC20.md)**
**↘ Derived Contracts: [UpgradeableToken](UpgradeableToken.md)**

**ERC20Burnable**

Token that can be irreversibly burned (destroyed).

## Functions

- [burn(uint256 value)](#burn)
- [burnFrom(address from, uint256 value)](#burnfrom)

### burn

Burns a specific amount of tokens.

```js
function burn(uint256 value) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| value | uint256 | The amount of token to be burned. | 

### burnFrom

Burns a specific amount of tokens from the target address and decrements allowance

```js
function burnFrom(address from, uint256 value) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| from | address | address The account whose tokens will be burned. | 
| value | uint256 | uint256 The amount of token to be burned. | 

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
