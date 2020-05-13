# Math function library with overflow protection inspired by Open Zeppelin (MathLib.sol)

View Source: [contracts/libraries/MathLib.sol](../../contracts/libraries/MathLib.sol)

**MathLib**

## Contract Members
**Constants & Variables**

```js
int256 internal constant INT256_MIN;
int256 internal constant INT256_MAX;

```

## Functions

- [multiply(uint256 a, uint256 b)](#multiply)
- [divideFractional(uint256 a, uint256 numerator, uint256 denominator)](#dividefractional)
- [subtract(uint256 a, uint256 b)](#subtract)
- [add(uint256 a, uint256 b)](#add)
- [calculateCollateralToReturn(uint256 priceFloor, uint256 priceCap, uint256 qtyMultiplier, uint256 longQty, uint256 shortQty, uint256 price)](#calculatecollateraltoreturn)
- [calculateTotalCollateral(uint256 priceFloor, uint256 priceCap, uint256 qtyMultiplier)](#calculatetotalcollateral)
- [calculateFeePerUnit(uint256 priceFloor, uint256 priceCap, uint256 qtyMultiplier, uint256 feeInBasisPoints)](#calculatefeeperunit)

### multiply

```js
function multiply(uint256 a, uint256 b) internal pure
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| a | uint256 |  | 
| b | uint256 |  | 

### divideFractional

```js
function divideFractional(uint256 a, uint256 numerator, uint256 denominator) internal pure
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| a | uint256 |  | 
| numerator | uint256 |  | 
| denominator | uint256 |  | 

### subtract

```js
function subtract(uint256 a, uint256 b) internal pure
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| a | uint256 |  | 
| b | uint256 |  | 

### add

```js
function add(uint256 a, uint256 b) internal pure
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| a | uint256 |  | 
| b | uint256 |  | 

### calculateCollateralToReturn

determines the amount of needed collateral for a given position (qty and price)

```js
function calculateCollateralToReturn(uint256 priceFloor, uint256 priceCap, uint256 qtyMultiplier, uint256 longQty, uint256 shortQty, uint256 price) internal pure
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| priceFloor | uint256 | lowest price the contract is allowed to trade before expiration | 
| priceCap | uint256 | highest price the contract is allowed to trade before expiration | 
| qtyMultiplier | uint256 | multiplier for qty from base units | 
| longQty | uint256 | qty to redeem | 
| shortQty | uint256 | qty to redeem | 
| price | uint256 | Floor lowest price the contract is allowed to trade before expiration | 

### calculateTotalCollateral

determines the amount of needed collateral for minting a long and short position token

```js
function calculateTotalCollateral(uint256 priceFloor, uint256 priceCap, uint256 qtyMultiplier) internal pure
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| priceFloor | uint256 |  | 
| priceCap | uint256 |  | 
| qtyMultiplier | uint256 |  | 

### calculateFeePerUnit

calculates the fee in terms of base units of the collateral token per unit pair minted.

```js
function calculateFeePerUnit(uint256 priceFloor, uint256 priceCap, uint256 qtyMultiplier, uint256 feeInBasisPoints) internal pure
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| priceFloor | uint256 |  | 
| priceCap | uint256 |  | 
| qtyMultiplier | uint256 |  | 
| feeInBasisPoints | uint256 |  | 

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
