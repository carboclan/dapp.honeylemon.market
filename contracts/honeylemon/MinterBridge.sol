pragma solidity 0.5.2;

import 'openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';

import '../libraries/MathLib.sol';
import '../marketprotocol/MarketCollateralPool.sol';
import '../marketprotocol/mpx/MarketContractMPX.sol';
import '../marketprotocol/tokens/PositionToken.sol';

import './MarketContractProxy.sol';


contract MinterBridge {
    using MathLib for uint;
    using MathLib for int;
    using SafeERC20 for ERC20;

    // @dev Result of a successful bridge call.
    bytes4 internal constant BRIDGE_SUCCESS = 0xdc1600f3;
    address public MARKET_CONTRACT_PROXY_ADDRESS;

    constructor(address _marketContractProxyAddress) public {
        MARKET_CONTRACT_PROXY_ADDRESS = _marketContractProxyAddress;
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
    ) external returns (bytes4 success) {
        require(tokenAddress == MARKET_CONTRACT_PROXY_ADDRESS, 'bad proxy address');

        MarketContractProxy marketProtocolProxy = MarketContractProxy(MARKET_CONTRACT_PROXY_ADDRESS);
        address marketContractAddress = marketProtocolProxy.getCurrentMarketContractAddress();
        MarketContract marketProtocol = MarketContract(marketContractAddress);

        address poolAddress = marketProtocol.COLLATERAL_POOL_ADDRESS();
        ERC20 collateralToken = ERC20(marketProtocol.COLLATERAL_TOKEN_ADDRESS());
        ERC20 longToken = ERC20(marketProtocol.LONG_POSITION_TOKEN());
        ERC20 shortToken = ERC20(marketProtocol.SHORT_POSITION_TOKEN());

        uint neededCollateral = MathLib.multiply(amount, marketProtocol.COLLATERAL_PER_UNIT());

        collateralToken.safeTransferFrom(from, address(this), neededCollateral);
        collateralToken.approve(poolAddress, neededCollateral);

        marketProtocolProxy.mintPositionTokens(amount);

        longToken.transfer(to, amount);
        shortToken.transfer(from, amount);

        // Transfer the fake token to trick 0x protocol
        // ERC20(tokenAddress).transfer(to, amount);

        // TODO: transfer ERC20 tokens (DAI) from the investor (taker) to the miner (maker)

        return BRIDGE_SUCCESS;
    }
}
