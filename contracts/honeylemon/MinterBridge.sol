pragma solidity 0.5.2;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';

import '../libraries/MathLib.sol';
import '../marketprotocol/MarketCollateralPool.sol';
import '../marketprotocol/mpx/MarketContractMPX.sol';
import '../marketprotocol/tokens/PositionToken.sol';

import './MarketContractProxy.sol';


contract MinterBridge is Ownable {
    using MathLib for uint;
    using MathLib for int;
    using SafeERC20 for ERC20;

    MarketContractProxy marketProxy;

    // @dev Result of a successful bridge call.
    bytes4 internal constant BRIDGE_SUCCESS = 0xdc1600f3;
    address public MARKET_CONTRACT_PROXY_ADDRESS;

    function setMarketProxyAddress(address _marketContractProxyAddress) public onlyOwner {
        MARKET_CONTRACT_PROXY_ADDRESS = _marketContractProxyAddress;
        marketProxy = MarketContractProxy(MARKET_CONTRACT_PROXY_ADDRESS);
    }

    modifier onlyMarketProxy() {
        require(msg.sender == MARKET_CONTRACT_PROXY_ADDRESS, 'bad proxy address');
        _;
    }

    modifier onlyIfSetMarketProxy() {
        require(MARKET_CONTRACT_PROXY_ADDRESS != address(0), 'MarketProxy not set');
        _;
    }

    /// @dev Transfers `amount` of the ERC20 `tokenAddress` from `from` to `to`.
    /// @param tokenAddress in the standard 0x implementation this is the transferred token.
    // In HoneyLemon this is the marketContractProxy which acts to spoof a token and inform
    // the MinterBridge of the latest perpetual token.
    /// @param from Address to transfer asset from.
    /// @param to Address to transfer asset to.
    /// @param amount Amount of asset to transfer.
    /// @param bridgeData Arbitrary asset data needed by the bridge contract.
    /// @return success The magic bytes `0x37708e9b` if successful.
    function bridgeTransferFrom(
        address tokenAddress,
        address from,
        address to,
        uint256 amount,
        bytes calldata bridgeData
    ) external onlyIfSetMarketProxy returns (bytes4 success) {
        require(tokenAddress == MARKET_CONTRACT_PROXY_ADDRESS, 'bad proxy address');
        address marketContractAddress = marketProxy.getCurrentMarketContractAddress();
        MarketContract market = MarketContract(marketContractAddress);

        // address poolAddress = market.COLLATERAL_POOL_ADDRESS();
        // (imBTC) sent from the miner
        ERC20 collateralToken = ERC20(market.COLLATERAL_TOKEN_ADDRESS());
        // Long token sent to the investor
        // ERC20 longToken = ERC20(market.LONG_POSITION_TOKEN());
        // // Short token sent to the miner
        // ERC20 shortToken = ERC20(market.SHORT_POSITION_TOKEN());

        uint neededCollateral = MathLib.multiply(amount, market.COLLATERAL_PER_UNIT());

        collateralToken.safeTransferFrom(from, MARKET_CONTRACT_PROXY_ADDRESS, neededCollateral);
        // to: long & taker (investor)
        // from: short & maker (miner)

        marketProxy.mintPositionTokens(amount, to, from);

        // Transfer the fake token to trick 0x
        // ERC20(tokenAddress).transfer(to, amount);

        // TODO: transfer ERC20 tokens (DAI) from the investor (taker) to the miner (maker)

        return BRIDGE_SUCCESS;
    }
}
