import React from "react";
import {
  makeStyles,
  Paper,
  Container,
  Grid,
  Typography,
  Divider
} from "@material-ui/core";
import { GitHub, Telegram, School } from "@material-ui/icons";

const useStyles = makeStyles(({ palette, spacing }) => ({
  footer: {
    bottom: 0,
    left: 0,
    right: 0,
    textAlign: "center"
  },
  footerContents: {
    padding: spacing(2)
  },
  divider: {
    margin: spacing(1)
  },
  footerLink: {
    cursor: "pointer"
  }
}));

interface FooterLinkProps {
  url: string;
  label: string;
}

const FooterLink: React.SFC<FooterLinkProps> = ({ url, label, children }) => {
  const classes = useStyles();

  return (
    <Grid
      item
      xs={4}
      onClick={() => window.open(url, "_blank")}
      className={classes.footerLink}
    >
      {children}
      <Typography>{label}</Typography>
    </Grid>
  );
};

interface FooterProps {
  footerHeight: number;
}

const Footer: React.SFC<FooterProps> = (props: FooterProps) => {
  const classes = useStyles(props);

  return (
    <Paper square className={classes.footer}>
      <Container maxWidth="sm">
        <Grid
          container
          direction="row"
          spacing={1}
          className={classes.footerContents}
          justify="space-between"
          alignContent="center"
        >
          <FooterLink
            label="GITHUB"
            url="https://github.com/carboclan/dapp.honeylemon.market"
          >
            <GitHub />
          </FooterLink>
          <FooterLink
            label="DOCS"
            url="https://docs.honeylemon.market/btc-mining-revenue-contract-1"
          >
            <School />
          </FooterLink>
          <FooterLink label="TELEGRAM" url="https://t.me/joinchat/I9o0JBU3JKkxb-yRSkIFvA">
            <Telegram />
          </FooterLink>
          <Grid item xs={12}>
            <Divider className={classes.divider} light variant="fullWidth" />
          </Grid>
          <Grid item xs={12}>
            <Typography>Copyright © 2020 honeylemon.market</Typography>
            <Typography
              onClick={() => localStorage.clear()}
              variant="caption"
              style={{ fontSize: 6 }}
            >
              {process.env.REACT_APP_SENTRY_ENV?.toLocaleUpperCase()} BUILD: {process.env.REACT_APP_SENTRY_RELEASE?.toUpperCase()}
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </Paper>
  );
};

export default Footer;
