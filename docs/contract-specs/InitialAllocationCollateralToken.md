# InitialAllocationCollateralToken.sol

View Source: [contracts/marketprotocol/tokens/InitialAllocationCollateralToken.sol](../../contracts/marketprotocol/tokens/InitialAllocationCollateralToken.sol)

**↗ Extends: [CollateralToken](CollateralToken.md)**

**InitialAllocationCollateralToken**

## Contract Members
**Constants & Variables**

```js
//public members
uint256 public INITIAL_TOKEN_ALLOCATION;
uint256 public totalTokenAllocationsRequested;

//internal members
mapping(address => bool) internal isInitialAllocationClaimed;

```

**Events**

```js
event AllocationClaimed(address indexed claimeeAddress);
```

## Functions

- [(string tokenName, string tokenSymbol, uint256 initialTokenAllocation, uint8 tokenDecimals)](#)
- [getInitialAllocation()](#getinitialallocation)
- [isAllocationClaimed(address claimee)](#isallocationclaimed)

### 

creates a token that allows for all addresses to retrieve an initial token allocation.

```js
function (string tokenName, string tokenSymbol, uint256 initialTokenAllocation, uint8 tokenDecimals) public nonpayable CollateralToken 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| tokenName | string |  | 
| tokenSymbol | string |  | 
| initialTokenAllocation | uint256 |  | 
| tokenDecimals | uint8 |  | 

### getInitialAllocation

allows caller to claim a one time allocation of tokens.

```js
function getInitialAllocation() external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### isAllocationClaimed

check to see if an address has already claimed their initial allocation

```js
function isAllocationClaimed(address claimee) external view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| claimee | address | address of the user claiming their tokens | 

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
