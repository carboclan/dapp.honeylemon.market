import React, { ReactNode, useRef, useEffect, useState } from "react";
import clsx from "clsx";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import {
  Drawer,
  AppBar,
  Toolbar,
  Divider,
  IconButton,
  Typography,
  ListItem,
  ListItemIcon,
  ListItemText,
  List,
  Avatar,
  Link,
  Button,
  Switch,
  Select,
  MenuItem
} from "@material-ui/core";
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  AccountBalance,
  Assessment,
  MonetizationOn,
  Whatshot,
  ExitToApp,
  Home,
  Info,
  Label,
  Language
} from "@material-ui/icons";
import Blockies from "react-blockies";

import { forwardTo } from "../helpers/history";
import { ReactComponent as HoneyLemonLogo } from "../images/honeylemon-logo.svg";
import { useOnboard } from "../contexts/OnboardContext";
import { useHoneylemon, TokenType } from "../contexts/HoneylemonContext";
import TokenInfoModal from "../components/TokenInfoModal";

import Footer from "./Footer";
import { useOnClickOutside } from "../helpers/useOnClickOutside";
import { networkName } from "../helpers/ethereumNetworkUtils";
import { displayAddress } from "../helpers/displayAddress";
import { useLocation } from "react-router-dom";
import * as Sentry from "@sentry/react";
import { useLanguageSwitcher } from "../contexts/LanguageSwitcherContext";

const drawerWidth = 300;
const footerHeight = 150;

const useStyles = makeStyles(({ transitions, palette, mixins, spacing }) => ({
  root: {
    display: "flex"
  },
  appBar: {
    transition: transitions.create(["margin", "width"], {
      easing: transitions.easing.sharp,
      duration: transitions.duration.leavingScreen
    }),
    backgroundColor: "#424242",
    color: palette.common.white
  },
  appBarShift: {
    width: `calc(100% - ${drawerWidth}px)`,
    transition: transitions.create(["margin", "width"], {
      easing: transitions.easing.easeOut,
      duration: transitions.duration.enteringScreen
    }),
    marginRight: drawerWidth
  },
  logo: {
    flexGrow: 0,
    cursor: "pointer"
  },
  title: {
    flexGrow: 1,
    cursor: "pointer",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold"
  },
  hide: {
    display: "none"
  },
  hamburger: {
    color: palette.primary.main
  },
  drawer: {
    flexShrink: 0
  },
  drawerPaper: {
    width: 0
  },
  drawerOpen: {
    width: drawerWidth
  },
  drawerHeader: {
    display: "flex",
    alignItems: "center",
    padding: spacing(0, 1),
    // necessary for content to be below app bar
    ...mixins.toolbar,
    minHeight: "64px",
    justifyContent: "flex-start"
  },
  content: {
    flexGrow: 1
  },
  contentDrawerOpen: {
    marginRight: -drawerWidth
  },
  deployWalletButton: {
    borderColor: palette.primary.main,
    borderWidth: 2,
    borderStyle: "solid",
    color: palette.primary.main,
    backgroundColor: "#424242",
    "&:hover": {
      backgroundColor: "#303030"
    }
  },
  getMoreTokensButton: {
    borderColor: palette.secondary.main,
    borderWidth: 2,
    borderStyle: "solid",
    color: palette.secondary.main,
    backgroundColor: "#424242",
    "&:hover": {
      backgroundColor: "#303030"
    }
  },
  menuHeading: {
    paddingTop: spacing(1),
    color: palette.secondary.main,
    cursor: "pointer"
  }
}));

