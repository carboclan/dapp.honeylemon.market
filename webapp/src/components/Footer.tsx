import React, { ReactChild } from 'react';
import { makeStyles, Paper, Container, Grid, Typography, Divider, SvgIconProps } from '@material-ui/core';
import { GitHub, Telegram, School } from '@material-ui/icons';

const useStyles = makeStyles(({ palette, spacing }) => ({
  footer: {
    marginTop: spacing(8),
    bottom: 0,
    left: 0,
    right: 0,
    textAlign: 'center'
  },
  footerContents: {
    padding: spacing(2)
  },
  divider: {
    margin: spacing(1),
  },
  footerLink: {
    cursor: 'pointer',
  }
}))

interface FooterLinkProps {
  url: string,
  label: string,
}

const FooterLink: React.SFC<FooterLinkProps> = ({ url, label, children }) => {
  const classes = useStyles();

  return (
    <Grid item xs={4} direction='column' onClick={() => window.open(url, '_blank')} className={classes.footerLink}>
      {children}
      <Typography>{label}</Typography>
    </Grid>
  )
}

const Footer: React.SFC = () => {
  const classes = useStyles();

  return (
    <Paper square className={classes.footer}>
      <Container maxWidth='sm'>
        <Grid container direction='row' spacing={2} className={classes.footerContents}>
          <FooterLink label='GITHUB' url='https://github.com/carboclan/dapp.honeylemon.market'>
            <GitHub />
          </FooterLink>
          <FooterLink label='WHITEPAPER' url='https://github.com/carboclan/pm/blob/master/research/Honeylemon/HoneyLemonWhitepaper.md'>
            <School />
          </FooterLink>
          <FooterLink label='TELEGRAM' url='https://t.me/joinchat/I9o0JBU3JKkxb-yRSkIFvA'>
            <Telegram />
          </FooterLink>
          <Grid item xs={12}>
            <Divider className={classes.divider} light variant='fullWidth' />
          </Grid>
          <Grid item xs={12}>
            <Typography>Copyright © 2020 honeylemon.market</Typography>
          </Grid>
        </Grid>
      </Container>
    </Paper>
  )
}

export default Footer;
