import React, { ReactNode, useRef } from 'react';
import clsx from 'clsx';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { Drawer, AppBar, Toolbar, Divider, IconButton, Typography, ListItem, ListItemIcon, ListItemText, List, Avatar, Link } from '@material-ui/core';
import { Menu, ChevronLeft, ChevronRight, AccountBalance, Assessment, MonetizationOn, Whatshot, ExitToApp } from '@material-ui/icons';
import Blockies from 'react-blockies';

import { forwardTo } from '../helpers/history';
import { ReactComponent as HoneyLemonLogo } from '../images/honeylemon-logo.svg';
import { useOnboard } from '../contexts/OnboardContext';
import { useHoneylemon } from '../contexts/HoneylemonContext';
import Footer from './Footer';
import { useOnClickOutside } from '../helpers/useOnClickOutside';
import { networkName } from '../helpers/ethereumNetworkUtils';
import { displayAddress } from '../helpers/displayAddress';

const drawerWidth = 300;
const footerHeight = 150;

const useStyles = makeStyles(({ transitions, palette, mixins, spacing }) => ({
  root: {
    display: 'flex',
  },
  appBar: {
    transition: transitions.create(['margin', 'width'], {
      easing: transitions.easing.sharp,
      duration: transitions.duration.leavingScreen,
    }),
    backgroundColor: '#424242',
    color: palette.primary.main
  },
  appBarShift: {
    width: `calc(100% - ${drawerWidth}px)`,
    transition: transitions.create(['margin', 'width'], {
      easing: transitions.easing.easeOut,
      duration: transitions.duration.enteringScreen,
    }),
    marginRight: drawerWidth,
  },
  logo: {
    flexGrow: 0,
    cursor: 'pointer'
  },
  title: {
    flexGrow: 1,
    cursor: 'pointer',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hide: {
    display: 'none',
  },
  hamburger: {
    color: palette.secondary.main,
  },
  drawer: {
    flexShrink: 0,
  },
  drawerPaper: {
    width: 0,
  },
  drawerOpen: {
    width: drawerWidth,
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: spacing(0, 1),
    // necessary for content to be below app bar
    ...mixins.toolbar,
    minHeight: '64px',
    justifyContent: 'flex-start',
  },
  content: {
    flexGrow: 1,
  },
  contentDrawerOpen: {
    marginRight: -drawerWidth
  },
  contentWrapper: {
    paddingBottom: footerHeight,
  }
}));

function AppWrapper(props: { children: ReactNode }) {
  const classes = useStyles();
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const { isReady, address, network, resetOnboard } = useOnboard();
  const { 
    collateralTokenBalance, 
    COLLATERAL_TOKEN_DECIMALS, 
    COLLATERAL_TOKEN_NAME,
    paymentTokenBalance, 
    PAYMENT_TOKEN_DECIMALS,
    PAYMENT_TOKEN_NAME,
  } = useHoneylemon();

  const handleLogout = () => {
    resetOnboard();
    setOpen(false);
    forwardTo('/');
  }

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleNavigate = (path: string) => {
    forwardTo(path);
    setOpen(false);
  }

  const ref = useRef(null);
  useOnClickOutside(ref, () => {
    if (open) {
      setOpen(false)
    }
  })

  return (
    <div className={classes.root}>
      <AppBar
        position="fixed"
        className={clsx(classes.appBar, {
          [classes.appBarShift]: open,
        })}>
        <Toolbar>
          <HoneyLemonLogo className={classes.logo} onClick={() => forwardTo('/')} />
          <Typography
            className={clsx(classes.title,
              { [classes.hide]: open})}
            onClick={() => forwardTo('/')}>
            honeylemon.market
          </Typography>
          <IconButton
            aria-label="open drawer"
            edge="end"
            onClick={handleDrawerOpen}
            className={clsx(classes.hamburger,
              { [classes.hide]: open })}
            disabled={!isReady} >
            <Menu fontSize='large' />
          </IconButton>
        </Toolbar>
      </AppBar>
      <main className={clsx(classes.content, { [classes.contentDrawerOpen]: open })}>
        <div className={classes.contentWrapper}>
          {props.children}
        </div>
        <Footer footerHeight={footerHeight}/>
      </main>
      <Drawer
        ref={ref}
        className={clsx(classes.drawer, {
          [classes.drawerOpen]: open,
        })}
        variant="persistent"
        anchor="right"
        open={open}
        classes={{
          paper: clsx(classes.drawerPaper, {
            [classes.drawerOpen]: open
          }),
        }}
      >
        <div className={classes.drawerHeader}>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'rtl' ? <ChevronLeft fontSize='large' /> : <ChevronRight fontSize='large' />}
          </IconButton>
        </div>
        <Divider />
        <List>
          <ListItem>
            <ListItemIcon>
              <Avatar>
                <Blockies seed={address || '0x'} size={10} />
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{
                align: 'right',
                noWrap: true
              }}>
              <Link href={`https://${networkName(network)}.etherscan.io/address/${address}`} target="_blank" rel='noopener' underline='always' >
                {displayAddress(address || '0x', 20)}
              </Link>
            </ListItemText>
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem>
            <ListItemIcon>
              <img src='imBtc.png' style={{ width: '40px' }} alt='imbtc logo' />
            </ListItemIcon>
            <ListItemText
              primary={`${collateralTokenBalance.toLocaleString(undefined, {
                useGrouping: true,
                maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS,
              })}`}
              secondary={COLLATERAL_TOKEN_NAME}
              primaryTypographyProps={{
                align: 'right',
                noWrap: true,
              }}
              secondaryTypographyProps={{
                align: 'right'
              }} />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <img src='usdt.png' style={{ width: '40px' }} alt='usdt logo' />
            </ListItemIcon>
            <ListItemText
              primary={`${paymentTokenBalance.toLocaleString(undefined, {
                useGrouping: true,
                maximumFractionDigits: PAYMENT_TOKEN_DECIMALS,
                minimumFractionDigits: 2,
              })}`}
              secondary={PAYMENT_TOKEN_NAME}
              primaryTypographyProps={{
                align: 'right',
                noWrap: true,
              }}
              secondaryTypographyProps={{
                align: 'right'
              }} />
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem button onClick={() => handleNavigate('/portfolio')}>
            <ListItemIcon><AccountBalance /></ListItemIcon>
            <ListItemText primary="Portfolio" />
          </ListItem>
          <ListItem button onClick={() => handleNavigate('/offer')}>
            <ListItemIcon><Assessment /></ListItemIcon>
            <ListItemText primary="Offer Contract" />
          </ListItem>
          <ListItem button onClick={() => handleNavigate('/buy')}>
            <ListItemIcon><MonetizationOn /></ListItemIcon>
            <ListItemText primary="Buy Contract" />
          </ListItem>
          <ListItem button onClick={() => handleNavigate('/stats')}>
            <ListItemIcon><Whatshot /></ListItemIcon>
            <ListItemText primary="Live Market Stats" />
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem button onClick={handleLogout}>
            <ListItemIcon><ExitToApp /></ListItemIcon>
            <ListItemText primary="Log out" />
          </ListItem>
        </List>
      </Drawer>
    </div>
  );
}

export default AppWrapper;
