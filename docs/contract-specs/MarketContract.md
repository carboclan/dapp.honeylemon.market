# MarketContract base contract implement all needed functionality for trading. (MarketContract.sol)

View Source: [contracts/marketprotocol/MarketContract.sol](../../contracts/marketprotocol/MarketContract.sol)

**↗ Extends: [Ownable](Ownable.md)**
**↘ Derived Contracts: [MarketContractMPX](MarketContractMPX.md)**

**MarketContract**

this is the abstract base contract that all contracts should inherit from to
 implement different oracle solutions.

## Contract Members
**Constants & Variables**

```js
string public CONTRACT_NAME;
address public COLLATERAL_TOKEN_ADDRESS;
address public COLLATERAL_POOL_ADDRESS;
uint256 public PRICE_CAP;
uint256 public PRICE_FLOOR;
uint256 public PRICE_DECIMAL_PLACES;
uint256 public QTY_MULTIPLIER;
uint256 public COLLATERAL_PER_UNIT;
uint256 public COLLATERAL_TOKEN_FEE_PER_UNIT;
uint256 public MKT_TOKEN_FEE_PER_UNIT;
uint256 public EXPIRATION;
uint256 public SETTLEMENT_DELAY;
address public LONG_POSITION_TOKEN;
address public SHORT_POSITION_TOKEN;
uint256 public lastPrice;
uint256 public settlementPrice;
uint256 public settlementTimeStamp;
bool public isSettled;

```

**Events**

```js
event UpdatedLastPrice(uint256  price);
event ContractSettled(uint256  settlePrice);
```

## Modifiers

- [onlyCollateralPool](#onlycollateralpool)

### onlyCollateralPool

only able to be called directly by our collateral pool which controls the position tokens
 for this contract!

```js
modifier onlyCollateralPool() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

## Functions

- [(bytes32[3] contractNames, address[3] baseAddresses, uint256[7] contractSpecs)](#)
- [mintPositionTokens(uint256 qtyToMint, address minter)](#mintpositiontokens)
- [redeemLongToken(uint256 qtyToRedeem, address redeemer)](#redeemlongtoken)
- [redeemShortToken(uint256 qtyToRedeem, address redeemer)](#redeemshorttoken)
- [isPostSettlementDelay()](#ispostsettlementdelay)
- [checkSettlement()](#checksettlement)
- [settleContract(uint256 finalSettlementPrice)](#settlecontract)

### 

```js
function (bytes32[3] contractNames, address[3] baseAddresses, uint256[7] contractSpecs) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| contractNames | bytes32[3] | bytes32 array of names
     contractName            name of the market contract
     longTokenSymbol         symbol for the long token
     shortTokenSymbol        symbol for the short token | 
| baseAddresses | address[3] | array of 2 addresses needed for our contract including:
     ownerAddress                    address of the owner of these contracts.
     collateralTokenAddress          address of the ERC20 token that will be used for collateral and pricing
     collateralPoolAddress           address of our collateral pool contract | 
| contractSpecs | uint256[7] | array of unsigned integers including:
     floorPrice          minimum tradeable price of this contract, contract enters settlement if breached
     capPrice            maximum tradeable price of this contract, contract enters settlement if breached
     priceDecimalPlaces  number of decimal places to convert our queried price from a floating point to
                         an integer
     qtyMultiplier       multiply traded qty by this value from base units of collateral token.
     feeInBasisPoints    fee amount in basis points (Collateral token denominated) for minting.
     mktFeeInBasisPoints fee amount in basis points (MKT denominated) for minting.
     expirationTimeStamp seconds from epoch that this contract expires and enters settlement | 

### mintPositionTokens

called only by our collateral pool to create long and short position tokens

```js
function mintPositionTokens(uint256 qtyToMint, address minter) external nonpayable onlyCollateralPool 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| qtyToMint | uint256 | qty in base units of how many short and long tokens to mint | 
| minter | address | address of minter to receive tokens | 

### redeemLongToken

called only by our collateral pool to redeem long position tokens

```js
function redeemLongToken(uint256 qtyToRedeem, address redeemer) external nonpayable onlyCollateralPool 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| qtyToRedeem | uint256 | qty in base units of how many tokens to redeem | 
| redeemer | address | address of person redeeming tokens | 

### redeemShortToken

called only by our collateral pool to redeem short position tokens

```js
function redeemShortToken(uint256 qtyToRedeem, address redeemer) external nonpayable onlyCollateralPool 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| qtyToRedeem | uint256 | qty in base units of how many tokens to redeem | 
| redeemer | address | address of person redeeming tokens | 

### isPostSettlementDelay

checks to see if a contract is settled, and that the settlement delay has passed

```js
function isPostSettlementDelay() public view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### checkSettlement

checks our last query price to see if our contract should enter settlement due to it being past our

```js
function checkSettlement() internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### settleContract

records our final settlement price and fires needed events.

```js
function settleContract(uint256 finalSettlementPrice) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| finalSettlementPrice | uint256 | final query price at time of settlement | 

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
