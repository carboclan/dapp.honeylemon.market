import React from 'react';
import { Typography, makeStyles, Grid, Table, TableHead, TableRow, TableCell, TableBody } from '@material-ui/core';
import { ReactComponent as HoneyLemonLogo } from '../images/honeylemon-logo.svg';
import * as Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import SL from 'highcharts/modules/series-label';
import { useHoneylemon } from '../contexts/HoneylemonContext';
SL(Highcharts);

const useStyles = makeStyles(({ palette }) => ({
  pageHeader: {
    fontWeight: 'bold',
    color: palette.secondary.main,
  },
  winner: {
    width: 20,
    height: 20,
  }
}))

const MiningStatsPage: React.SFC = () => {
  const classes = useStyles();
  // const {marketData} = useHoneylemon();
  const chartOptions: Highcharts.Options | undefined = undefined
  //  graphData && {
  //   title: {
  //     text: `BTC Mining Contracts Price over Maturities`,
  //     style: {
  //       fontSize: '15',
  //       color: 'white'
  //     }
  //   },

  //   credits: {
  //     enabled: true,
  //     href: 'https://honeylemon.market/',
  //     text: 'honeylemon.market'
  //   },

  //   chart: {
  //     backgroundColor: '#000',
  //     style: {
  //       fontFamily: '"Roboto", Helvetica, Arial, sans-serif'
  //     }
  //   },

  //   colors: ['#cece4b'],

  //   yAxis: [{
  //     title: {
  //       text: `Best Price ($/TH/Day)`,
  //       style: { color: 'white' }
  //     },
  //     labels: {
  //       style: { color: '#ccc' }
  //     },
  //     gridLineWidth: 0,
  //     minorGridLineWidth: 0,
  //     min: 0,
  //   }],

  //   xAxis: {
  //     type: 'datetime',
  //     title: {
  //       text: 'Expiration Date',
  //       style: { color: 'white' }
  //     },
  //     labels: {
  //       style: { color: '#ccc' }
  //     },
  //     dateTimeLabelFormats: {
  //       month: '%b %Y',
  //       year: '%b %Y'
  //     },
  //     tickInterval: 365 * 86400 * 1000,
  //     gridLineWidth: 0,
  //     tickWidth: 0,
  //     endOnTick: false
  //   },

  //   legend: {
  //     enabled: false
  //   },

  //   plotOptions: {
  //     spline: {
  //       states: {
  //         inactive: {
  //           opacity: 1
  //         }
  //       }
  //     },
  //     line: {
  //       states: {
  //         inactive: {
  //           opacity: 1
  //         }
  //       },
  //       dataLabels: {
  //         enabled: true,
  //         formatter: function () {
  //           return this.point.name + '<br/>' + Highcharts.numberFormat(this.y || 0, 4);
  //         },
  //         style: { color: '#cece4b' }
  //       },
  //       enableMouseTracking: true
  //     }
  //   },
  //   series: [{
  //     name: '',
  //     type: 'line',
  //     yAxis: 0,
  //     tooltip: {
  //       valueDecimals: 4,
  //       valueSuffix: `$/TH/Day`
  //     },
  //     data: [
  //       { x: Date.now(), y: nicehash.priceUsd * coinDesc[coin].unitFactor, desc: 'NiceHash', platforms: '' },
  //       ...this.summary.contracts.filter(c => c.duration <= 730).map(c => ({
  //         x: Date.now() + c.duration * 1000 * 86400,
  //         y: c.daily.preHalving.cost * coinDesc[coin].unitFactor,
  //         desc: c.durationAlias,
  //         duration: c.duration,
  //         platforms: 'Platforms: ' + this.summary.durationIssuers.get(c.durationAlias).size
  //       }))
  //     ]
  //   }, {
  //     name: 'Avg daily block rewards<br/>(assume constant price & difficulty)',
  //     type: 'spline',
  //     yAxis: 0,
  //     color: 'white',
  //     enableMouseTracking: false,
  //     dataLabels: { enabled: false },
  //     marker: {
  //       enabled: false
  //     },
  //     dashStyle: 'Dash',
  //     data: [
  //       [Date.now(), miningPayoff],
  //       ...(blockchain[coin].halvingTs > Date.now()) ?
  //         _
  //           .range(blockchain[coin].halvingTs, Date.now() + Math.min(maxDuration, 730) * 1000 * 86400, 1000 * 86400)
  //           .map(ts => [
  //             ts,
  //             miningPayoff * (blockchain[coin].halvingTs - Date.now() + (ts - blockchain[coin].halvingTs) / 2) / (ts - Date.now())
  //           ])
  //         : [
  //           [Date.now() + 730 * 1000 * 86400, miningPayoff]
  //         ]
  //     ]
  //   }]
  // }

  return (
    <Grid container direction='column' spacing={2}>
      <Grid item xs={12}>
        <Typography variant='h5' className={classes.pageHeader} align='center'>Live Stats</Typography>
      </Grid>
      <Grid item xs={12} container>
        <Grid item xs={8}>
          <Typography style={{ fontWeight: 'bold' }} color='secondary'>Miner Revenue Index:</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography align='right' style={{ fontWeight: 'bold' }}>$0.13 Th/d</Typography>
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <img src={process.env.PUBLIC_URL + '/mri-graph.png'} style={{ width: '100%', height: '200px' }} alt='graph' />
        <HighchartsReact
          highcharts={Highcharts}
          options={chartOptions} />
      </Grid>
      <Grid item xs={12}>
        <Typography>
          The Miner Renevue Index is a fair way to track the payoff of 1 Th/d of hashpower.
          Honeylemon contracts are the only contracts that settle to the Miner Revenue Index
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography style={{ fontWeight: 'bold' }} color='secondary'>
          Cloud Mining Contracts:
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Fee</TableCell>
              <TableCell>Best</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>honeylemon</TableCell>
              <TableCell>$ 0.115 Th/d</TableCell>
              <TableCell>Free</TableCell>
              <TableCell>
                <HoneyLemonLogo className={classes.winner} />
                <HoneyLemonLogo className={classes.winner} />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Spot</TableCell>
              <TableCell>$ 0.121 Th/d</TableCell>
              <TableCell>15%</TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>3 month</TableCell>
              <TableCell>$ 0.119 Th/d</TableCell>
              <TableCell>6%</TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>6 month</TableCell>
              <TableCell>$ 0.118 Th/d</TableCell>
              <TableCell>8%</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Grid>
    </Grid>
  )
}

export default MiningStatsPage;
