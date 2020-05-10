const BigNumber = require('bignumber.js');
const { expectRevert, ether, time } = require('@openzeppelin/test-helpers');

const MinterBridge = artifacts.require('MinterBridge');
const MarketContractProxy = artifacts.require('MarketContractProxy');
const CollateralToken = artifacts.require('CollateralToken'); // IMBTC
const PaymentToken = artifacts.require('PaymentToken'); // USDC
const MarketContractFactoryMPX = artifacts.require('MarketContractFactoryMPX');
const MarketContractMPX = artifacts.require('MarketContractMPX');
const MarketCollateralPool = artifacts.require('MarketCollateralPool');
const PositionToken = artifacts.require('PositionToken'); // Long & Short tokens

// Helper libraries
const { PayoutCalculator } = require('../../payout-calculator');

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

const checkContractToSettle = (contractsLength, contractDay) => {
  for (let i = 0; i < contractsLength; i++) {
    let contractPushed = i + 1;

    contractPushed <= 28
      ? console.log('not settling')
      : console.log('settling contract index: ', contractPushed - contractDay);
  }
};

const calculateCapPrice = (duration, mri) => {
  return new BigNumber(duration)
    .multipliedBy(mri)
    .multipliedBy(1.35e8)
    .dividedBy(1e8);
};

