import * as React from "react";
import Web3 from "web3";
import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { MetamaskSubprovider, Web3JsProvider } from "@0x/subproviders";
import {
  HoneylemonService,
  OrderbookService,
  COLLATERAL_TOKEN_DECIMALS,
  PAYMENT_TOKEN_DECIMALS
} from "@honeylemon/honeylemonjs";
import { useOnboard } from "./OnboardContext";
import { ethers } from "ethers";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { BigNumber } from "@0x/utils";
import * as Sentry from "@sentry/react";

import config from "./HoneylemonConfig";

dayjs.extend(utc);

enum TokenType {
  CollateralToken,
  PaymentToken
}

export enum PositionType {
  Long = "Long",
  Short = "Short"
}

export enum PositionStatus {
  active = "Active",
  expiredAwaitingSettlement = "Expired Awaiting Settlement",
  withdrawalPending = "Withdrawal Pending",
  withdrawn = "Withdrawn"
}

const COLLATERAL_TOKEN_NAME = process.env.REACT_APP_COLLATERAL_TOKEN_NAME || "wBTC";
const PAYMENT_TOKEN_NAME = process.env.REACT_APP_PAYMENT_TOKEN_NAME || "USDT";
const CONTRACT_COLLATERAL_RATIO =
  Number(process.env.REACT_APP_CONTRACT_COLLATERAL_RATIO) || 1.25;
const MAINTENANCE_MODE = process.env.REACT_APP_MAINTENANCE_MODE === "true";

type OrderSummary = {
  price: number;
  quantity: number;
};

export type HoneylemonContext = {
  honeylemonService?: HoneylemonService;
  orderbookService?: OrderbookService;
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
  showTokenInfoModal: boolean;
  setShowTokenInfoModal: Dispatch<SetStateAction<boolean>>;
  marketData: {
    miningContracts: Array<any>;
    currentMRI: number;
    currentBTCSpotPrice: number;
    btcDifficultyAdjustmentDate: Date;
  };
  portfolioData: {
    openOrdersMetadata: Array<OpenOrderMetadata>;
    openOrders: { [orderHash: string]: OpenOrder } | undefined;
    activeLongPositions: Array<any>;
    activeShortPositions: Array<any>;
    expiredLongPositions: Array<any>;
    expiredShortPositions: Array<any>;
  };
  orderbook: Array<OrderSummary>;
  btcStats: any;
  isPortfolioRefreshing: boolean;
  isInMaintenanceMode: boolean;
  deployDSProxyContract(): Promise<void>;
  approveToken(tokenType: TokenType, amount?: number): Promise<void>;
  refreshPortfolio(): Promise<void>;
};

export type HoneylemonProviderProps = {
  children: React.ReactNode;
};

export type OpenOrderMetadata = {
  orderHash: string;
  remainingFillableMakerAssetAmount: number;
  price: BigNumber;
  //TODO: update to use types once definitions have been added
};

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
  expirationDate: Date;
  listingDate: Date;
  salt: BigNumber;
  makerAssetData: string;
  takerAssetData: string;
  makerFeeAssetData: string;
  takerFeeAssetData: string;
};

export type ContractDetails = {
  instrumentName: string;
  duration: number;
  startDate: Date;
  expirationDate: Date;
  settlementDate: Date;
};

const HoneylemonContext = React.createContext<HoneylemonContext | undefined>(undefined);

