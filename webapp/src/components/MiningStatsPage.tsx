import React from 'react';
import { Typography, makeStyles, Grid, Table, TableRow, TableCell, TableBody, Paper, Link } from '@material-ui/core';
import { ReactComponent as HoneyLemonLogo } from '../images/honeylemon-logo.svg';
import * as Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import SL from 'highcharts/modules/series-label';
import { useHoneylemon } from '../contexts/HoneylemonContext';
import dayjs from 'dayjs';
import MRIDisplay from './MRIDisplay';
import { OpenInNew } from '@material-ui/icons';

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
  const {
    marketData: { currentMRI, currentBTCSpotPrice, btcDifficultyAdjustmentDate, miningContracts, currentBtcDifficulty },
    PAYMENT_TOKEN_DECIMALS,
    orderbook,
    btcStats,
  } = useHoneylemon();

  const contractDurations = [90, 180, 360];

  const bestHoneylemonPrice = (orderbook.length > 0) ? orderbook[0].price : currentMRI * currentBTCSpotPrice;

  const chartOptions: Highcharts.Options | undefined =
    miningContracts && {
      title: {
        text: `BTC Mining Contract Price Curve`,
        style: {
          fontSize: '15',
          color: 'white'
        }
      },

      credits: {
        enabled: true,
        href: 'https://honeylemon.market/',
        text: 'honeylemon.market'
      },

      chart: {
        backgroundColor: '#000',
        style: {
          fontFamily: '"Roboto", Helvetica, Arial, sans-serif'
        }
      },

      colors: ['#cece4b'],

      yAxis: [{
        title: {
          text: `Best Price ($/TH/Day)`,
          style: { color: 'white' }
        },
        labels: {
          style: { color: '#ccc' }
        },
        gridLineWidth: 0,
        minorGridLineWidth: 0,
        min: 0,
      }],

      xAxis: {
        type: 'datetime',
        title: {
          text: 'Expiration Date',
          style: { color: 'white' }
        },
        labels: {
          style: { color: '#ccc' }
        },
        dateTimeLabelFormats: {
          month: '%b %Y',
          year: '%b %Y'
        },
        tickInterval: 365 * 86400 * 1000,
        gridLineWidth: 0,
        tickWidth: 0,
        endOnTick: false
      },

      legend: {
        enabled: false
      },

      plotOptions: {
        spline: {
          states: {
            inactive: {
              opacity: 1
            }
          }
        },
        line: {
          states: {
            inactive: {
              opacity: 1
            }
          },
          dataLabels: {
            enabled: true,
            formatter: function () {
              // @ts-ignore
              return this.point.desc + '<br/>' + Highcharts.numberFormat(this.y || 0, 4);
            },
            style: { color: '#cece4b' }
          },
          enableMouseTracking: true
        }
      },
      series: [{
        name: '',
        type: 'line',
        yAxis: 0,
        tooltip: {
          valueDecimals: 4,
          valueSuffix: `$/TH/Day`
        },
        data: [
          ...miningContracts
            .concat({duration: 28, contract_cost: bestHoneylemonPrice, durationAlias: 'honeylemon'})
            .sort((c1, c2) => c1.duration < c2.duration ? -1 : 1)
            .filter(c => c.duration <= 730).map(c => ({
              x: Date.now() + c.duration * 1000 * 86400,
              y: c.contract_cost || c.contract_cost_btc * currentBTCSpotPrice,
              desc: c.durationAlias,
            }))
        ]
      },
      {
        name: 'Avg daily block rewards<br/>(assume constant price & difficulty)',
        type: 'spline',
        yAxis: 0,
        color: 'white',
        enableMouseTracking: false,
        dataLabels: { enabled: false },
        marker: {
          enabled: false
        },
        dashStyle: 'Dash',
        data: [
          [Date.now(), currentMRI * currentBTCSpotPrice],
          [Date.now() + 730 * 1000 * 86400, currentMRI * currentBTCSpotPrice]
        ]
      }
      ]
    }

  return (
    <Grid container direction='column' spacing={2}>
      <Grid item xs={12}>
        <Typography variant='h5' className={classes.pageHeader}>Bitcoin Mining Live Stats</Typography>
      </Grid>
      <Grid item xs={12}>
        <Paper>
          <Table size='small' >
            <TableBody>
              <TableRow>
                <TableCell>BTC Price (24h Δ%) </TableCell>
                <TableCell align='right'>$ {currentBTCSpotPrice.toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })}</TableCell>
                <TableCell align='right'>({btcStats?.quote?.percentChange24h}%)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Difficulty (Last Adj Δ%)</TableCell>
                <TableCell align='right'>{btcStats?.difficulty?.current.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                <TableCell align='right'>({(((btcStats?.difficulty?.current - btcStats?.difficulty?.last) / btcStats?.difficulty?.last) * 100).toLocaleString(undefined, { maximumFractionDigits: 4 })}%)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>24h Network Hashrate</TableCell>
                <TableCell align='right' colSpan={2}>{(btcStats?.hashrate24h / 10 ** 9).toLocaleString(undefined, { maximumFractionDigits: 0 })} TH</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>24h Total Mining Revenue</TableCell>
                <TableCell align='right' colSpan={2}>$ {btcStats?.reward24h?.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>% Block Rewards</TableCell>
                <TableCell align='right' colSpan={2}>{(btcStats?.reward24h?.block / btcStats?.reward24h?.total * 100).toLocaleString(undefined, { maximumSignificantDigits: 2 })} %</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>% Transaction Fee</TableCell>
                <TableCell align='right' colSpan={2}>{(btcStats?.reward24h?.fees / btcStats?.reward24h?.total * 100).toLocaleString(undefined, { maximumSignificantDigits: 2 })} %</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Next Difficulty Adjustment Date</TableCell>
                <TableCell colSpan={2} align='right'>{dayjs(btcDifficultyAdjustmentDate).format('MMM DD, YYYY HH:mm:ss')} UTC</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Typography variant='h5' className={classes.pageHeader}>Mining Revenue Contract Markets</Typography>
      </Grid>
      <Grid item xs={12}>
        <HighchartsReact
          highcharts={Highcharts}
          options={chartOptions} />
      </Grid>
      <Grid item xs={12}>
        <MRIDisplay />
      </Grid>
      <Grid item xs={12}>
        <Table size='small'>
          <TableBody>
            <TableRow>
              <TableCell>
                <strong>Spot Contract Price</strong>
              </TableCell>
              <TableCell style={{ width: 50 }}>
                <strong>($/TH/Day)</strong>
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Nicehash</TableCell>
              <TableCell>$ {(miningContracts.filter(c => c.id.toLowerCase().includes('nicehash'))[0]?.contract_cost_btc * currentBTCSpotPrice).toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })}</TableCell>
              <TableCell style={{ width: 50 }} align="right">
                <Link href='https://honeylemon.market/#/product-realtime?from=home&id=NICEHASH-STANDARD-SHA256&coin=BTC' target="_blank" rel="noopener"><OpenInNew /></Link>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <strong>Forward Contract Price</strong>
              </TableCell>
              <TableCell style={{ width: 50 }}>
                <strong>($/TH/Day)</strong>
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>28-Day Honeylemon</TableCell>
              <TableCell>$ {bestHoneylemonPrice.toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })}</TableCell>
              <TableCell style={{ width: 50 }} align="right">
                <HoneyLemonLogo className={classes.winner} />
              </TableCell>
            </TableRow>
            {miningContracts.filter(mc => mc.duration > 0 && contractDurations.includes(mc.duration))
              .sort((a, b) => (a.duration < b.duration) ? -1:1).map(mc => (
              <TableRow key={mc.durationAlias}>
                <TableCell>{mc.durationAlias} Cloud Mining</TableCell>
                <TableCell>$ {(miningContracts.filter(c => c.duration === mc.duration)[0]?.contract_cost)?.toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })}</TableCell>
                <TableCell style={{ width: 50 }} align="right">
                  <Link href={`https://honeylemon.market/#/products?coin=BTC&duration=${mc.duration}`} target="_blank" rel="noopener"><OpenInNew /></Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Grid>
    </Grid>
  )
}

export default MiningStatsPage;
