import * as React from "react";
import Web3 from 'web3'
import { useState, useEffect } from "react";
import { MetamaskSubprovider, Web3JsProvider } from '@0x/subproviders';
import { HoneylemonService } from "honeylemon";
import { useOnboard } from "./OnboardContext";
import { ethers } from 'ethers';
import dayjs from 'dayjs';
import { BigNumber } from "@0x/utils";

enum TokenType {
  CollateralToken,
  PaymentToken
}

enum PositionType {
  Long = 'Long',
  Short = 'Short'
}

//TODO: Extract this from library when TS conversion is done
const COLLATERAL_TOKEN_DECIMALS = 8;
const COLLATERAL_TOKEN_NAME = 'imBTC';
const PAYMENT_TOKEN_DECIMALS = 6;
const PAYMENT_TOKEN_NAME = 'USDT';
const CONTRACT_DURATION = 2;
const CONTRACT_COLLATERAL_RATIO = 1.35;


export type HoneylemonContext = {
  honeylemonService: any; //TODO update this when types exist
  collateralTokenBalance: number,
  collateralTokenAllowance: number,
  COLLATERAL_TOKEN_DECIMALS: number,
  COLLATERAL_TOKEN_NAME: string,
  paymentTokenBalance: number,
  paymentTokenAllowance: number,
  PAYMENT_TOKEN_DECIMALS: number,
  PAYMENT_TOKEN_NAME: string,
  CONTRACT_DURATION: number,
  isDsProxyDeployed: boolean,
  dsProxyAddress: string,
  CONTRACT_COLLATERAL_RATIO: number,
  marketData: {
    miningContracts: Array<any>,
    currentMRI: number,
    currentBTCSpotPrice: number,
    btcDifficultyAdjustmentDate: Date,
    miningPayoff: number,
  },
  portfolioData: {
    openOrdersMetadata: Array<OpenOrderMetadata>,
    openOrders: { [orderHash: string]: OpenOrder } | undefined,
    activePositions: Array<any>,
    settlementDelayPositions: Array<any>,
    settledPositionsToWithdraw: Array<any>,
    settledPositions: Array<any>,
  }
  deployDSProxyContract(): Promise<void>,
  approveToken(tokenType: TokenType): Promise<void>,
  refreshPortfolio(): Promise<void>,
};

export type HoneylemonProviderProps = {
  children: React.ReactNode;
};

export type OpenOrderMetadata = {
  orderHash: string,
  remainingFillableMakerAssetAmount: BigNumber,
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
  salt: BigNumber;
  makerAssetData: string;
  takerAssetData: string;
  makerFeeAssetData: string;
  takerFeeAssetData: string;
}

export type ContractDetails = {
  instrumentName: string,
  duration: number,
  date: Date,
  type: PositionType,
}

const HoneylemonContext = React.createContext<HoneylemonContext | undefined>(undefined);

