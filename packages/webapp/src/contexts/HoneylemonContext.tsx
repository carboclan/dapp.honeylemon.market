import * as React from "react";
import Web3 from 'web3'
import { useState, useEffect } from "react";
import { MetamaskSubprovider, Web3JsProvider } from '@0x/subproviders';
import { HoneylemonService, OrderbookService, COLLATERAL_TOKEN_DECIMALS, PAYMENT_TOKEN_DECIMALS } from "@honeylemon/honeylemonjs/lib/src";
import { useOnboard } from "./OnboardContext";
import { ethers } from 'ethers';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { BigNumber } from "@0x/utils";
import { networkName } from "../helpers/ethereumNetworkUtils";

dayjs.extend(utc);

enum TokenType {
  CollateralToken,
  PaymentToken
}

enum PositionType {
  Long = 'Long',
  Short = 'Short'
}

export enum PositionStatus {
  active = 'Active',
  expiredAwaitingSettlement = 'Expired Awaiting Settlement',
  withdrawalPending = 'Withdrawal Pending',
  withdrawn = 'Withdrawn'
}

const COLLATERAL_TOKEN_NAME = process.env.REACT_APP_COLLATERAL_TOKEN_NAME || 'imBTC';
const PAYMENT_TOKEN_NAME = process.env.REACT_APP_PAYMENT_TOKEN_NAME || 'USDT';
const CONTRACT_COLLATERAL_RATIO = Number(process.env.REACT_APP_CONTRACT_COLLATERAL_RATIO) || 1.25;

type OrderSummary = {
  price: number,
  quantity: number,
};

export type HoneylemonContext = {
  honeylemonService: HoneylemonService;
  orderbookService: OrderbookService;
  collateralTokenBalance: number;
  collateralTokenAllowance: number;
  COLLATERAL_TOKEN_DECIMALS: number;
  COLLATERAL_TOKEN_NAME: string;
  paymentTokenBalance: number;
  paymentTokenAllowance: number;
  PAYMENT_TOKEN_DECIMALS: number;
  PAYMENT_TOKEN_NAME: string;
  CONTRACT_DURATION: number;
  isDsProxyDeployed: boolean;
  dsProxyAddress: string;
  CONTRACT_COLLATERAL_RATIO: number;
  isDailyContractDeployed: boolean;
  marketData: {
    miningContracts: Array<any>;
    currentMRI: number;
    currentBTCSpotPrice: number;
    btcDifficultyAdjustmentDate: Date;
  }
  portfolioData: {
    openOrdersMetadata: Array<OpenOrderMetadata>;
    openOrders: { [orderHash: string]: OpenOrder } | undefined;
    activeLongPositions: Array<any>;
    activeShortPositions: Array<any>;
    expiredLongPositions: Array<any>;
    expiredShortPositions: Array<any>;
  }
  orderbook: Array<OrderSummary>;
  btcStats: any,
  isPortfolioRefreshing: boolean;
  deployDSProxyContract(): Promise<void>;
  approveToken(tokenType: TokenType, amount?: number): Promise<void>;
  refreshPortfolio(): Promise<void>;
};

export type HoneylemonProviderProps = {
  children: React.ReactNode;
};

export type OpenOrderMetadata = {
  orderHash: string,
  remainingFillableMakerAssetAmount: number,
  price: BigNumber
  //TODO: update to use types once definitions have been added
}

export type OpenOrder = {
  makerAddress: string;
  takerAddress: string;
  feeRecipientAddress: string;
  senderAddress: string;
  makerAssetAmount: BigNumber;
  takerAssetAmount: BigNumber;
  makerFee: BigNumber;
  takerFee: BigNumber;
  expirationTimeSeconds: BigNumber;
  expirationDate: Date,
  listingDate: Date,
  salt: BigNumber;
  makerAssetData: string;
  takerAssetData: string;
  makerFeeAssetData: string;
  takerFeeAssetData: string;
}

