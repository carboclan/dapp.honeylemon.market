pragma solidity 0.5.2;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "../marketprotocol/MarketContract.sol";
import "../marketprotocol/MarketCollateralPool.sol";
import "../marketprotocol/tokens/PositionToken.sol";


contract Utils {
    function redeemPositionTokens(address marketContractAddress, uint256 qtyToRedeem)
        public
    {
        MarketContract marketContract = MarketContract(marketContractAddress);
        MarketCollateralPool marketCollateralPool = MarketCollateralPool(
            marketContract.COLLATERAL_POOL_ADDRESS()
        );
        PositionToken long = PositionToken(marketContract.LONG_POSITION_TOKEN());
        PositionToken short = PositionToken(marketContract.SHORT_POSITION_TOKEN());

        // approve tokens
        long.approve(address(marketContract), qtyToRedeem);
        short.approve(address(marketContract), qtyToRedeem);

        // redeem
        marketCollateralPool.redeemPositionTokens(marketContractAddress, qtyToRedeem);

        // Finally redeem collateral back to user.
        IERC20 collateralToken = IERC20(marketContract.COLLATERAL_TOKEN_ADDRESS());

        // DSProxy balance. address(this) is the DSProxy contract address that will redeem the tokens.
        uint256 dSProxyBalance = collateralToken.balanceOf(address(this));

        // Move all redeemed tokens from DSProxy back to users wallet. msg.sender is the owner of the DSProxy.
        collateralToken.transfer(msg.sender, dSProxyBalance);
    }
}
