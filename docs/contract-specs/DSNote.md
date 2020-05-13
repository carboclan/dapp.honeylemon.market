# DSNote.sol

View Source: [contracts/honeylemon/DSProxy.sol](../../contracts/honeylemon/DSProxy.sol)

**↗ Extends: [DSAuthEvents](DSAuthEvents.md)**

**DSNote**

## Contract Members
**Constants & Variables**

```js
//public members
contract DSAuthority public authority;
address public owner;
contract DSProxyCache public cache;
mapping(address => bool) public isProxy;
contract DSProxyCache public cache;

//internal members
address internal marketContractProxy;
mapping(bytes32 => address) internal cache;

```

**Events**

```js
event LogNote(bytes4 indexed sig, address indexed guy, bytes32 indexed foo, bytes32  bar, uint256  wad, bytes  fax);
event LogSetAuthority(address indexed authority);
event LogSetOwner(address indexed owner);
event LogEvent(address  msgsender, address  addressthis, uint256  param, address  tokenAddress);
event Created(address indexed sender, address indexed owner, address  proxy, address  cache);
```

## Modifiers

- [note](#note)
- [auth](#auth)
- [onlyMarketContractProxy](#onlymarketcontractproxy)

### note

```js
modifier note() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### auth

```js
modifier auth() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### onlyMarketContractProxy

```js
modifier onlyMarketContractProxy() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

## Functions

- [canCall(address src, address dst, bytes4 sig)](#cancall)
- [()](#)
- [setOwner(address owner_)](#setowner)
- [setAuthority(DSAuthority authority_)](#setauthority)
- [isAuthorized(address src, bytes4 sig)](#isauthorized)
- [(address _cacheAddr)](#)
- [()](#)
- [execute(address _target, bytes _data)](#execute)
- [setCache(address _cacheAddr)](#setcache)
- [()](#)
- [build(address owner)](#build)
- [build()](#build)
- [read(bytes _code)](#read)
- [write(bytes _code)](#write)

### canCall

```js
function canCall(address src, address dst, bytes4 sig) public view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| src | address |  | 
| dst | address |  | 
| sig | bytes4 |  | 

### 

```js
function () public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setOwner

```js
function setOwner(address owner_) public nonpayable auth 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| owner_ | address |  | 

### setAuthority

```js
function setAuthority(DSAuthority authority_) public nonpayable auth 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| authority_ | DSAuthority |  | 

### isAuthorized

```js
function isAuthorized(address src, bytes4 sig) internal view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| src | address |  | 
| sig | bytes4 |  | 

### 

```js
function (address _cacheAddr) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _cacheAddr | address |  | 

### 

```js
function () external payable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### execute

```js
function execute(address _target, bytes _data) public payable auth note 
returns(response bytes)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _target | address |  | 
| _data | bytes |  | 

### setCache

```js
function setCache(address _cacheAddr) public payable auth note 
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _cacheAddr | address |  | 

### 

```js
function () public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### build

```js
function build(address owner) public nonpayable onlyMarketContractProxy 
returns(proxy address payable)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| owner | address |  | 

### build

```js
function build() internal nonpayable
returns(proxy address payable)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### read

```js
function read(bytes _code) public view
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _code | bytes |  | 

### write

```js
function write(bytes _code) public nonpayable
returns(target address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _code | bytes |  | 

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
