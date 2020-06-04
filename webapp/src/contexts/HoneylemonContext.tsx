import * as React from "react";
import Web3 from 'web3'
import { useState, useEffect } from "react";
import { MetamaskSubprovider, Web3JsProvider } from '@0x/subproviders';
import { HoneylemonService } from "honeylemon";
import { useOnboard } from "./OnboardContext";
import { ethers } from 'ethers';
import dayjs from 'dayjs';

export type HoneylemonContext = {
  honeylemonService: any; //TODO update this when types exist
  collateralTokenBalance: number,
  collateralTokenAllowance: number,
  COLLATERAL_TOKEN_DECIMALS: number,
  paymentTokenBalance: number,
  paymentTokenAllowance: number,
  PAYMENT_TOKEN_DECIMALS: number,
  CONTRACT_DURATION: number,
  isDsProxyDeployed: Boolean,
  marketData: {
    miningContracts: Array<any>,
    currentMRI: number,
    currentBTCSpotPrice: number,
    btcDifficultyAdjustmentDate: Date,
  }
};

export type HoneylemonProviderProps = {
  children: React.ReactNode;
};

const HoneylemonContext = React.createContext<HoneylemonContext | undefined>(undefined);

const HoneylemonProvider = ({ children }: HoneylemonProviderProps) => {
  const { wallet, network, isReady, address, notify } = useOnboard();
  const [honeylemonService, setHoneylemonService] = useState<any | undefined>(undefined);
  const [collateralTokenBalance, setCollateralTokenBalance] = useState<number>(0);
  const [collateralTokenAllowance, setCollateralTokenAllowance] = useState<number>(0);
  const [paymentTokenBalance, setPaymentTokenBalance] = useState<number>(0);
  const [paymentTokenAllowance, setPaymentTokenAllowance] = useState<number>(0);
  const [isDsProxyDeployed, setIsDsProxyDeployed] = useState<Boolean>(false);
  const [miningContracts, setMiningContracts] = useState<Array<any>>([]);
  const [currentMRI, setCurrentMRI] = useState(0);
  const [currentBTCSpotPrice, setCurrentBTCSpotPrice] = useState(0);
  const [btcDifficultyAdjustmentDate, setBtcDifficultyAdjustmentDate] = useState(new Date());

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
        const proxyDeployed = await honeylemonService.addressHasDSProxy(address)
        setIsDsProxyDeployed(proxyDeployed);
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
        notify?.unsubscribe(address || "0x");
      }
    }
  }, [wallet, network, isReady, address]);


  // All polling effects go here
  useEffect(() => {
    const getMarketData = async () => {
      try {
        const marketDataApiUrl = process.env.REACT_APP_MARKET_DATA_API;
        if (marketDataApiUrl) {
          var miningContracts = await (await fetch(marketDataApiUrl)).json()
        }
        setMiningContracts(miningContracts);
      } catch (error) {
        console.log('There was an error getting the market data')
      }
    }

    !miningContracts && getMarketData();
  }, [honeylemonService, address])

  useEffect(() => {
    const getDifficultyAdjustmentDate = async () => {
      try {
        const btcStatsUrl = process.env.REACT_APP_BTC_STATS_URL;
        if (btcStatsUrl) {
          // const { currentBlockHeight, avgBlockTime } = await (await fetch(btcStatsUrl)).json()
          const currentBlockHeight: number = await (await fetch('https://blockchain.info/q/getblockcount')).json()
          const avgBlockTime: number = await (await fetch('https://blockchain.info/q/interval')).json()
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

  useEffect(() => {
    const checkBalancesAndApprovals = async () => {
      const collateral = await honeylemonService.getCollateralTokenAmounts(address);
      setCollateralTokenAllowance(Number(collateral.allowance.shiftedBy(-8).toString()));
      setCollateralTokenBalance(Number(collateral.balance.shiftedBy(-8).toString()));
      const payment = await honeylemonService.getPaymentTokenAmounts(address);
      setPaymentTokenAllowance(Number(payment.allowance.shiftedBy(-6).toString()));
      setPaymentTokenBalance(Number(payment.balance.shiftedBy(-6).toString()));
      if (!isDsProxyDeployed) {
        const proxyDeployed = await honeylemonService.addressHasDSProxy(address)
        setIsDsProxyDeployed(proxyDeployed);
      }
    }
    if (honeylemonService && address) {
      checkBalancesAndApprovals();

      const erc20Abi = [
        "function transfer(address to, uint256 value) external returns (bool)",
        "function approve(address spender, uint256 value) external returns (bool)",
        "function transferFrom(address from, address to, uint256 value) external returns (bool)",
        "function totalSupply() external view returns (uint256)",
        "function balanceOf(address who) external view returns (uint256)",
        "function allowance(address owner, address spender) external view returns (uint256)",
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
        //   collateralTokenContract.removeAllListeners(transferCollateralTokenTo)
      }
    }

  }, [honeylemonService, address])

  return (
    <HoneylemonContext.Provider
      value={{
        honeylemonService,
        collateralTokenBalance,
        collateralTokenAllowance,
        COLLATERAL_TOKEN_DECIMALS: 8, //TODO: Extract this from library when TS conversion is done
        paymentTokenAllowance,
        paymentTokenBalance,
        PAYMENT_TOKEN_DECIMALS: 6, //TODO: Extract this from library when TS conversion is done
        CONTRACT_DURATION: 2, //TODO: Extract this from library when TS conversion is done
        isDsProxyDeployed,
        marketData: {
          miningContracts,
          currentBTCSpotPrice,
          currentMRI,
          btcDifficultyAdjustmentDate,
        }
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

export { HoneylemonProvider, useHoneylemon };
