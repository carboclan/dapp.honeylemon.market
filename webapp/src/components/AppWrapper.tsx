import React from 'react';
import clsx from 'clsx';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { Drawer, AppBar, Toolbar, Divider, IconButton, Typography, ListItem, ListItemIcon, ListItemText, List, ClickAwayListener } from '@material-ui/core';
import { Menu, ChevronLeft, ChevronRight, AccountBalance } from '@material-ui/icons';

import { forwardTo } from '../helpers/history';
import { ReactComponent as HoneyLemonLogo } from './../hl-logo.svg';

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  appBar: {
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    backgroundColor: '#424242',
    color: theme.palette.primary.main
  },
  appBarShift: {
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: drawerWidth,
  },
  logo: {
    flexGrow: 0,
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
    color: theme.palette.secondary.main,
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
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: 'flex-start',
  },
  content: {
    flexGrow: 1,
  },
  contentDrawerOpen: {
    marginRight: -drawerWidth
  }
}));

function AppWrapper(props: { children: any }) {
  const classes = useStyles();
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <div className={classes.root}>
      <AppBar
        position="fixed"
        className={clsx(classes.appBar, {
          [classes.appBarShift]: open,
        })}>
        <Toolbar>
          <HoneyLemonLogo className={classes.logo} />
          <Typography
            className={classes.title}
            onClick={() => forwardTo('/')}>
            honeylemon.market
          </Typography>
          <IconButton
            aria-label="open drawer"
            edge="end"
            onClick={handleDrawerOpen}
            className={clsx(classes.hamburger,
              { [classes.hide]: open })}>
            <Menu fontSize='large' />
          </IconButton>
        </Toolbar>
      </AppBar>
      <main className={clsx(classes.content, {[classes.contentDrawerOpen]: open})}>
        {props.children}
      </main>
      <ClickAwayListener onClickAway={() => console.log('click away')}>
        <Drawer
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
            <ListItem button onClick={() => forwardTo('/portfolio')}>
              <ListItemIcon><AccountBalance /></ListItemIcon>
              <ListItemText primary="Portfolio" />
            </ListItem>
          </List>
          <Divider />
        </Drawer>
      </ClickAwayListener>
    </div>
  );
}

export default AppWrapper;
