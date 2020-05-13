# SafeERC20 (SafeERC20.sol)

View Source: [openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol](../../openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol)

**SafeERC20**

Wrappers around ERC20 operations that throw on failure (when the token
contract returns false). Tokens that return no value (and instead revert or
throw on failure) are also supported, non-reverting calls are assumed to be
successful.
To use this library you can add a `using SafeERC20 for ERC20;` statement to your contract,
which allows you to call the safe operations as `token.safeTransfer(...)`, etc.

## Functions

- [safeTransfer(IERC20 token, address to, uint256 value)](#safetransfer)
- [safeTransferFrom(IERC20 token, address from, address to, uint256 value)](#safetransferfrom)
- [safeApprove(IERC20 token, address spender, uint256 value)](#safeapprove)
- [safeIncreaseAllowance(IERC20 token, address spender, uint256 value)](#safeincreaseallowance)
- [safeDecreaseAllowance(IERC20 token, address spender, uint256 value)](#safedecreaseallowance)
- [callOptionalReturn(IERC20 token, bytes data)](#calloptionalreturn)

### safeTransfer

```js
function safeTransfer(IERC20 token, address to, uint256 value) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| token | IERC20 |  | 
| to | address |  | 
| value | uint256 |  | 

### safeTransferFrom

```js
function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| token | IERC20 |  | 
| from | address |  | 
| to | address |  | 
| value | uint256 |  | 

### safeApprove

```js
function safeApprove(IERC20 token, address spender, uint256 value) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| token | IERC20 |  | 
| spender | address |  | 
| value | uint256 |  | 

### safeIncreaseAllowance

```js
function safeIncreaseAllowance(IERC20 token, address spender, uint256 value) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| token | IERC20 |  | 
| spender | address |  | 
| value | uint256 |  | 

### safeDecreaseAllowance

```js
function safeDecreaseAllowance(IERC20 token, address spender, uint256 value) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| token | IERC20 |  | 
| spender | address |  | 
| value | uint256 |  | 

### callOptionalReturn

Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
on the return value: the return value is optional (but if data is returned, it must equal true).

```js
function callOptionalReturn(IERC20 token, bytes data) private nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| token | IERC20 | The token targeted by the call. | 
| data | bytes | The call data (encoded using abi.encode or one of its variants). | 

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