const HoneylemonProvider = ({ children }: HoneylemonProviderProps) => {
  const { wallet, network, isReady, address, notify } = useOnboard();

  const [honeylemonService, setHoneylemonService] = useState<any | undefined>(undefined);
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
  const [openOrdersMetadata, setOpenOrdersMetadata] = useState<Array<OpenOrderMetadata>>([]);
  const [openOrders, setOpenOrders] = useState<{ [orderHash: string]: OpenOrder } | undefined>()
  const [activePositions, setActivePositions] = useState([]);
  const [settlementDelayPositions, setSettlementDelayPositions] = useState([])
  const [settledPositionsToWithdraw, setSettledPositionsToWithdraw] = useState([]);
  const [settledPositions, setSettledPositions] = useState([]);
  const [isPortfolioRefreshing, setIsPortfolioRefreshing] = useState(false);

  const deployDSProxyContract = async () => {
    try {
      const dsProxyAddress = await honeylemonService.deployDSProxyContract(address);
      setIsDsProxyDeployed(true);
      setDsProxyAddress(dsProxyAddress);
    } catch (error) {
      console.log('Something went wrong deploying the DS Proxy wallet');
      console.log(error);
      // TODO: Display error on modal
    }
  }

  const approveToken = async (tokenType: TokenType): Promise<void> => {
    try {
      switch (tokenType) {
        case TokenType.CollateralToken:
          await honeylemonService.approveCollateralToken(address);
          const collateral = await honeylemonService.getCollateralTokenAmounts(address);
          setCollateralTokenAllowance(Number(collateral.allowance.shiftedBy(-8).toString()));
          setCollateralTokenBalance(Number(collateral.balance.shiftedBy(-8).toString()));
          break;
        case TokenType.PaymentToken:
          await honeylemonService.approvePaymentToken(address);
          const payment = await honeylemonService.getPaymentTokenAmounts(address);
          setPaymentTokenAllowance(Number(payment.allowance.shiftedBy(-6).toString()));
          setPaymentTokenBalance(Number(payment.balance.shiftedBy(-6).toString()));
          break;
        default:
          break;
      }
    } catch (error) {
      console.log('Something went wrong approving the tokens');
      console.log(error);
      // TODO: Display error on modal
    }
  }

  const parseContractName = (contractName: string): ContractDetails => {
    const [indexType, collateralInstrument, duration, date, position] = contractName.split('-');
    return {
      instrumentName: `${indexType}-${collateralInstrument}`,
      type: (position === 'long') ? PositionType.Long : PositionType.Short,
      date: new Date(date),
      duration: Number(duration.slice(0, duration.length - 2))
    }
  }

  const getPorfolio = async () => {
    setIsPortfolioRefreshing(true);
    const openOrdersRes = await honeylemonService.getOpenOrders(address);
    const positions = await honeylemonService.getPositions(address);
    setOpenOrdersMetadata(openOrdersRes.records.map((openOrder: any) => openOrder.metaData))

    setOpenOrders(Object.fromEntries(
      openOrdersRes.records.map(((openOrder: any) => [openOrder.metaData.orderHash, openOrder.order]))
    ));

    const allPositions = positions.longPositions.map((lp: any) => ({
      ...lp,
      contractName: lp.contractName + '-long',
    })).concat(positions.shortPositions.map((sp: any) => ({
      ...sp,
      contractName: sp.contractName + '-short',
    }))).map((p: any) => ({
      ...p,
      daysToMaturity: Math.ceil(dayjs(p.contract.expiration * 1000).diff(dayjs(), 'd', true)),
      pendingReward: Number(p.pendingReward?.shiftedBy(-COLLATERAL_TOKEN_DECIMALS).toString()) || 0,
      finalReward: Number(p.finalReward?.shiftedBy(-COLLATERAL_TOKEN_DECIMALS).toString()) || 0,
      ...parseContractName(p.contractName),
    }));

    const newActivePositions = allPositions.filter((p: any) => !p?.contract.settlement)
    setActivePositions(newActivePositions);

    const sdp = allPositions.filter((p: any) => p?.contract.settlement && !p.canRedeem && !p.isRedeemed)
    setSettlementDelayPositions(sdp);
    
    const sptw = allPositions.filter((p: any) => p?.contract.settlement && p.canRedeem && !p.isRedeemed)
    setSettledPositionsToWithdraw(sptw);

    const finalized = allPositions.filter((p: any) => p?.contract.settlement && p.isRedeemed)
    setSettledPositions(finalized);
    setIsPortfolioRefreshing(false);
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
        );
        setHoneylemonService(honeylemonService);
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
        if (address && notify) {
          const { emitter } = notify.account(address);
          emitter.on('all', tx => ({
            onclick: () => window.open(`https://kovan.etherscan.io/tx/${tx.hash}`) // TODO update this to work on other networks
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


  // Market Data Poller
  useEffect(() => {
    const getMarketData = async () => {
      try {
        const marketDataApiUrl = process.env.REACT_APP_MARKET_DATA_API_URL;
        if (marketDataApiUrl) {
          const { contracts } = await (await fetch(marketDataApiUrl)).json();
          setMiningContracts(contracts);
        }
      } catch (error) {
        console.log('There was an error getting the market data')
      }
    }

    let poller: NodeJS.Timeout;

    poller = setInterval(getMarketData, 10000);

    return () => {
      clearInterval(poller);
    }
  }, [])

  // Portfolio Data Poller
  useEffect(() => {
    let poller: NodeJS.Timeout;

    const getPortfolioData = async () => {
      try {
        !isPortfolioRefreshing && await getPorfolio();
      } catch (error) {
        console.log('There was an error getting the market data')
      }
    }

    if (honeylemonService && address) {
      getPortfolioData();
      poller = setInterval(getPortfolioData, 15000);
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
      const transferPaymentTokenFrom = paymentTokenContract.filters.Transfer(address);
      // TODO Figure out why this is not working
      // const transferPaymentTokenTo = paymentTokenContract.filters.Transfer(null, address);

      paymentTokenContract.on(filterPaymentTokenApproval, () => checkBalancesAndApprovals())
      paymentTokenContract.on(transferPaymentTokenFrom, () => checkBalancesAndApprovals())
      // paymentTokenContract.on(transferPaymentTokenTo, () => checkBalancesAndApprovals())        

      const collateralTokenContractAddress = honeylemonService.collateralTokenAddress;
      const collateralTokenContract = new ethers.Contract(collateralTokenContractAddress, erc20Abi, provider);
      const filterCollateralTokenApproval = collateralTokenContract.filters.Approval(address);
      const transferCollateralTokenFrom = collateralTokenContract.filters.Transfer(address);
      // TODO Figure out why this is not working
      // const transferCollateralTokenTo = collateralTokenContract.filters.Transfer(null, address, null);

      collateralTokenContract.on(filterCollateralTokenApproval, () => checkBalancesAndApprovals())
      collateralTokenContract.on(transferCollateralTokenFrom, () => checkBalancesAndApprovals())
      // collateralTokenContract.on(transferCollateralTokenTo, () => checkBalancesAndApprovals())
      return () => {
        paymentTokenContract.removeAllListeners(filterPaymentTokenApproval)
        paymentTokenContract.removeAllListeners(transferPaymentTokenFrom)
        // paymentTokenContract.removeAllListeners(transferPaymentTokenTo)  
        collateralTokenContract.removeAllListeners(filterCollateralTokenApproval)
        collateralTokenContract.removeAllListeners(transferCollateralTokenFrom)
        // collateralTokenContract.removeAllListeners(transferCollateralTokenTo)
      }
    }

  }, [honeylemonService, address])

  return (
    <HoneylemonContext.Provider
      value={{
        honeylemonService,
        collateralTokenBalance,
        collateralTokenAllowance,
        COLLATERAL_TOKEN_DECIMALS,
        COLLATERAL_TOKEN_NAME,
        PAYMENT_TOKEN_DECIMALS,
        PAYMENT_TOKEN_NAME,
        CONTRACT_DURATION,
        CONTRACT_COLLATERAL_RATIO,
        paymentTokenAllowance,
        paymentTokenBalance,
        isDsProxyDeployed,
        dsProxyAddress,
        marketData: {
          miningContracts,
          currentBTCSpotPrice,
          currentMRI,
          btcDifficultyAdjustmentDate,
          miningPayoff: 0.0953,
        },
        portfolioData: {
          activePositions,
          openOrders,
          openOrdersMetadata,
          settledPositions,
          settledPositionsToWithdraw,
          settlementDelayPositions
        },
        deployDSProxyContract,
        approveToken,
        refreshPortfolio: getPorfolio
      }}
    >
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
