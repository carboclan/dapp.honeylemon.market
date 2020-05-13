# MarketContractRegistry (MarketContractRegistry.sol)

View Source: [contracts/marketprotocol/MarketContractRegistry.sol](../../contracts/marketprotocol/MarketContractRegistry.sol)

**↗ Extends: [Ownable](Ownable.md), [MarketContractRegistryInterface](MarketContractRegistryInterface.md)**

**MarketContractRegistry**

## Contract Members
**Constants & Variables**

```js
mapping(address => bool) public isWhiteListed;
address[] public addressWhiteList;
mapping(address => bool) public factoryAddressWhiteList;

```

**Events**

```js
event AddressAddedToWhitelist(address indexed contractAddress);
event AddressRemovedFromWhitelist(address indexed contractAddress);
event FactoryAddressAdded(address indexed factoryAddress);
event FactoryAddressRemoved(address indexed factoryAddress);
```

## Functions

- [isAddressWhiteListed(address contractAddress)](#isaddresswhitelisted)
- [getAddressWhiteList()](#getaddresswhitelist)
- [removeContractFromWhiteList(address contractAddress, uint256 whiteListIndex)](#removecontractfromwhitelist)
- [addAddressToWhiteList(address contractAddress)](#addaddresstowhitelist)
- [addFactoryAddress(address factoryAddress)](#addfactoryaddress)
- [removeFactoryAddress(address factoryAddress)](#removefactoryaddress)

### isAddressWhiteListed

⤾ overrides [MarketContractRegistryInterface.isAddressWhiteListed](MarketContractRegistryInterface.md#isaddresswhitelisted)

determines if an address is a valid MarketContract

```js
function isAddressWhiteListed(address contractAddress) external view
returns(bool)
```

**Returns**

false if the address is not white listed.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| contractAddress | address |  | 

### getAddressWhiteList

all currently whitelisted addresses
 returns array of addresses

```js
function getAddressWhiteList() external view
returns(address[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### removeContractFromWhiteList

allows for the owner to remove a white listed contract, eventually ownership could transition to
 a decentralized smart contract of community members to vote

```js
function removeContractFromWhiteList(address contractAddress, uint256 whiteListIndex) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| contractAddress | address | contract to removed from white list | 
| whiteListIndex | uint256 | of the contractAddress in the addressWhiteList to be removed. | 

### addAddressToWhiteList

⤾ overrides [MarketContractRegistryInterface.addAddressToWhiteList](MarketContractRegistryInterface.md#addaddresstowhitelist)

allows for the owner or factory to add a white listed contract, eventually ownership could transition to
 a decentralized smart contract of community members to vote

```js
function addAddressToWhiteList(address contractAddress) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| contractAddress | address | contract to removed from white list | 

### addFactoryAddress

allows for the owner to add a new address of a factory responsible for creating new market contracts

```js
function addFactoryAddress(address factoryAddress) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| factoryAddress | address | address of factory to be allowed to add contracts to whitelist | 

### removeFactoryAddress

allows for the owner to remove an address of a factory

```js
function removeFactoryAddress(address factoryAddress) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| factoryAddress | address | address of factory to be removed | 

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