export type ContractDetails = {
  instrumentName: string,
  duration: number,
  startDate: Date,
  expirationDate: Date,
  settlementDate: Date,
  type: PositionType,
}

const HoneylemonContext = React.createContext<HoneylemonContext | undefined>(undefined);

const HoneylemonProvider = ({ children }: HoneylemonProviderProps) => {
  const { wallet, network, isReady, address, notify } = useOnboard();

  const [honeylemonService, setHoneylemonService] = useState<any | undefined>(undefined);
  const [orderbookService, setOrderbookService] = useState<any | undefined>(undefined);
  const [collateralTokenBalance, setCollateralTokenBalance] = useState<number>(0);
  const [collateralTokenAllowance, setCollateralTokenAllowance] = useState<number>(0);
  const [paymentTokenBalance, setPaymentTokenBalance] = useState<number>(0);
  const [paymentTokenAllowance, setPaymentTokenAllowance] = useState<number>(0);
  const [isDsProxyDeployed, setIsDsProxyDeployed] = useState<boolean>(false);
  const [dsProxyAddress, setDsProxyAddress] = useState<string>('');
  const [miningContracts, setMiningContracts] = useState<Array<any>>([]);
  const [currentMRI, setCurrentMRI] = useState(0);
  const [currentBTCSpotPrice, setCurrentBTCSpotPrice] = useState(0);
  const [btcDifficultyAdjustmentDate, setBtcDifficultyAdjustmentDate] = useState(new Date());
  const [btcStats, setBtcStats] = useState<any>(undefined);
  const [openOrdersMetadata, setOpenOrdersMetadata] = useState<Array<OpenOrderMetadata>>([]);
  const [openOrders, setOpenOrders] = useState<{ [orderHash: string]: OpenOrder } | undefined>()
  const [activeLongPositions, setActiveLongPositions] = useState([]);
  const [activeShortPositions, setActiveShortPositions] = useState([]);
  const [expiredLongPositions, setExpiredLongPositions] = useState([]);
  const [expiredShortPositions, setExpiredShortPositions] = useState([]);
  const [isPortfolioRefreshing, setIsPortfolioRefreshing] = useState(false);
  const [isDailyContractDeployed, setIsDailyContractDeployed] = useState(false);
  const [orderbook, setOrderbook] = useState([]);
  const [contractDuration, setContractDuration] = useState(0);

  const deployDSProxyContract = async () => {
    try {
      const dsProxyAddress = await honeylemonService.deployDSProxyContract(address);
      setIsDsProxyDeployed(true);
      setDsProxyAddress(dsProxyAddress);
    } catch (error) {
      console.log('Something went wrong deploying the DS Proxy wallet');
      console.log(error);
      throw new Error('Something went wrong deploying the honeylemon vault. Please try again.')
    }
  }

  const approveToken = async (tokenType: TokenType, amount?: number): Promise<void> => {
    try {
      switch (tokenType) {
        case TokenType.CollateralToken:
          await honeylemonService.approveCollateralToken(address, amount);
          const collateral = await honeylemonService.getCollateralTokenAmounts(address);
          setCollateralTokenAllowance(Number(collateral.allowance.shiftedBy(-COLLATERAL_TOKEN_DECIMALS).toString()));
          setCollateralTokenBalance(Number(collateral.balance.shiftedBy(-COLLATERAL_TOKEN_DECIMALS).toString()));
          break;
        case TokenType.PaymentToken:
          await honeylemonService.approvePaymentToken(address, amount);
          const payment = await honeylemonService.getPaymentTokenAmounts(address);
          setCollateralTokenAllowance(Number(payment.allowance.shiftedBy(-PAYMENT_TOKEN_DECIMALS).toString()));
          setCollateralTokenBalance(Number(payment.balance.shiftedBy(-PAYMENT_TOKEN_DECIMALS).toString()));
          break;
        default:
          break;
      }
    } catch (error) {
      console.log('Something went wrong approving the tokens');
      console.log(error);
      const errorMessage = tokenType === TokenType.CollateralToken ?
        `${COLLATERAL_TOKEN_NAME} approval failed. Please try again later.` :
        `${PAYMENT_TOKEN_NAME} approval failed. Please try again later.`

      throw Error(errorMessage)
    }
  }

  const parseContractName = (contractName: string): ContractDetails => {
    const [indexType, collateralInstrument, durationString, startDate, position] = contractName.split('-');
    const duration = Number(durationString.replace('D', ''));
    return {
      instrumentName: `${indexType}-${collateralInstrument}`,
      type: (position === 'long') ? PositionType.Long : PositionType.Short,
      startDate: dayjs(startDate).startOf('day').utc().toDate(), //This will always be UTC 00:00 the date the contract was concluded
      expirationDate: dayjs(startDate).startOf('day').utc().add(duration, 'd').toDate(),
      settlementDate: dayjs(startDate).startOf('day').utc().add(duration + 1, 'd').toDate(),
      duration,
    }
  }

  const getPositionStatus = (position: any): PositionStatus => {
    if (!position?.contract.settlement) {
      return PositionStatus.active;
    } else {
      if (!position.isRedeemed && !position.canRedeem) return PositionStatus.expiredAwaitingSettlement;
      if (!position.isRedeemed && position.canRedeem) return PositionStatus.withdrawalPending;
      return PositionStatus.withdrawn;
    }
  }

  const getPorfolio = async () => {
    try {
      setIsPortfolioRefreshing(true);
      const openOrdersRes = await honeylemonService.getOpenOrders(address);
      setOpenOrdersMetadata(openOrdersRes.records.map((openOrder: any) => openOrder.metaData))
      setOpenOrders(Object.fromEntries(
        openOrdersRes.records.map(((openOrder: any) => [openOrder.metaData.orderHash, {
          ...openOrder.order,
          expirationDate: dayjs(openOrder.order.expirationTimeSeconds.toNumber() * 1000).toDate(),
          listingDate: dayjs(openOrder.order.expirationTimeSeconds.toNumber() * 1000).subtract(10, 'd').toDate()
        }]))
      ));
      const positions = await honeylemonService.getPositions(address);
      const allPositions = positions.longPositions.map((lp: any) => ({
        ...lp,
        contractName: lp.contractName + '-long',
      })).concat(positions.shortPositions.map((sp: any) => ({
        ...sp,
        contractName: sp.contractName + '-short',
      }))).map((p: any) => {
        return {
          ...p,
          daysToExpiration: Math.ceil(dayjs(p.contract.expiration * 1000).diff(dayjs(), 'd', true)),
          pendingReward: Number(p.pendingReward?.shiftedBy(-COLLATERAL_TOKEN_DECIMALS).toString()) || 0,
          finalReward: Number(p.finalReward?.shiftedBy(-COLLATERAL_TOKEN_DECIMALS).toString()) || 0,
          totalCost: Number(new BigNumber(p.price).multipliedBy(p.qtyToMint).toString()),
          totalCollateralLocked: Number(new BigNumber(p.contract.collateralPerUnit).multipliedBy(p.qtyToMint).shiftedBy(-COLLATERAL_TOKEN_DECIMALS).toString()),
          ...parseContractName(p.contractName),
          status: getPositionStatus(p),
        }
      });

      const newActiveLongPositions = allPositions.filter((p: any) => p.status === PositionStatus.active && p.type === PositionType.Long)
      setActiveLongPositions(newActiveLongPositions);

      const newActiveShortPositions = allPositions.filter((p: any) => p.status === PositionStatus.active && p.type === PositionType.Short)
      setActiveShortPositions(newActiveShortPositions);

      const newExpiredLongPositions = allPositions.filter((p: any) => p.status !== PositionStatus.active && p.type === PositionType.Long)
      setExpiredLongPositions(newExpiredLongPositions);

      const newExpiredShortPositions = allPositions.filter((p: any) => p.status !== PositionStatus.active && p.type === PositionType.Short)
      setExpiredShortPositions(newExpiredShortPositions);
    } catch (error) {
      console.log('There was an error getting the market data')
    } finally {
      setIsPortfolioRefreshing(false);
    }
  }

  // Instantiate honeylemon service and get all initial user data
  useEffect(() => {
    if (isReady && wallet && network && address) {
      const initHoneylemonService = async () => {
        let wrappedSubprovider;
        const web3 = new Web3(wallet.provider)
        switch (wallet.name) {
          case 'MetaMask':
            wrappedSubprovider = new MetamaskSubprovider(web3.currentProvider as Web3JsProvider);
            break;
          default:
            wrappedSubprovider = new MetamaskSubprovider(web3.currentProvider as Web3JsProvider);
        }

        const honeylemonService = new HoneylemonService(
          process.env.REACT_APP_SRA_URL,
          process.env.REACT_APP_SUBGRAPH_URL,
          wrappedSubprovider,
          network,
          process.env.REACT_APP_MINTER_BRIDGE_ADDRESS,
          process.env.REACT_APP_MARKET_CONTRACT_PROXY_ADDRESS,
          process.env.REACT_APP_COLLATERAL_TOKEN_ADDRESS,
          process.env.REACT_APP_PAYMENT_TOKEN_ADDRESS,
          Number(process.env.REACT_APP_CONTRACT_DURATION),
        );
        setHoneylemonService(honeylemonService);
        setContractDuration(honeylemonService.contractDuration);
        const collateral = await honeylemonService.getCollateralTokenAmounts(address);
        setCollateralTokenAllowance(Number(collateral.allowance.shiftedBy(-8).toString()));
        setCollateralTokenBalance(Number(collateral.balance.shiftedBy(-8).toString()));
        const payment = await honeylemonService.getPaymentTokenAmounts(address);
        setPaymentTokenAllowance(Number(payment.allowance.shiftedBy(-6).toString()));
        setPaymentTokenBalance(Number(payment.balance.shiftedBy(-6).toString()));
        const proxyDeployed: boolean = await honeylemonService.addressHasDSProxy(address)
        setIsDsProxyDeployed(proxyDeployed);
        if (proxyDeployed) {
          const proxyAddress = await honeylemonService.getDSProxyAddress(address);
          setDsProxyAddress(proxyAddress);
        }
        const isContractDeployed = await honeylemonService.isDailyContractDeployed();
        setIsDailyContractDeployed(isContractDeployed);
        if (address && notify) {
          const { emitter } = notify.account(address);
          const etherscanUrl = (network === 1) ? 'https://etherscan.io' : `https://${networkName(network)}.etherscan.io`
          emitter.on('all', tx => ({
            onclick: () => window.open(`https://${etherscanUrl}/tx/${tx.hash}`) // TODO: update this to work on other networks
          }))
        }
      };
      initHoneylemonService();

      return () => {
        setHoneylemonService(undefined);
        setCollateralTokenAllowance(0)
        setCollateralTokenBalance(0);
        setPaymentTokenAllowance(0);
        setPaymentTokenBalance(0);
        setIsDsProxyDeployed(false);
        setDsProxyAddress('');
        notify?.unsubscribe(address || "0x");
      }
    }
  }, [wallet, network, isReady, address]);

  // Instantiate Orderbook service
  useEffect(() => {
    const initOrderbookService = async () => {
      const orderbookServiceInstance = new OrderbookService(
        process.env.REACT_APP_SRA_URL,
        process.env.REACT_APP_MINTER_BRIDGE_ADDRESS,
        process.env.REACT_APP_MARKET_CONTRACT_PROXY_ADDRESS,
        process.env.REACT_APP_PAYMENT_TOKEN_ADDRESS,
      );
      setOrderbookService(orderbookServiceInstance);
    }
    initOrderbookService();
  }, []);

  // Order book poller
  useEffect(() => {
    const getOrderbookData = async () => {
      if (orderbookService) {
        try {
          const orderbookResponse = await orderbookService.getOrderbook();
          const book = orderbookResponse.asks.records
            .filter((order: any) => new BigNumber(order.metaData.remainingFillableMakerAssetAmount).gt(0))
            .map((order: any) => ({
              price: Number(new BigNumber(order.metaData.price).dividedBy(contractDuration).toString()),
              quantity: Number(new BigNumber(order.metaData.remainingFillableMakerAssetAmount).toString())
            }));
          setOrderbook(book)
        } catch (error) {
          console.log('There was an error getting the orderbook.')
          console.log(error);
        }
      }
    }

    let poller: NodeJS.Timeout;
    getOrderbookData();
    poller = setInterval(getOrderbookData, 30000);

    return () => {
      clearInterval(poller);
    }
  }, [orderbookService, contractDuration])


  // Market Data Poller
  useEffect(() => {
    const getMarketData = async () => {
      try {
        const marketDataApiUrl = process.env.REACT_APP_MARKET_DATA_API_URL;
        if (marketDataApiUrl) {
          const { contracts } = await (await fetch(`${marketDataApiUrl}/blockchain/agg?coin=BTC`)).json();
          const stats = await (await fetch(`${marketDataApiUrl}/blockchain/stats`)).json();
          setMiningContracts(contracts);
          setCurrentBTCSpotPrice(stats.quote?.price);
          setCurrentMRI(stats.mri);
          setBtcStats(stats);
        }
      } catch (error) {
        console.log('There was an error getting the market data')
      }
    }

    let poller: NodeJS.Timeout;
    getMarketData();
    poller = setInterval(getMarketData, 30000);

    return () => {
      clearInterval(poller);
    }
  }, [])

  // Portfolio Data Poller
  useEffect(() => {
    let poller: NodeJS.Timeout;

    const getPortfolioData = async () => {
      if (!isPortfolioRefreshing) {
        await getPorfolio();
      }
    }

    if (honeylemonService && address) {
      getPortfolioData();
      poller = setInterval(getPortfolioData, 30000);
    }
    return () => {
      clearInterval(poller);
    }
  }, [honeylemonService, address])

  // Difficulty Adjustment Date
  useEffect(() => {
    const getDifficultyAdjustmentDate = async () => {
      try {
        const btcStatsUrl = process.env.REACT_APP_BTC_STATS_URL;
        if (btcStatsUrl) {
          const { currentBlockHeight, avgBlockTime } = await (await fetch(btcStatsUrl)).json()
          const currentEpochBlocks = currentBlockHeight % 2016;
          const remainingEpochTime = (2016 - currentEpochBlocks) * avgBlockTime;
          const date = dayjs().add(remainingEpochTime, 's');
          setBtcDifficultyAdjustmentDate(date.toDate());
        }
      } catch (error) {
        console.log('Error getting next difficulty adjustment date');
      }
    }
    getDifficultyAdjustmentDate()
  }, [])

  // Transfer & Approval event listeners for Payment & Collateral Tokens
  useEffect(() => {
    const checkBalancesAndApprovals = async () => {
      const collateral = await honeylemonService.getCollateralTokenAmounts(address);
      setCollateralTokenAllowance(Number(collateral.allowance.shiftedBy(-8).toString()));
      setCollateralTokenBalance(Number(collateral.balance.shiftedBy(-8).toString()));
      const payment = await honeylemonService.getPaymentTokenAmounts(address);
      setPaymentTokenAllowance(Number(payment.allowance.shiftedBy(-6).toString()));
      setPaymentTokenBalance(Number(payment.balance.shiftedBy(-6).toString()));
    }
    if (honeylemonService && address) {
      checkBalancesAndApprovals();

      const erc20Abi = [
        "function transfer(address to, uint256 value) returns (bool)",
        "function approve(address spender, uint256 value) returns (bool)",
        "function transferFrom(address from, address to, uint256 value) returns (bool)",
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address who) view returns (uint256)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "event Transfer(address indexed from, address indexed to, uint256 value)",
        "event Approval(address indexed owner, address indexed spender, uint256 value)",
      ]

      let provider = new ethers.providers.Web3Provider(honeylemonService.provider);
      const paymentTokenContractAddress = honeylemonService.paymentTokenAddress;
      const paymentTokenContract = new ethers.Contract(paymentTokenContractAddress, erc20Abi, provider);
      const filterPaymentTokenApproval = paymentTokenContract.filters.Approval(address);
      const transferPaymentTokenFrom = paymentTokenContract.filters.Transfer(address, null, null);
      const transferPaymentTokenTo = paymentTokenContract.filters.Transfer(null, address, null);
      paymentTokenContract.on(filterPaymentTokenApproval, () => checkBalancesAndApprovals())
      paymentTokenContract.on(transferPaymentTokenFrom, () => checkBalancesAndApprovals())
      paymentTokenContract.on(transferPaymentTokenTo, () => checkBalancesAndApprovals())

      const collateralTokenContractAddress = honeylemonService.collateralTokenAddress;
      const collateralTokenContract = new ethers.Contract(collateralTokenContractAddress, erc20Abi, provider);
      const filterCollateralTokenApproval = collateralTokenContract.filters.Approval(address);
      const transferCollateralTokenFrom = collateralTokenContract.filters.Transfer(address, null, null);
      const transferCollateralTokenTo = collateralTokenContract.filters.Transfer(null, address, null);

      collateralTokenContract.on(filterCollateralTokenApproval, () => checkBalancesAndApprovals())
      collateralTokenContract.on(transferCollateralTokenFrom, () => checkBalancesAndApprovals())
      collateralTokenContract.on(transferCollateralTokenTo, () => checkBalancesAndApprovals())
      return () => {
        paymentTokenContract.removeAllListeners(filterPaymentTokenApproval)
        paymentTokenContract.removeAllListeners(transferPaymentTokenFrom)
        paymentTokenContract.removeAllListeners(transferPaymentTokenTo)
        collateralTokenContract.removeAllListeners(filterCollateralTokenApproval)
        collateralTokenContract.removeAllListeners(transferCollateralTokenFrom)
        collateralTokenContract.removeAllListeners(transferCollateralTokenTo)
      }
    }

  }, [honeylemonService, address])

  return (
    <HoneylemonContext.Provider
      value={{
        honeylemonService,
        orderbookService,
        collateralTokenBalance,
        collateralTokenAllowance,
        COLLATERAL_TOKEN_DECIMALS,
        COLLATERAL_TOKEN_NAME,
        PAYMENT_TOKEN_DECIMALS,
        PAYMENT_TOKEN_NAME,
        CONTRACT_DURATION: contractDuration,
        CONTRACT_COLLATERAL_RATIO,
        paymentTokenAllowance,
        paymentTokenBalance,
        isDsProxyDeployed,
        dsProxyAddress,
        isDailyContractDeployed,
        marketData: {
          miningContracts,
          currentBTCSpotPrice,
          currentMRI,
          btcDifficultyAdjustmentDate,
        },
        portfolioData: {
          activeLongPositions,
          activeShortPositions,
          openOrders,
          openOrdersMetadata,
          expiredLongPositions,
          expiredShortPositions,
        },
        orderbook,
        btcStats,
        deployDSProxyContract,
        approveToken,
        refreshPortfolio: getPorfolio,
        isPortfolioRefreshing,
      }}>
      {children}
    </HoneylemonContext.Provider>
  );
}

function useHoneylemon() {
  const context = React.useContext(HoneylemonContext);
  if (context === undefined) {
    throw new Error("useHoneylemon must be used within a HoneylemonProvider");
  }
  return context;
}

export { HoneylemonProvider, useHoneylemon, TokenType };
