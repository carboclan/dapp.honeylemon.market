# Position Token (PositionToken.sol)

View Source: [contracts/marketprotocol/tokens/PositionToken.sol](../../contracts/marketprotocol/tokens/PositionToken.sol)

**↗ Extends: [ERC20](ERC20.md), [Ownable](Ownable.md)**

**PositionToken**

A token that represents a claim to a collateral pool and a short or long position.
 The collateral pool acts as the owner of this contract and controls minting and redemption of these
 tokens based on locked collateral in the pool.
 NOTE: We eventually can move all of this logic into a library to avoid deploying all of the logic
 every time a new market contract is deployed.

**Enums**
### MarketSide

```js
enum MarketSide {
 Long,
 Short
}
```

## Contract Members
**Constants & Variables**

```js
string public name;
string public symbol;
uint8 public decimals;
enum PositionToken.MarketSide public MARKET_SIDE;

```

## Functions

- [(string tokenName, string tokenSymbol, uint8 marketSide)](#)
- [mintAndSendToken(uint256 qtyToMint, address recipient)](#mintandsendtoken)
- [redeemToken(uint256 qtyToRedeem, address redeemer)](#redeemtoken)

### 

```js
function (string tokenName, string tokenSymbol, uint8 marketSide) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| tokenName | string |  | 
| tokenSymbol | string |  | 
| marketSide | uint8 |  | 

### mintAndSendToken

Called by our MarketContract (owner) to create a long or short position token. These tokens are minted,
 and then transferred to our recipient who is the party who is minting these tokens.  The collateral pool
 is the only caller (acts as the owner) because collateral must be deposited / locked prior to minting of new
 position tokens

```js
function mintAndSendToken(uint256 qtyToMint, address recipient) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| qtyToMint | uint256 | quantity of position tokens to mint (in base units) | 
| recipient | address | the person minting and receiving these position tokens. | 

### redeemToken

Called by our MarketContract (owner) when redemption occurs.  This means that either a single user is redeeming
 both short and long tokens in order to claim their collateral, or the contract has settled, and only a single
 side of the tokens are needed to redeem (handled by the collateral pool)

```js
function redeemToken(uint256 qtyToRedeem, address redeemer) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| qtyToRedeem | uint256 | quantity of tokens to burn (remove from supply / circulation) | 
| redeemer | address | the person redeeming these tokens (who are we taking the balance from) | 

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
