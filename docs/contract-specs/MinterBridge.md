# MinterBridge.sol

View Source: [contracts/honeylemon/MinterBridge.sol](../../contracts/honeylemon/MinterBridge.sol)

**↗ Extends: [Ownable](Ownable.md)**

**MinterBridge**

## Contract Members
**Constants & Variables**

```js
//internal members
contract MarketContractProxy internal marketContractProxy;
bytes4 internal constant BRIDGE_SUCCESS;

//public members
address public MARKET_CONTRACT_PROXY_ADDRESS;
address public ERC20_BRIDGE_PROXY_ADDRESS;

```

## Modifiers

- [only0xBridgeProxy](#only0xbridgeproxy)
- [onlyIfSetMarketContractProxy](#onlyifsetmarketcontractproxy)

### only0xBridgeProxy

check that called is 0x minter bridge proxy address

```js
modifier only0xBridgeProxy() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### onlyIfSetMarketContractProxy

check that market contract proxy address is initialized

```js
modifier onlyIfSetMarketContractProxy() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

## Functions

- [setMarketContractProxyAddress(address _marketContractProxyAddress)](#setmarketcontractproxyaddress)
- [set0xBridgeProxy(address _0xBridgeProxyAddress)](#set0xbridgeproxy)
- [bridgeTransferFrom(address tokenAddress, address from, address to, uint256 amount, bytes bridgeData)](#bridgetransferfrom)

### setMarketContractProxyAddress

set market contract proxy address

```js
function setMarketContractProxyAddress(address _marketContractProxyAddress) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _marketContractProxyAddress | address | market contract address | 

### set0xBridgeProxy

set 0x minter bridge proxy address

```js
function set0xBridgeProxy(address _0xBridgeProxyAddress) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _0xBridgeProxyAddress | address | 0x minter bridge proxy address | 

### bridgeTransferFrom

Transfers `amount` of the ERC20 `tokenAddress` from `from` to `to`.

```js
function bridgeTransferFrom(address tokenAddress, address from, address to, uint256 amount, bytes bridgeData) external nonpayable onlyIfSetMarketContractProxy 
returns(success bytes4)
```

**Returns**

success The magic bytes `0x37708e9b` if successful.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| tokenAddress | address | in the standard 0x implementation this is the transferred token.
In HoneyLemon this is the marketContractProxy which acts to spoof a token and inform
the MinterBridge of the latest perpetual token. | 
| from | address | Address to transfer asset from. | 
| to | address | kenAddress in the standard 0x implementation this is the transferred token.
In HoneyLemon this is the marketContractProxy which acts to spoof a token and inform
the MinterBridge of the latest perpetual token. | 
| amount | uint256 | Amount of asset to transfer. | 
| bridgeData | bytes | Arbitrary asset data needed by the bridge contract. | 

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