const HoneylemonProvider = ({ children }: HoneylemonProviderProps) => {
  const { wallet, network, isReady, address, notify, gasPrice } = useOnboard();

  const [honeylemonService, setHoneylemonService] = useState<
    HoneylemonService | undefined
  >(undefined);
  const [orderbookService, setOrderbookService] = useState<OrderbookService | undefined>(
    undefined
  );
  const [collateralTokenBalance, setCollateralTokenBalance] = useState<number>(0);
  const [collateralTokenAllowance, setCollateralTokenAllowance] = useState<number>(0);
  const [paymentTokenBalance, setPaymentTokenBalance] = useState<number>(0);
  const [paymentTokenAllowance, setPaymentTokenAllowance] = useState<number>(0);
  const [isDsProxyDeployed, setIsDsProxyDeployed] = useState<boolean>(false);
  const [dsProxyAddress, setDsProxyAddress] = useState<string>("");
  const [miningContracts, setMiningContracts] = useState<Array<any>>([]);
  const [currentMRI, setCurrentMRI] = useState(0);
  const [currentBTCSpotPrice, setCurrentBTCSpotPrice] = useState(0);
  const [btcDifficultyAdjustmentDate, setBtcDifficultyAdjustmentDate] = useState(
    new Date()
  );
  const [btcStats, setBtcStats] = useState<any>(undefined);
  const [openOrdersMetadata, setOpenOrdersMetadata] = useState<Array<OpenOrderMetadata>>(
    []
  );
  const [openOrders, setOpenOrders] = useState<
    { [orderHash: string]: OpenOrder } | undefined
  >();
  const [activeLongPositions, setActiveLongPositions] = useState([]);
  const [activeShortPositions, setActiveShortPositions] = useState([]);
  const [expiredLongPositions, setExpiredLongPositions] = useState([]);
  const [expiredShortPositions, setExpiredShortPositions] = useState([]);
  const [isPortfolioRefreshing, setIsPortfolioRefreshing] = useState(false);
  const [isDailyContractDeployed, setIsDailyContractDeployed] = useState(false);
  const [orderbook, setOrderbook] = useState([]);
  const [contractDuration, setContractDuration] = useState(0);
  const [showTokenInfoModal, setShowTokenInfoModal] = useState(false);

  const deployDSProxyContract = async () => {
    if (!honeylemonService || !address) {
      console.log("Please connect a wallet to deploy a DSProxy Contract");
      return;
    }
    try {
      const dsProxyAddress = await honeylemonService.deployDSProxyContract(
        address,
        gasPrice
      );
      setIsDsProxyDeployed(true);
      setDsProxyAddress(dsProxyAddress);
    } catch (error) {
      console.log("Something went wrong deploying the honeylemon vault");
      console.log(error);
      Sentry.captureException(error);
      throw new Error(
        "Something went wrong deploying the honeylemon vault. Please try again."
      );
    }
  };

  const approveToken = async (tokenType: TokenType, amount?: number): Promise<void> => {
    if (!honeylemonService || !address) {
      console.log("Please connect a wallet to deploy a DSProxy Contract");
      return;
    }
    try {
      switch (tokenType) {
        case TokenType.CollateralToken:
          await honeylemonService.approveCollateralToken(address, amount, gasPrice);
          const collateral = await honeylemonService.getCollateralTokenAmounts(address);
          setCollateralTokenAllowance(
            Number(collateral.allowance.shiftedBy(-COLLATERAL_TOKEN_DECIMALS).toString())
          );
          setCollateralTokenBalance(
            Number(collateral.balance.shiftedBy(-COLLATERAL_TOKEN_DECIMALS).toString())
          );
          break;
        case TokenType.PaymentToken:
          await honeylemonService.approvePaymentToken(address, amount, gasPrice);
          const payment = await honeylemonService.getPaymentTokenAmounts(address);
          setPaymentTokenAllowance(
            Number(payment.allowance.shiftedBy(-PAYMENT_TOKEN_DECIMALS).toString())
          );
          setPaymentTokenBalance(
            Number(payment.balance.shiftedBy(-PAYMENT_TOKEN_DECIMALS).toString())
          );
          break;
        default:
          break;
      }
    } catch (error) {
      console.log("Something went wrong approving the tokens");
      console.log(error);
      Sentry.captureException(error);
      const errorMessage =
        tokenType === TokenType.CollateralToken
          ? `${COLLATERAL_TOKEN_NAME} approval failed. Please try again later.`
          : `${PAYMENT_TOKEN_NAME} approval failed. Please try again later.`;

      throw Error(errorMessage);
    }
  };

  const parseContractName = (contractName: string): ContractDetails => {
    const [
      indexType,
      collateralInstrument,
      durationString,
      startDate
    ] = contractName.split("-");
    const duration = Number(durationString.replace("D", ""));
    return {
      instrumentName: `${indexType}-${collateralInstrument}`,
      startDate: dayjs(startDate, { utc: true })
        .startOf("day")
        .toDate(), //This will always be UTC 00:00 the date the contract was concluded
      expirationDate: dayjs(startDate, { utc: true })
        .startOf("day")
        .add(duration, "d")
        .toDate(),
      settlementDate: dayjs(startDate, { utc: true })
        .startOf("day")
        .add(duration + 1, "d")
        .toDate(),
      duration
    };
  };

  const getPositionStatus = (position: any): PositionStatus => {
    if (!position?.contract.settlement) {
      return PositionStatus.active;
    } else {
      if (!position.isRedeemed && !position.canRedeem)
        return PositionStatus.expiredAwaitingSettlement;
      if (!position.isRedeemed && position.canRedeem)
        return PositionStatus.withdrawalPending;
      return PositionStatus.withdrawn;
    }
  };

  const getPorfolio = async () => {
    if (!honeylemonService) return;
    try {
      setIsPortfolioRefreshing(true);

      const openOrdersRes = await honeylemonService.getOpenOrders(address);
      setOpenOrdersMetadata(
        openOrdersRes.records.map((openOrder: any) => openOrder.metaData)
      );
      setOpenOrders(
        Object.fromEntries(
          openOrdersRes.records.map((openOrder: any) => [
            openOrder.metaData.orderHash,
            {
              ...openOrder.order,
              expirationDate: dayjs(
                openOrder.order.expirationTimeSeconds.toNumber() * 1000
              ).toDate(),
              listingDate: dayjs(openOrder.order.expirationTimeSeconds.toNumber() * 1000)
                .subtract(10, "d")
                .toDate()
            }
          ])
        )
      );

      const positions = await honeylemonService.getPositions(address);
      const allPositions = positions.longPositions
        .map((lp: any) => ({
          ...lp,
          contractName: lp.contractName + "-long",
          type: PositionType.Long
        }))
        .concat(
          positions.shortPositions.map((sp: any) => ({
            ...sp,
            contractName: sp.contractName + "-short",
            type: PositionType.Short
          }))
        )
        .map((p: any) => {
          return {
            ...p,
            daysToExpiration: Math.ceil(
              dayjs(p.contract.expiration * 1000).diff(dayjs(), "d", true)
            ),
            pendingReward:
              Number(p.pendingReward?.shiftedBy(-COLLATERAL_TOKEN_DECIMALS).toString()) ||
              0,
            finalReward:
              Number(p.finalReward?.shiftedBy(-COLLATERAL_TOKEN_DECIMALS).toString()) ||
              0,
            totalCost: Number(
              new BigNumber(p.price).multipliedBy(p.qtyToMint).toString()
            ),
            totalCollateralLocked: Number(
              new BigNumber(p.contract.collateralPerUnit)
                .multipliedBy(p.qtyToMint)
                .shiftedBy(-COLLATERAL_TOKEN_DECIMALS)
                .toString()
            ),
            canBeBatchRedeemed:
              p.type === PositionType.Long
                ? p.longTokenDSProxy !== p.longTokenRecipient.id
                : p.shortTokenDSProxy !== p.shortTokenRecipient.id,
            ...parseContractName(p.contractName),
            status: getPositionStatus(p)
          };
        });

      const newActiveLongPositions = allPositions.filter(
        (p: any) => p.status === PositionStatus.active && p.type === PositionType.Long
      );
      setActiveLongPositions(newActiveLongPositions);

      const newActiveShortPositions = allPositions.filter(
        (p: any) => p.status === PositionStatus.active && p.type === PositionType.Short
      );
      setActiveShortPositions(newActiveShortPositions);

      const newExpiredLongPositions = allPositions.filter(
        (p: any) => p.status !== PositionStatus.active && p.type === PositionType.Long
      );
      setExpiredLongPositions(newExpiredLongPositions);

      const newExpiredShortPositions = allPositions.filter(
        (p: any) => p.status !== PositionStatus.active && p.type === PositionType.Short
      );
      setExpiredShortPositions(newExpiredShortPositions);
    } catch (error) {
      Sentry.captureException(error);
      console.log("There was an error getting the market data");
    } finally {
      setIsPortfolioRefreshing(false);
    }
  };

  const validNetworks = Object.keys(config).map(network => Number(network));

  // Instantiate honeylemon service and get all initial user data
  useEffect(() => {
    setContractDuration(config[network || validNetworks[0]].contractDuration);
    if (isReady && wallet && network && validNetworks.includes(network) && address) {
      const initHoneylemonService = async () => {
        try {
          let wrappedSubprovider;
          const web3 = new Web3(wallet.provider);
          switch (wallet.name) {
            case "MetaMask":
              wrappedSubprovider = new MetamaskSubprovider(
                web3.currentProvider as Web3JsProvider
              );
              break;
            default:
              wrappedSubprovider = new MetamaskSubprovider(
                web3.currentProvider as Web3JsProvider
              );
          }

          const honeylemonService = new HoneylemonService(
            config[network].apiUrl,
            config[network].subgraphUrl,
            wrappedSubprovider,
            network,
            config[network].minterBridgeAddress,
            config[network].marketContractProxy,
            config[network].collateralTokenAddress,
            config[network].paymentTokenAddress,
            contractDuration
          );
          setHoneylemonService(honeylemonService);
          const collateral = await honeylemonService.getCollateralTokenAmounts(address);
          setCollateralTokenAllowance(
            Number(collateral.allowance.shiftedBy(-COLLATERAL_TOKEN_DECIMALS).toString())
          );
          setCollateralTokenBalance(
            Number(collateral.balance.shiftedBy(-COLLATERAL_TOKEN_DECIMALS).toString())
          );
          const payment = await honeylemonService.getPaymentTokenAmounts(address);
          setPaymentTokenAllowance(
            Number(payment.allowance.shiftedBy(-PAYMENT_TOKEN_DECIMALS).toString())
          );
          setPaymentTokenBalance(
            Number(payment.balance.shiftedBy(-PAYMENT_TOKEN_DECIMALS).toString())
          );
          const proxyDeployed: boolean = await honeylemonService.addressHasDSProxy(
            address
          );
          setIsDsProxyDeployed(proxyDeployed);
          if (proxyDeployed) {
            const proxyAddress = await honeylemonService.getDSProxyAddress(address);
            setDsProxyAddress(proxyAddress);
          }
          const isContractDeployed = await honeylemonService.isDailyContractDeployed();
          setIsDailyContractDeployed(isContractDeployed);
        } catch (error) {
          console.log("Error initializing Honeylemon context");
          Sentry.captureEvent(error);
        }
      };
      initHoneylemonService();

      return () => {
        setHoneylemonService(undefined);
        setCollateralTokenAllowance(0);
        setCollateralTokenBalance(0);
        setPaymentTokenAllowance(0);
        setPaymentTokenBalance(0);
        setIsDsProxyDeployed(false);
        setDsProxyAddress("");
      };
    }
  }, [wallet, network, isReady, address]);

  // Instantiate Orderbook service
  useEffect(() => {
    const initOrderbookService = async () => {
      const activeNetwork =
        network && validNetworks.includes(network) ? network : validNetworks[0];
      const orderbookServiceInstance = new OrderbookService(
        config[activeNetwork].apiUrl,
        config[activeNetwork].minterBridgeAddress,
        config[activeNetwork].marketContractProxy,
        config[activeNetwork].paymentTokenAddress
      );
      setOrderbookService(orderbookServiceInstance);
    };
    initOrderbookService();
  }, [network]);

  // Order book poller
  useEffect(() => {
    const getOrderbookData = async () => {
      if (orderbookService) {
        try {
          const orderbookResponse = await orderbookService.getOrderbook();
          const book = orderbookResponse.asks.records
            .filter((order: any) =>
              new BigNumber(order.metaData.remainingFillableMakerAssetAmount).gt(0)
            )
            .map((order: any) => ({
              price: Number(
                new BigNumber(order.metaData.price).dividedBy(contractDuration).toString()
              ),
              quantity: Number(
                new BigNumber(order.metaData.remainingFillableMakerAssetAmount).toString()
              )
            }));
          setOrderbook(book);
        } catch (error) {
          console.log("There was an error getting the orderbook.");
          console.log(error);
          Sentry.captureException(error);
        }
      }
    };

    let poller: NodeJS.Timeout;
    getOrderbookData();
    poller = setInterval(getOrderbookData, 30000);

    return () => {
      clearInterval(poller);
    };
  }, [orderbookService, contractDuration]);

  // Market Data Poller
  useEffect(() => {
    const getMarketData = async () => {
      try {
        const marketDataApiUrl = process.env.REACT_APP_MARKET_DATA_API_URL;
        if (marketDataApiUrl) {
          const { mri } = await (
            await fetch(
              `${marketDataApiUrl}/production/chain/btc/mri?day=${dayjs()
                .subtract(1, "day")
                .format("YYYY-MM-DD")}T00:00Z&days=1`
            )
          ).json();

          setCurrentMRI(mri);

          const coingeckoResponse = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
          ).then(response => response.json());

          coingeckoResponse &&
            coingeckoResponse.bitcoin &&
            coingeckoResponse.bitcoin.usd &&
            setCurrentBTCSpotPrice(Number.parseFloat(coingeckoResponse.bitcoin.usd));
          // const { contracts } = await (
          //   await fetch(`${marketDataApiUrl}/blockchain/agg?coin=BTC`)
          // ).json();
          // const stats = await (
          //   await fetch(`${marketDataApiUrl}/blockchain/stats`)
          // ).json();
          // setMiningContracts(
          //   contracts.map((c: any) =>
          //     c.type === "DIFFICULTY_FUTURES"
          //       ? {
          //           ...c,
          //           duration: dayjs(c.expiry).diff(dayjs(), "d", true)
          //         }
          //       : c
          //   )
          // );
          // setBtcStats(stats);
        }
      } catch (error) {
        console.log("There was an error getting the market data");
        Sentry.captureException(error);
      }
    };

    let poller: NodeJS.Timeout;
    getMarketData();
    poller = setInterval(getMarketData, 30000);

    return () => {
      clearInterval(poller);
    };
  }, []);

  // Portfolio Data Poller
  useEffect(() => {
    let poller: NodeJS.Timeout;

    const getPortfolioData = async () => {
      if (!isPortfolioRefreshing) {
        await getPorfolio();
      }
    };

    if (honeylemonService && address) {
      getPortfolioData();
      poller = setInterval(getPortfolioData, 30000);
    }
    return () => {
      clearInterval(poller);
    };
  }, [honeylemonService, address, network]);

  // Difficulty Adjustment Date
  useEffect(() => {
    const getDifficultyAdjustmentDate = async () => {
      try {
        const btcStatsUrl = process.env.REACT_APP_BTC_STATS_URL;
        if (btcStatsUrl) {
          const { currentBlockHeight, avgBlockTime } = await (
            await fetch(btcStatsUrl)
          ).json();
          const currentEpochBlocks = currentBlockHeight % 2016;
          const remainingEpochTime = (2016 - currentEpochBlocks) * avgBlockTime;
          const date = dayjs()
            .utc()
            .add(remainingEpochTime, "s");
          setBtcDifficultyAdjustmentDate(date.toDate());
        }
      } catch (error) {
        Sentry.captureException(error);
        console.log("Error getting next difficulty adjustment date");
      }
    };
    getDifficultyAdjustmentDate();
  }, []);

  // Transfer & Approval event listeners for Payment & Collateral Tokens
  useEffect(() => {
    const checkBalancesAndApprovals = async () => {
      if (!honeylemonService) return;
      const collateral = await honeylemonService.getCollateralTokenAmounts(address);
      setCollateralTokenAllowance(
        Number(collateral.allowance.shiftedBy(-COLLATERAL_TOKEN_DECIMALS).toString())
      );
      setCollateralTokenBalance(
        Number(collateral.balance.shiftedBy(-COLLATERAL_TOKEN_DECIMALS).toString())
      );
      const payment = await honeylemonService.getPaymentTokenAmounts(address);
      setPaymentTokenAllowance(
        Number(payment.allowance.shiftedBy(-PAYMENT_TOKEN_DECIMALS).toString())
      );
      setPaymentTokenBalance(
        Number(payment.balance.shiftedBy(-PAYMENT_TOKEN_DECIMALS).toString())
      );
    };
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
        "event Approval(address indexed owner, address indexed spender, uint256 value)"
      ];

      let provider = new ethers.providers.Web3Provider(honeylemonService.provider);
      const paymentTokenContractAddress = honeylemonService.paymentTokenAddress;
      const paymentTokenContract = new ethers.Contract(
        paymentTokenContractAddress,
        erc20Abi,
        provider
      );
      const filterPaymentTokenApproval = paymentTokenContract.filters.Approval(address);
      const transferPaymentTokenFrom = paymentTokenContract.filters.Transfer(
        address,
        null,
        null
      );
      const transferPaymentTokenTo = paymentTokenContract.filters.Transfer(
        null,
        address,
        null
      );
      paymentTokenContract.on(filterPaymentTokenApproval, () =>
        checkBalancesAndApprovals()
      );
      paymentTokenContract.on(transferPaymentTokenFrom, () =>
        checkBalancesAndApprovals()
      );
      paymentTokenContract.on(transferPaymentTokenTo, () => checkBalancesAndApprovals());

      const collateralTokenContractAddress = honeylemonService.collateralTokenAddress;
      const collateralTokenContract = new ethers.Contract(
        collateralTokenContractAddress,
        erc20Abi,
        provider
      );
      const filterCollateralTokenApproval = collateralTokenContract.filters.Approval(
        address
      );
      const transferCollateralTokenFrom = collateralTokenContract.filters.Transfer(
        address,
        null,
        null
      );
      const transferCollateralTokenTo = collateralTokenContract.filters.Transfer(
        null,
        address,
        null
      );

      collateralTokenContract.on(filterCollateralTokenApproval, () =>
        checkBalancesAndApprovals()
      );
      collateralTokenContract.on(transferCollateralTokenFrom, () =>
        checkBalancesAndApprovals()
      );
      collateralTokenContract.on(transferCollateralTokenTo, () =>
        checkBalancesAndApprovals()
      );
      return () => {
        paymentTokenContract.removeAllListeners(filterPaymentTokenApproval);
        paymentTokenContract.removeAllListeners(transferPaymentTokenFrom);
        paymentTokenContract.removeAllListeners(transferPaymentTokenTo);
        collateralTokenContract.removeAllListeners(filterCollateralTokenApproval);
        collateralTokenContract.removeAllListeners(transferCollateralTokenFrom);
        collateralTokenContract.removeAllListeners(transferCollateralTokenTo);
      };
    }
  }, [honeylemonService, address, network]);

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
          btcDifficultyAdjustmentDate
        },
        portfolioData: {
          activeLongPositions,
          activeShortPositions,
          openOrders,
          openOrdersMetadata,
          expiredLongPositions,
          expiredShortPositions
        },
        orderbook,
        btcStats,
        deployDSProxyContract,
        approveToken,
        refreshPortfolio: getPorfolio,
        isPortfolioRefreshing,
        showTokenInfoModal,
        setShowTokenInfoModal,
        isInMaintenanceMode: MAINTENANCE_MODE
      }}
    >
      {children}
    </HoneylemonContext.Provider>
  );
};

function useHoneylemon() {
  const context = React.useContext(HoneylemonContext);
  if (context === undefined) {
    throw new Error("useHoneylemon must be used within a HoneylemonProvider");
  }
  return context;
}

export { HoneylemonProvider, useHoneylemon, TokenType };
