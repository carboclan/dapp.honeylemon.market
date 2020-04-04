pragma solidity 0.5.2;

import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

import "../libraries/MathLib.sol";

import '../MarketCollateralPool.sol';
import '../mpx/MarketContractMPX.sol';
import '../tokens/PositionToken.sol';


contract MinterBridge {
    using MathLib for uint;
    using MathLib for int;
    using SafeERC20 for ERC20;

    // @dev Result of a successful bridge call.
    bytes4 constant internal BRIDGE_SUCCESS = 0xdc1600f3;
    address public MARKET_CONTRACT_ADDRESS;


    constructor(address marketContractAddress) public
    {
        MARKET_CONTRACT_ADDRESS = marketContractAddress;
    }

    /// @dev Transfers `amount` of the ERC20 `tokenAddress` from `from` to `to`.
    /// @param tokenAddress The address of the ERC20 token to transfer.
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
    )
        external
        returns (bytes4 success)
    {
        MarketContract marketContract = MarketContract(MARKET_CONTRACT_ADDRESS);
        address poolAddress = marketContract.COLLATERAL_POOL_ADDRESS();
        address collateralTokenAddress = marketContract.COLLATERAL_TOKEN_ADDRESS();
        address longAddress = marketContract.LONG_POSITION_TOKEN();
        address shortAddress = marketContract.SHORT_POSITION_TOKEN();

        uint neededCollateral = MathLib.multiply(amount, marketContract.COLLATERAL_PER_UNIT());

        ERC20(collateralTokenAddress).safeTransferFrom(from, address(this), neededCollateral);
        ERC20(collateralTokenAddress).approve(poolAddress, neededCollateral);
        MarketCollateralPool(poolAddress).mintPositionTokens(MARKET_CONTRACT_ADDRESS, amount, false);
        PositionToken(longAddress).transfer(to, amount);
        PositionToken(shortAddress).transfer(from, amount);

        // Transfer the fake token to trick 0x protocol
        ERC20(tokenAddress).transfer(to, amount);

        return BRIDGE_SUCCESS;
    }
}