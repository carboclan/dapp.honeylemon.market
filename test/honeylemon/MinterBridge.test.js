const BigNumber = require('bignumber.js');
const { expectRevert, ether, time } = require('@openzeppelin/test-helpers');
const { getContractAddressesForChainOrThrow } = require('@0x/contract-addresses');

const MinterBridge = artifacts.require('MinterBridge');
const MarketContractProxy = artifacts.require('MarketContractProxy');
const CollateralToken = artifacts.require('CollateralToken'); // IMBTC

// Helper libraries
const {
  PayoutCalculator
} = require('../../honeylemon-intergration-tests/helpers/payout-calculator');

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

contract(
  'MinterBridge',
  ([owner, makerAddress, takerAddress, , , , , , _0xBridgeProxy, random]) => {
    let minterBridge, marketContractProxy, collateralToken, sToken, lToken;

    before(async () => {
      // get deployed MarketContractProxy
      marketContractProxy = await MarketContractProxy.deployed();
      // get deployed MinterBridge
      minterBridge = await MinterBridge.deployed();
      // get deployed collateral token
      collateralToken = await CollateralToken.deployed();
    });

    describe('Check deployment', () => {
      it('check Market Contract Proxy address', async () => {
        assert.equal(
          await minterBridge.MARKET_CONTRACT_PROXY_ADDRESS(),
          marketContractProxy.address,
          'market contract proxy address missmatch'
        );
      });
      it('check 0x Brdige Proxy address', async () => {
        assert.equal(
          (await minterBridge.ERC20_BRIDGE_PROXY_ADDRESS()).toLowerCase(),
          (getContractAddressesForChainOrThrow(await web3.eth.net.getId()).erc20BridgeProxy).toLowerCase(),
          '0x bridge proxy address missmatch'
        );
      });
    });

    describe('Set 0x Bridge Proxy address', async () => {
      it('should revert if the caller is not owner', async () => {
        await expectRevert.unspecified(
          minterBridge.set0xBridgeProxy(_0xBridgeProxy, { from: random })
        );
      });

      it('set 0x Bridge Proxy', async () => {
        await minterBridge.set0xBridgeProxy(_0xBridgeProxy, { from: owner });
        assert.equal(
          await minterBridge.ERC20_BRIDGE_PROXY_ADDRESS(),
          _0xBridgeProxy,
          '0x bridge proxy address missmatch'
        );
      });
    });

    describe('Mint positions tokens after 0x order fill', () => {
      const amount = '1';
      let neededCollateral;

      before(async () => {
        // Data store with historic MRI values
        const pc = new PayoutCalculator();

        let _currentMRI = new BigNumber(pc.getMRILookBackDataForDay(28)).multipliedBy(
          new BigNumber('100000000')
        );
        let _marketAndsTokenNames = [];
        _marketAndsTokenNames.push(web3.utils.fromAscii('BTC'));
        _marketAndsTokenNames.push(web3.utils.fromAscii('MRI-BTC-28D-00000000-Long'));
        _marketAndsTokenNames.push(web3.utils.fromAscii('MRI-BTC-28D-00000000-Short'));
        let _expiration = Math.round(new Date().getTime() / 1000) + 3600 * 24 * 28;

        // deploy Market
        await marketContractProxy.dailySettlement(
          '0',
          _currentMRI,
          _marketAndsTokenNames,
          _expiration
        );

        neededCollateral = await marketContractProxy.calculateRequiredCollateral(amount);
        await collateralToken.transfer(makerAddress, neededCollateral.toString());

        // approve token transfer from makerAddress
        await collateralToken.approve(
          minterBridge.address,
          new BigNumber(2).pow(256).minus(1),
          { from: makerAddress }
        );
      });

      // remove the comment below after merging the modifier PR
      /*it('should revert calling from an address other than the 0x Bridge Proxy', async () => {
      await expectRevert(
        minterBridge.bridgeTransferFrom(
          marketContractProxy.address,
          makerAddress,
          takerAddress,
          amount,
          '0x0000',
          { from: random }
        ),
        'invalid caller'
      );
    });*/

      it('should revert when market contract proxy address is zero', async () => {
        // set market proxy address to address zero
        await minterBridge.setMarketContractProxyAddress(ADDRESS_ZERO);

        await expectRevert(
          minterBridge.bridgeTransferFrom(
            marketContractProxy.address,
            makerAddress,
            takerAddress,
            amount,
            '0x0000',
            { from: _0xBridgeProxy }
          ),
          'MarketContractProxy not set'
        );
      });

      it('call bridgeTransferFrom', async () => {
        // reset market proxy address to address zero
        await minterBridge.setMarketContractProxyAddress(marketContractProxy.address);

        // call minter bridge
        await minterBridge.bridgeTransferFrom(
          marketContractProxy.address,
          makerAddress,
          takerAddress,
          amount,
          '0x0000',
          { from: _0xBridgeProxy }
        );
      });
    });
  }
);
