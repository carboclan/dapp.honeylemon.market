const BigNumber = require('bignumber.js');
const { expectRevert, ether, time } = require('@openzeppelin/test-helpers');

const MinterBridge = artifacts.require('MinterBridge');
const MarketContractProxy = artifacts.require('MarketContractProxy');
const CollateralToken = artifacts.require('CollateralToken'); // IMBTC
const PaymentToken = artifacts.require('PaymentToken'); // USDC
const MarketContractFactoryMPX = artifacts.require('MarketContractFactoryMPX');
const MarketContractMPX = artifacts.require('MarketContractMPX');
const PositionToken = artifacts.require('PositionToken'); // Long & Short tokens
const MarketCollateralPool = artifacts.require('MarketCollateralPool');

// Helper libraries
const { PayoutCalculator } = require('../../payout-calculator');

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

contract(
  'MarketContractProxy',
  ([honeyLemonOracle, makerAddress, takerAddress, , , , , , _0xBridgeProxy, random]) => {
    let minterBridge,
      marketContractProxy,
      imbtc,
      usdc,
      marketContractFactory,
      marketContractMPX,
      sToken,
      lToken,
      marketCollateralPool;

    before(async () => {
      // get deployed collateral token
      imbtc = await CollateralToken.deployed();
      // get deployed payment token
      usdc = await PaymentToken.deployed();
      // get deployed MarketContractFactoryMPX
      marketContractFactory = await MarketContractFactoryMPX.deployed();
      // get deployed MinterBridge
      minterBridge = await MinterBridge.deployed();
      // get deployed MarketContractProxy
      marketContractProxy = await MarketContractProxy.deployed();
    });

    describe('Check deployment config', () => {
      it('check honeylemon oracle address', async () => {
        assert.equal(
          await marketContractProxy.HONEY_LEMON_ORACLE_ADDRESS(),
          honeyLemonOracle,
          'Honeylemon oracle address mismatch'
        );
      });
      it('check 0x minter bridge address', async () => {
        assert.equal(
          await marketContractProxy.MINTER_BRIDGE_ADDRESS(),
          minterBridge.address,
          '0x minter bridge address mismatch'
        );
      });
      it('check collateral token address', async () => {
        assert.equal(
          await marketContractProxy.COLLATERAL_TOKEN_ADDRESS(),
          imbtc.address,
          'Collateral token address mismatch'
        );
      });
      it('check floor price', async () => {
        assert.equal(
          (await marketContractProxy.marketContractSpecs(0)).toString(),
          '0',
          'Floor price mismatch'
        );
      });
      it('check cap price', async () => {
        assert.equal(
          (await marketContractProxy.marketContractSpecs(1)).toString(),
          '0',
          'Cap price mismatch'
        );
      });
      it('check cap price', async () => {
        assert.equal(
          (await marketContractProxy.marketContractSpecs(2)).toString(),
          '8',
          'Price decimal places mismatch'
        );
      });
      it('check quantity multiplier', async () => {
        assert.equal(
          (await marketContractProxy.marketContractSpecs(3)).toString(),
          '1',
          'Qty multiplier places mismatch'
        );
      });
      it('check fee in basis points', async () => {
        assert.equal(
          (await marketContractProxy.marketContractSpecs(4)).toString(),
          '0',
          'Fee in basis points mismatch'
        );
      });
      it('check market fee in basis points', async () => {
        assert.equal(
          (await marketContractProxy.marketContractSpecs(5)).toString(),
          '0',
          'Market fee in basis points mismatch'
        );
      });
    });

    describe('Check permissions', async () => {
      it('should revert setting oracle address by non-owner', async () => {
        await expectRevert.unspecified(
          marketContractProxy.setOracleAddress(honeyLemonOracle, { from: random })
        );
      });
      it('should revert setting minter bridge address by non-owner', async () => {
        await expectRevert.unspecified(
          marketContractProxy.setMinterBridgeAddress(minterBridge.address, {
            from: random
          })
        );
      });
      it('should revert setting market contract specs by non-owner', async () => {
        await expectRevert.unspecified(
          marketContractProxy.setMarketContractSpecs([0, 0, 0, 0, 0, 0, 0], {
            from: random
          })
        );
      });
    });

    describe('deploy new market contract', async () => {
      const pc = new PayoutCalculator();
      const _currentMRI = new BigNumber(pc.getMRIDataForDay(0)).multipliedBy(
        new BigNumber('100000000')
      );
      const _expiration = Math.round(new Date().getTime() / 1000) + 3600 * 24 * 28;
      const _marketAndsTokenNames = [];
      _marketAndsTokenNames.push(web3.utils.fromAscii('BTC'));
      _marketAndsTokenNames.push(web3.utils.fromAscii('MRI-BTC-28D-00000000-Long'));
      _marketAndsTokenNames.push(web3.utils.fromAscii('MRI-BTC-28D-00000000-Short'));

      it('generate contract specs', async () => {
        let _capPrice = new BigNumber(28)
          .multipliedBy(_currentMRI)
          .multipliedBy(1.35e8)
          .dividedBy(1e8);
        let dailySpecs = await marketContractProxy.generateContractSpecs(
          _currentMRI,
          _expiration
        );

        assert.equal(
          _capPrice.precision(4).toString(),
          new BigNumber(dailySpecs[1].toString()).precision(4).toString(),
          'Cap price mismatch'
        );
        assert.equal(
          _expiration,
          dailySpecs[6].toString(),
          'Expiration timestamp mismatch'
        );
      });

      it('should revert deploying market contract from non-owner', async () => {
        await expectRevert.unspecified(
          marketContractProxy.deployContract(
            _currentMRI,
            _marketAndsTokenNames,
            _expiration,
            { from: random }
          )
        );
      });

      /*it('deploy market contract', async () => {
        let marketArrayBefore = await marketContractProxy.getAllMarketContracts();

        await marketContractProxy.deployContract(
          _currentMRI,
          _marketAndsTokenNames,
          _expiration
        );

        let marketArrayAfter = await marketContractProxy.getAllMarketContracts();


        assert.equal(marketArrayAfter.length-marketArrayBefore.length, 1, 'Market array length mismatch');
      });*/

      it('should revert daily settlement from address other than honeylemon oracle', async () => {
        await expectRevert.unspecified(
          marketContractProxy.dailySettlement(
            0,
            _currentMRI,
            _marketAndsTokenNames,
            _expiration,
            { from: random }
          )
        );
      });

      it('should revert daily settlement when passed MRI equal to zero', async () => {
        await expectRevert(
          marketContractProxy.dailySettlement(0, 0, _marketAndsTokenNames, _expiration, {
            from: honeyLemonOracle
          }),
          'Current MRI value cant be zero'
        );
      });

      it('daily settlement', async () => {
        await marketContractProxy.dailySettlement(
          0,
          _currentMRI,
          _marketAndsTokenNames,
          _expiration,
          { from: honeyLemonOracle }
        );

        assert.equal(
          (await marketContractProxy.getLatestMri()).toString(),
          _currentMRI,
          'latest MRI value mismatch'
        );
      });
    });
  }
);
