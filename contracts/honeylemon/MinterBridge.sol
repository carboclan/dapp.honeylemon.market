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

    MarketContractProxy marketContractProxy;

    // @dev Result of a successful bridge call.
    bytes4 internal constant BRIDGE_SUCCESS = 0xdc1600f3;
    address public MARKET_CONTRACT_PROXY_ADDRESS;
    address public ERC20_BRIDGE_PROXY_ADDRESS;

    function setMarketContractProxyAddress(address _marketContractProxyAddress)
        external
        onlyOwner
    {
        MARKET_CONTRACT_PROXY_ADDRESS = _marketContractProxyAddress;
        marketContractProxy = MarketContractProxy(MARKET_CONTRACT_PROXY_ADDRESS);
    }

    function set0xBridgeProxy(address _0xBridgeProxyAddress) external onlyOwner {
        ERC20_BRIDGE_PROXY_ADDRESS = _0xBridgeProxyAddress;
    }

    modifier only0xBridgeProxy() {
        require(msg.sender == ERC20_BRIDGE_PROXY_ADDRESS, 'invalid caller');
        _;
    }

    modifier onlyIfSetMarketContractProxy() {
        require(
            MARKET_CONTRACT_PROXY_ADDRESS != address(0),
            'MarketContractProxy not set'
        );
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
    ) external onlyIfSetMarketContractProxy returns (bytes4 success) {
        // The proxy acts as the taker token to make 0x think that the appropriate amount
        // was transferred and accept the trade as passing. Under the hood the  marketContractProxy
        // has minted long and short tokens and sent them to the the investor and miner.
        require(tokenAddress == MARKET_CONTRACT_PROXY_ADDRESS, 'bad proxy address');

        // (imBTC) sent from the miner
        ERC20 collateralToken = ERC20(marketContractProxy.COLLATERAL_TOKEN_ADDRESS());

        uint neededCollateral = marketContractProxy.calculateRequiredCollateral(amount);

        collateralToken.safeTransferFrom(from, address(this), neededCollateral);
        collateralToken.approve(MARKET_CONTRACT_PROXY_ADDRESS, neededCollateral);

        // to: long & taker (investor)
        // from: short & maker (miner)
        marketContractProxy.mintPositionTokens(amount, to, from, bridgeData);

        return BRIDGE_SUCCESS;
    }
}