contract(
  'MarketContractProxy',
  ([honeyLemonOracle, makerAddress, takerAddress, , , , , , _0xBridgeProxy, random]) => {
    let minterBridge, marketContractProxy, imbtc, usdc, _currentMri, _expiration;

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

      const pc = new PayoutCalculator();
      _currentMri = new BigNumber(pc.getMRIDataForDay(0)).multipliedBy(
        new BigNumber(1e8)
      );
      _expiration = Math.round(new Date().getTime() / 1000) + 3600 * 24 * 28;
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
      const _marketAndsTokenNames = [];
      _marketAndsTokenNames.push(web3.utils.fromAscii('BTC'));
      _marketAndsTokenNames.push(web3.utils.fromAscii('MRI-BTC-28D-00000000-Long'));
      _marketAndsTokenNames.push(web3.utils.fromAscii('MRI-BTC-28D-00000000-Short'));

      it('generate contract specs', async () => {
        let _capPrice = calculateCapPrice(28, _currentMri);
        let dailySpecs = await marketContractProxy.generateContractSpecs(
          _currentMri,
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
            _currentMri,
            _marketAndsTokenNames,
            _expiration,
            { from: random }
          )
        );
      });

      /*it('deploy market contract', async () => {
        let marketArrayBefore = await marketContractProxy.getAllMarketContracts();

        await marketContractProxy.deployContract(
          _currentMri,
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
            _currentMri,
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
        let allMarketContractsBefore = await marketContractProxy.getAllMarketContracts();

        await marketContractProxy.dailySettlement(
          0,
          _currentMri,
          _marketAndsTokenNames,
          _expiration,
          { from: honeyLemonOracle }
        );

        let allMarketContractsAfter = await marketContractProxy.getAllMarketContracts();
        let latestMarket = await marketContractProxy.getLatestMarketContract();
        let marketCollateralPool = await (await MarketContractMPX.at(
          latestMarket
        )).COLLATERAL_POOL_ADDRESS();

        assert.equal(
          (await marketContractProxy.getLatestMri()).toString(),
          _currentMri,
          'latest MRI value mismatch'
        );
        assert.equal(
          allMarketContractsAfter.length - allMarketContractsBefore.length,
          1,
          'Market contracts array length mismatch'
        );
        assert.equal(
          await marketContractProxy.getLatestMarketContract(),
          allMarketContractsAfter[0],
          'Latest market contract address mismatch'
        );
        assert.equal(
          await marketContractProxy.getLatestMarketCollateralPool(),
          marketCollateralPool,
          'Latest market collateral pool address mismatch'
        );
      });
    });

    describe('Collateral requirement', () => {
      it('calculate required collateral', async () => {
        let amount = new BigNumber(100);
        let expectedCollateralRequirement = amount
          .multipliedBy(_currentMri)
          .multipliedBy(28)
          .multipliedBy(1.35);
        let collateralRequired = await marketContractProxy.calculateRequiredCollateral(
          amount.toString()
        );

        let absoluteDriftErrorNumerator = new BigNumber(collateralRequired).minus(
          new BigNumber(expectedCollateralRequirement)
        );
        let absoluteDriftError = absoluteDriftErrorNumerator
          .dividedBy(new BigNumber(expectedCollateralRequirement))
          .multipliedBy(new BigNumber(100))
          .absoluteValue();

        assert.equal(
          absoluteDriftError.lt(new BigNumber(0.001)),
          true,
          'collateral required mismatch'
        );
      });
    });

    describe('Mint positions token', () => {
      const amount = new BigNumber(100);
      let neededCollateral;

      before(async () => {
        // set minter bridge address (for testing purpose)
        await marketContractProxy.setMinterBridgeAddress(_0xBridgeProxy, {
          from: honeyLemonOracle
        });

        // calculate needed collateral token
        neededCollateral = await marketContractProxy.calculateRequiredCollateral(
          amount.toString()
        );
        await imbtc.transfer(_0xBridgeProxy, neededCollateral.toString());

        // approve token transfer from makerAddress
        await imbtc.approve(
          marketContractProxy.address,
          new BigNumber(2).pow(256).minus(1),
          { from: _0xBridgeProxy }
        );
      });

      it('should revert minting positions tokens if caller is not minter bridge contract', async () => {
        await expectRevert(
          marketContractProxy.mintPositionTokens(
            amount.toString(),
            takerAddress,
            makerAddress,
            '0x0000',
            { from: random }
          ),
          'Only Minter Bridge'
        );
      });

      it('mint positions tokens', async () => {
        // get market contract
        let latestMarketContractAddr = await marketContractProxy.getLatestMarketContract();
        let latestMarketContract = await MarketContractMPX.at(latestMarketContractAddr);
        // get market collateral pool
        let latestMarketCollateralPoolAddr = await marketContractProxy.getLatestMarketCollateralPool();
        let marketCollateralPool = await MarketCollateralPool.at(
          latestMarketCollateralPoolAddr
        );
        // get long & short token
        let lToken = await PositionToken.at(
          await latestMarketContract.LONG_POSITION_TOKEN()
        );
        let sToken = await PositionToken.at(
          await latestMarketContract.SHORT_POSITION_TOKEN()
        );

        let makerLongTokenBalanceBefore = new BigNumber(
          (await lToken.balanceOf(makerAddress)).toString()
        );
        let takerLongTokenBalanceBefore = new BigNumber(
          (await lToken.balanceOf(takerAddress)).toString()
        );
        let makerShortTokenBalanceBefore = new BigNumber(
          (await sToken.balanceOf(makerAddress)).toString()
        );
        let takerShortTokenBalanceBefore = new BigNumber(
          (await sToken.balanceOf(takerAddress)).toString()
        );

        await marketContractProxy.mintPositionTokens(
          amount.toString(),
          takerAddress,
          makerAddress,
          '0x0000',
          { from: _0xBridgeProxy }
        );

        assert.equal(
          new BigNumber((await lToken.balanceOf(makerAddress)).toString())
            .minus(makerLongTokenBalanceBefore)
            .toString(),
          0,
          'Miner long token balance mismatch'
        );
        assert.equal(
          new BigNumber((await lToken.balanceOf(takerAddress)).toString())
            .minus(takerLongTokenBalanceBefore)
            .toString(),
          amount.toString(),
          'Investor long token balance mismatch'
        );
        assert.equal(
          new BigNumber((await sToken.balanceOf(makerAddress)).toString())
            .minus(makerShortTokenBalanceBefore)
            .toString(),
          amount.toString(),
          'Miner short token balance mismatch'
        );
        assert.equal(
          new BigNumber((await sToken.balanceOf(takerAddress)).toString())
            .minus(takerShortTokenBalanceBefore)
            .toString(),
          0,
          'Investor short token balance mismatch'
        );
        assert.equal(
          (await imbtc.balanceOf(marketCollateralPool.address)).toString(),
          neededCollateral.toString(),
          'Market collateral pool balance mismatch'
        );
      });
    });

    describe('Contract settlement', () => {});
  }
);
