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

const isMarketExpired = (contractIndex, contractDay) => {
  return contractIndex < contractDay ? false : true;
};

const calculateCapPrice = (duration, mri) => {
  return new BigNumber(duration)
    .multipliedBy(mri)
    .multipliedBy(1.35e8)
    .dividedBy(1e8);
};

const calculateExpectedCollateralToReturn = (
  priceFloor,
  priceCap,
  qtyMultiplier,
  longQty,
  shortQty,
  price
) => {
  let neededCollateral = 0,
    maxLoss;

  if (longQty > 0) {
    // calculate max loss from entry price to floor
    if (price <= priceFloor) {
      maxLoss = 0;
    } else {
      maxLoss = price.minus(priceFloor);
    }
    neededCollateral = maxLoss.multipliedBy(longQty).multipliedBy(qtyMultiplier);
  }

  if (shortQty > 0) {
    // calculate max loss from entry price to ceiling;
    if (price >= priceCap) {
      maxLoss = 0;
    } else {
      maxLoss = priceCap.minus(price);
    }

    maxLoss == 0
      ? (neededCollateral = new BigNumber(0))
      : (neededCollateral = maxLoss.multipliedBy(shortQty).multipliedBy(qtyMultiplier));
  }

  return neededCollateral;
};

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

contract(
  'MarketContractProxy',
  ([honeyLemonOracle, makerAddress, takerAddress, , , , , , _0xBridgeProxy, random]) => {
    let minterBridge, marketContractProxy, imbtc, usdc, pc, _currentMri, _expiration;

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

      pc = new PayoutCalculator();
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
          marketContractProxy.dailySettlement(
            '0',
            _currentMri,
            _marketAndsTokenNames,
            _expiration,
            { from: random }
          )
        );
      });

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

    describe('Contract settlement', () => {
      before(async () => {
        // deploy 27 more contract to get expired ones
        let targetLength = new BigNumber(
          await marketContractProxy.CONTRACT_DURATION_DAYS()
        ).toFixed();
        let currentLength = (await marketContractProxy.getAllMarketContracts()).length;

        for (let i = 0; i < targetLength - currentLength; i++) {
          let _marketAndsTokenNames = [];
          _marketAndsTokenNames.push(web3.utils.fromAscii('BTC'));
          _marketAndsTokenNames.push(web3.utils.fromAscii('MRI-BTC-28D-00000000-Long'));
          _marketAndsTokenNames.push(web3.utils.fromAscii('MRI-BTC-28D-00000000-Short'));
          let _mri = new BigNumber(pc.getMRIDataForDay(i + 1)).multipliedBy(
            new BigNumber(1e8)
          );
          let _expiration = Math.round(new Date().getTime() / 1000) + 3600 * 24 * 28;

          marketContractProxy.dailySettlement(
            _mri,
            _mri,
            _marketAndsTokenNames,
            _expiration,
            { from: honeyLemonOracle }
          );
        }

        assert.equal(
          new BigNumber(await marketContractProxy.CONTRACT_DURATION_DAYS()).toFixed(),
          targetLength,
          'market length mismatch'
        );
      });

      describe('case: latestMri > PRICE_CAP', async () => {
        it('deploy new contract and settle contract #1: case Mri > PRICE_CAP', async () => {
          let marketsContracts = await marketContractProxy.getAllMarketContracts();
          assert.equal(
            (await marketContractProxy.getExpiringMarketContract()).toString(),
            marketsContracts[0],
            'expiring market contract mismatch'
          );

          // deploy new contract & settle first market contract
          let _marketAndsTokenNames = [];
          _marketAndsTokenNames.push(web3.utils.fromAscii('BTC'));
          _marketAndsTokenNames.push(web3.utils.fromAscii('MRI-BTC-28D-00000000-Long'));
          _marketAndsTokenNames.push(web3.utils.fromAscii('MRI-BTC-28D-00000000-Short'));
          let _loopbackMri = new BigNumber(1).multipliedBy(new BigNumber(1e8));
          let _mri = new BigNumber(pc.getMRIDataForDay(29)).multipliedBy(
            new BigNumber(1e8)
          );
          let _expiration = Math.round(new Date().getTime() / 1000) + 3600 * 24 * 28;

          marketContractProxy.dailySettlement(
            _loopbackMri,
            _mri,
            _marketAndsTokenNames,
            _expiration,
            { from: honeyLemonOracle }
          );

          let marketContractMpx = await MarketContractMPX.at(marketsContracts[0]);

          assert.equal(
            (await marketContractMpx.lastPrice()).toString(),
            _loopbackMri.toString(),
            'last MRI value mismatch'
          );
          assert.isAbove(
            (await marketContractMpx.lastPrice()).toNumber(),
            (await marketContractMpx.PRICE_CAP()).toNumber(),
            'latest pushed MRI is not above price cap'
          );
          assert.equal(
            await marketContractMpx.isSettled(),
            true,
            'market contract did not settle when latest MRI above price cap'
          );
        });

        it('redeem long&short token', async () => {
          let marketsContracts = await marketContractProxy.getAllMarketContracts();
          let marketContractMpx = await MarketContractMPX.at(marketsContracts[0]);

          const amount = new BigNumber(100);
          // get market pool
          let marketCollateralPoolAddr = await marketContractMpx.COLLATERAL_POOL_ADDRESS();
          let marketContractPool = await MarketCollateralPool.at(
            marketCollateralPoolAddr
          );
          // get long & short token
          let lToken = await PositionToken.at(
            await marketContractMpx.LONG_POSITION_TOKEN()
          );
          let sToken = await PositionToken.at(
            await marketContractMpx.SHORT_POSITION_TOKEN()
          );
          // approve token transfer
          await lToken.approve(marketContractMpx.address, amount, {
            from: takerAddress
          });
          await sToken.approve(marketContractMpx.address, amount, {
            from: makerAddress
          });

          let makerImbtcBalanceBefore = new BigNumber(
            (await imbtc.balanceOf(makerAddress)).toString()
          );
          let takerImbtcBalanceBefore = new BigNumber(
            (await imbtc.balanceOf(takerAddress)).toString()
          );

          // miner & investor redeem
          await marketContractPool.settleAndClose(marketContractMpx.address, amount, 0, {
            from: takerAddress
          });
          await marketContractPool.settleAndClose(marketContractMpx.address, 0, amount, {
            from: makerAddress
          });

          let makerImbtcBalanceAfter = new BigNumber(
            (await imbtc.balanceOf(makerAddress)).toString()
          );
          let takerImbtcBalanceAfter = new BigNumber(
            (await imbtc.balanceOf(takerAddress)).toString()
          );
          let expectedMakerReturnedCollateral = calculateExpectedCollateralToReturn(
            new BigNumber((await marketContractMpx.PRICE_FLOOR()).toString()),
            new BigNumber((await marketContractMpx.PRICE_CAP()).toString()),
            new BigNumber((await marketContractMpx.QTY_MULTIPLIER()).toString()),
            new BigNumber(0),
            amount,
            new BigNumber((await marketContractMpx.settlementPrice()).toString())
          );
          let expectedTakerReturnedCollateral = calculateExpectedCollateralToReturn(
            new BigNumber((await marketContractMpx.PRICE_FLOOR()).toString()),
            new BigNumber((await marketContractMpx.PRICE_CAP()).toString()),
            new BigNumber((await marketContractMpx.QTY_MULTIPLIER()).toString()),
            amount,
            new BigNumber(0),
            new BigNumber((await marketContractMpx.settlementPrice()).toString())
          );

          assert.equal(
            makerImbtcBalanceAfter.minus(makerImbtcBalanceBefore).toString(),
            expectedMakerReturnedCollateral.toString(),
            'maker returned collateral mismatch'
          );
          assert.equal(
            takerImbtcBalanceAfter.minus(takerImbtcBalanceBefore).toString(),
            expectedTakerReturnedCollateral.toString(),
            'taker returned collateral mismatch'
          );
        });
      });
    });
  }
);
