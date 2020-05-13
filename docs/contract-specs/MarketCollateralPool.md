# MarketCollateralPool (MarketCollateralPool.sol)

View Source: [contracts/marketprotocol/MarketCollateralPool.sol](../../contracts/marketprotocol/MarketCollateralPool.sol)

**↗ Extends: [Ownable](Ownable.md)**

**MarketCollateralPool**

This collateral pool houses all of the collateral for all market contracts currently in circulation.
 This pool facilitates locking of collateral and minting / redemption of position tokens for that collateral.

## Contract Members
**Constants & Variables**

```js
address public marketContractRegistry;
address public mktToken;
mapping(address => uint256) public contractAddressToCollateralPoolBalance;
mapping(address => uint256) public feesCollectedByTokenAddress;

```

**Events**

```js
event TokensMinted(address indexed marketContract, address indexed user, address indexed feeToken, uint256  qtyMinted, uint256  collateralLocked, uint256  feesPaid);
event TokensRedeemed(address indexed marketContract, address indexed user, uint256  longQtyRedeemed, uint256  shortQtyRedeemed, uint256  collateralUnlocked);
```

## Modifiers

- [onlyWhiteListedAddress](#onlywhitelistedaddress)

### onlyWhiteListedAddress

only can be called with a market contract address that currently exists in our whitelist
 this ensure's it is a market contract that has been created by us and therefore has a uniquely created
 long and short token address.  If it didn't we could have spoofed contracts minting tokens with a
 collateral token that wasn't the same as the intended token.

```js
modifier onlyWhiteListedAddress(address marketContractAddress) internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| marketContractAddress | address |  | 

## Functions

- [(address marketContractRegistryAddress, address mktTokenAddress)](#)
- [mintPositionTokens(address marketContractAddress, uint256 qtyToMint, bool isAttemptToPayInMKT)](#mintpositiontokens)
- [redeemPositionTokens(address marketContractAddress, uint256 qtyToRedeem)](#redeempositiontokens)
- [settleAndClose(address marketContractAddress, uint256 longQtyToRedeem, uint256 shortQtyToRedeem)](#settleandclose)
- [withdrawFees(address feeTokenAddress, address feeRecipient)](#withdrawfees)
- [setMKTTokenAddress(address mktTokenAddress)](#setmkttokenaddress)
- [setMarketContractRegistryAddress(address marketContractRegistryAddress)](#setmarketcontractregistryaddress)

### 

```js
function (address marketContractRegistryAddress, address mktTokenAddress) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| marketContractRegistryAddress | address |  | 
| mktTokenAddress | address |  | 

### mintPositionTokens

Called by a user that would like to mint a new set of long and short token for a specified
 market contract.  This will transfer and lock the correct amount of collateral into the pool
 and issue them the requested qty of long and short tokens

```js
function mintPositionTokens(address marketContractAddress, uint256 qtyToMint, bool isAttemptToPayInMKT) external nonpayable onlyWhiteListedAddress 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| marketContractAddress | address | address of the market contract to redeem tokens for | 
| qtyToMint | uint256 | quantity of long / short tokens to mint. | 
| isAttemptToPayInMKT | bool | if possible, attempt to pay fee's in MKT rather than collateral tokens | 

### redeemPositionTokens

Called by a user that currently holds both short and long position tokens and would like to redeem them
 for their collateral.

```js
function redeemPositionTokens(address marketContractAddress, uint256 qtyToRedeem) external nonpayable onlyWhiteListedAddress 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| marketContractAddress | address | address of the market contract to redeem tokens for | 
| qtyToRedeem | uint256 | quantity of long / short tokens to redeem. | 

### settleAndClose

```js
function settleAndClose(address marketContractAddress, uint256 longQtyToRedeem, uint256 shortQtyToRedeem) external nonpayable onlyWhiteListedAddress 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| marketContractAddress | address | address of the MARKET Contract being traded. | 
| longQtyToRedeem | uint256 | qty to redeem of long tokens | 
| shortQtyToRedeem | uint256 | qty to redeem of short tokens | 

### withdrawFees

allows the owner to remove the fees paid into this contract for minting

```js
function withdrawFees(address feeTokenAddress, address feeRecipient) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| feeTokenAddress | address | - address of the erc20 token fees have been paid in | 
| feeRecipient | address | - Recipient address of fees | 

### setMKTTokenAddress

allows the owner to update the mkt token address in use for fees

```js
function setMKTTokenAddress(address mktTokenAddress) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| mktTokenAddress | address | address of new MKT token | 

### setMarketContractRegistryAddress

allows the owner to update the mkt token address in use for fees

```js
function setMarketContractRegistryAddress(address marketContractRegistryAddress) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| marketContractRegistryAddress | address | address of new contract registry | 

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