function AppWrapper(props: { children: ReactNode }) {
  const classes = useStyles();
  const theme = useTheme();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [txActive, setTxActive] = useState(false);

  const { isReady, address, network, ethBalance, resetOnboard, isMobile } = useOnboard();
  const {
    availableLanguages,
    selectedLanguage,
    setActiveLanguage
  } = useLanguageSwitcher();
  const {
    isDsProxyDeployed,
    dsProxyAddress,
    deployDSProxyContract,
    collateralTokenBalance,
    collateralTokenAllowance,
    COLLATERAL_TOKEN_DECIMALS,
    COLLATERAL_TOKEN_NAME,
    paymentTokenBalance,
    paymentTokenAllowance,
    PAYMENT_TOKEN_DECIMALS,
    PAYMENT_TOKEN_NAME,
    approveToken,
    showTokenInfoModal,
    setShowTokenInfoModal,
    isInMaintenanceMode
  } = useHoneylemon();

  const handleLogout = () => {
    resetOnboard();
    setDrawerOpen(false);
    forwardTo("/");
  };

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const handleNavigate = (path: string) => {
    forwardTo(path);
    isMobile && setDrawerOpen(false);
  };

  const handleToggleTokenApproval = async (tokenType: TokenType) => {
    setTxActive(true);
    try {
      switch (tokenType) {
        case TokenType.CollateralToken: {
          collateralTokenAllowance === 0
            ? await approveToken(TokenType.CollateralToken)
            : await approveToken(TokenType.CollateralToken, 0);
          break;
        }
        case TokenType.PaymentToken: {
          paymentTokenAllowance === 0
            ? await approveToken(TokenType.PaymentToken)
            : await approveToken(TokenType.PaymentToken, 0);
          break;
        }
      }
    } catch (error) {
      console.log(error);
      Sentry.captureException(error);
    }
    setTxActive(false);
  };

  const handleDeployDSProxy = async () => {
    setTxActive(true);
    try {
      await deployDSProxyContract();
    } catch (error) {
      console.log(error);
      Sentry.captureException(error);
    }
    setTxActive(false);
  };

  const ref = useRef(null);
  useOnClickOutside(ref, () => {
    if (drawerOpen && isMobile) {
      setDrawerOpen(false);
    }
  });

  useEffect(() => {
    isReady && setDrawerOpen(!isMobile);
  }, [isReady]);

  const etherscanUrl =
    network === 1
      ? "https://etherscan.io"
      : `https://${networkName(network)}.etherscan.io`;

  return (
    <div className={classes.root}>
      <AppBar
        position="fixed"
        className={clsx(classes.appBar, {
          [classes.appBarShift]: drawerOpen
        })}
      >
        <Toolbar>
          <HoneyLemonLogo className={classes.logo} onClick={() => forwardTo("/")} />
          <Typography
            align="center"
            className={clsx(classes.title, { [classes.hide]: drawerOpen })}
            onClick={() => forwardTo("/")}
          >
            Honeylemon
          </Typography>
          <IconButton
            aria-label="open drawer"
            edge="end"
            onClick={handleDrawerOpen}
            className={clsx(
              classes.hamburger,
              { [classes.hide]: drawerOpen },
              { [classes.hide]: !isReady }
            )}
          >
            <Menu fontSize="large" />
          </IconButton>
        </Toolbar>
      </AppBar>
      <main
        className={clsx(classes.content, { [classes.contentDrawerOpen]: drawerOpen })}
      >
        <div>{props.children}</div>
        <Footer footerHeight={footerHeight} />
      </main>
      <Drawer
        ref={ref}
        className={clsx(classes.drawer, {
          [classes.drawerOpen]: drawerOpen
        })}
        variant="persistent"
        anchor="right"
        open={drawerOpen}
        classes={{
          paper: clsx(classes.drawerPaper, {
            [classes.drawerOpen]: drawerOpen
          })
        }}
      >
        <div className={classes.drawerHeader}>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === "rtl" ? (
              <ChevronLeft fontSize="large" />
            ) : (
              <ChevronRight fontSize="large" />
            )}
          </IconButton>
        </div>
        <Divider />
        <List>
          <ListItem>
            <ListItemIcon>
              <Language />
            </ListItemIcon>
            <ListItemText primary="Language" />
            <Select
              onChange={e => {
                //@ts-ignore
                setActiveLanguage(e.target.value);
              }}
              value={selectedLanguage}
            >
              {availableLanguages.map(l => (
                <MenuItem value={l.id} key={l.id}>
                  {l.label}
                </MenuItem>
              ))}
            </Select>
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem
            button
            onClick={() => handleNavigate("/")}
            selected={location.pathname === "/"}
          >
            <ListItemIcon>
              <Home />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItem>
          <ListItem
            button
            onClick={() => handleNavigate("/stats")}
            selected={location.pathname === "/stats"}
          >
            <ListItemIcon>
              <Whatshot />
            </ListItemIcon>
            <ListItemText primary="Live Market Stats" />
          </ListItem>
          <ListItem
            button
            onClick={() => handleNavigate("/buy")}
            selected={location.pathname === "/buy"}
            disabled={isInMaintenanceMode}
          >
            <ListItemIcon>
              <MonetizationOn />
            </ListItemIcon>
            <ListItemText primary="Buy Contract" />
          </ListItem>
          <ListItem
            button
            onClick={() => handleNavigate("/offer")}
            selected={location.pathname === "/offer"}
            disabled={isInMaintenanceMode}
          >
            <ListItemIcon>
              <Assessment />
            </ListItemIcon>
            <ListItemText primary="Offer Contract" />
          </ListItem>
          <ListItem
            button
            onClick={() => handleNavigate("/portfolio")}
            selected={location.pathname === "/portfolio"}
          >
            <ListItemIcon>
              <AccountBalance />
            </ListItemIcon>
            <ListItemText primary="Portfolio" />
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem
            onClick={() => setShowTokenInfoModal(true)}
            className={classes.menuHeading}
          >
            <ListItemText inset>
              <b>Manage My Wallet</b> <Info fontSize="small" />
            </ListItemText>
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <img
                src="eth.png"
                style={{ width: "40px", height: "40px" }}
                alt="eth logo"
              />
            </ListItemIcon>
            <ListItemText
              primary={`${(ethBalance || 0).toLocaleString(undefined, {
                useGrouping: true,
                maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS
              })}`}
              secondary="ETH"
              primaryTypographyProps={{
                align: "right",
                noWrap: true
              }}
              secondaryTypographyProps={{
                align: "right"
              }}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <img
                src="wbtc.png"
                style={{ width: "40px", height: "40px" }}
                alt="wbtc logo"
              />
            </ListItemIcon>
            <Switch
              color="primary"
              checked={collateralTokenAllowance > 0}
              onChange={() => handleToggleTokenApproval(TokenType.CollateralToken)}
              disabled={txActive}
            />
            <ListItemText
              primary={`${collateralTokenBalance.toLocaleString(undefined, {
                useGrouping: true,
                maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS
              })}`}
              secondary={COLLATERAL_TOKEN_NAME}
              primaryTypographyProps={{
                align: "right",
                noWrap: true
              }}
              secondaryTypographyProps={{
                align: "right"
              }}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <img
                src="usdt.png"
                style={{ width: "40px", height: "40px" }}
                alt="usdt logo"
              />
            </ListItemIcon>
            <Switch
              color="primary"
              checked={paymentTokenAllowance > 0}
              disabled={txActive}
              onChange={() => handleToggleTokenApproval(TokenType.PaymentToken)}
            />
            <ListItemText
              primary={`${paymentTokenBalance.toLocaleString(undefined, {
                useGrouping: true,
                maximumFractionDigits: PAYMENT_TOKEN_DECIMALS,
                minimumFractionDigits: 2
              })}`}
              secondary={PAYMENT_TOKEN_NAME}
              primaryTypographyProps={{
                align: "right",
                noWrap: true
              }}
              secondaryTypographyProps={{
                align: "right"
              }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primaryTypographyProps={{
                align: "right"
              }}
            >
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={() => window.open("https://tokenlon.im/", "_blank", "noopener")}
                className={classes.getMoreTokensButton}
              >
                Get More Tokens
              </Button>
            </ListItemText>
          </ListItem>
        </List>
        <Divider />
        <List>
          {network !== 1 && (
            <ListItem className={classes.menuHeading}>
              <ListItemText inset>
                <b>Network: {networkName(network).toUpperCase()}</b>
              </ListItemText>
            </ListItem>
          )}
          <ListItem>
            <ListItemIcon>
              <Avatar>
                <Blockies seed={address || "0x"} size={10} />
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{
                align: "right",
                noWrap: true
              }}
              secondary="Connected Wallet"
              secondaryTypographyProps={{
                align: "right"
              }}
            >
              <Link
                href={`${etherscanUrl}/address/${address}`}
                target="_blank"
                rel="noopener"
                underline="always"
              >
                {displayAddress(address || "0x", 20)}
              </Link>
            </ListItemText>
          </ListItem>
          {isDsProxyDeployed ? (
            <ListItem>
              <ListItemIcon>
                <Avatar>
                  <Blockies seed={dsProxyAddress || "0x"} size={10} />
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primaryTypographyProps={{
                  align: "right",
                  noWrap: true
                }}
                secondary="Honeylemon Vault"
                secondaryTypographyProps={{
                  align: "right"
                }}
              >
                <Link
                  href={`${etherscanUrl}/address/${dsProxyAddress}`}
                  target="_blank"
                  rel="noopener"
                  underline="always"
                >
                  {displayAddress(dsProxyAddress || "0x", 20)}
                </Link>
              </ListItemText>
            </ListItem>
          ) : (
            <ListItem>
              <Button
                variant="contained"
                className={classes.deployWalletButton}
                onClick={handleDeployDSProxy}
                disabled={txActive}
                fullWidth
              >
                Honeylemon Vault
              </Button>
            </ListItem>
          )}
        </List>
        <Divider />
        <List>
          <ListItem button onClick={handleLogout}>
            <ListItemIcon>
              <ExitToApp />
            </ListItemIcon>
            <ListItemText primary="Disconnect Wallet" />
          </ListItem>
        </List>
      </Drawer>
      <TokenInfoModal
        open={showTokenInfoModal}
        onClose={() => setShowTokenInfoModal(false)}
      />
    </div>
  );
}

export default AppWrapper;
