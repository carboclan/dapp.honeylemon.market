import React from "react";
import {
  Typography,
  makeStyles,
  Grid,
  Table,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Link
} from "@material-ui/core";
import { ReactComponent as HoneyLemonLogo } from "../images/honeylemon-logo.svg";
import * as Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import SL from "highcharts/modules/series-label";
import { useHoneylemon } from "../contexts/HoneylemonContext";
import dayjs from "dayjs";
import MRIDisplay from "./MRIDisplay";
import { OpenInNew } from "@material-ui/icons";
import clsx from "clsx";
import { forwardTo } from "../helpers/history";
import { Trans } from "@lingui/macro";

SL(Highcharts);

const useStyles = makeStyles(({ palette }) => ({
  pageHeader: {
    fontWeight: "bold",
    color: palette.primary.main
  },
  winner: {
    width: 20,
    height: 20,
    cursor: "pointer"
  },
  honeylemonCell: {
    color: palette.primary.main
  },
  decrease: {
    color: palette.error.main
  },
  increase: {
    color: palette.success.main
  },
  heading: {
    color: palette.secondary.main
  }
}));

const MiningStatsPage: React.SFC = () => {
  const classes = useStyles();
  const {
    marketData: {
      currentMRI,
      currentBTCSpotPrice,
      btcDifficultyAdjustmentDate,
      miningContracts
    },
    PAYMENT_TOKEN_DECIMALS,
    orderbook,
    btcStats
  } = useHoneylemon();

  const contractDurations = [0, 90, 100, 180, 360, 365];
  const bestHoneylemonPrice =
    orderbook.length > 0 ? orderbook[0].price : currentMRI * currentBTCSpotPrice;

  const chartOptions: Highcharts.Options | undefined = miningContracts && {
    title: {
      text: `BTC Mining Contract Price Curve`,
      style: {
        fontSize: "15",
        color: "white"
      }
    },
    credits: {
      enabled: true,
      href: "https://honeylemon.market/",
      text: "honeylemon.market"
    },
    chart: {
      backgroundColor: "#000",
      style: {
        fontFamily: '"Roboto", Helvetica, Arial, sans-serif'
      },
      height: 300
    },
    yAxis: [
      {
        title: {
          text: `Best Price ($/TH/Day)`,
          style: { color: "white" }
        },
        labels: {
          style: { color: "#ccc" }
        },
        gridLineWidth: 0,
        minorGridLineWidth: 0,
        min: 0
      }
    ],
    xAxis: {
      type: "datetime",
      title: {
        text: "Expiration Date",
        style: { color: "white" }
      },
      labels: {
        style: { color: "#ccc" }
      },
      dateTimeLabelFormats: {
        month: "%b %Y",
        year: "%b %Y"
      },
      tickInterval: 365 * 86400 * 125,
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
          formatter: function() {
            // @ts-ignore
            return this.point.desc + "<br/>" + Highcharts.numberFormat(this.y || 0, 4);
          },
          style: { color: "#cece4b" }
        },
        enableMouseTracking: true
      }
    },
    tooltip: {
      useHTML: true,
      style: {
        pointerEvents: "auto"
      },
      formatter() {
        //@ts-ignore
        return `${this.point.desc}<br/> Best Price: $${this.y.toFixed(4)}/TH/Day<br/>
        `;
      }
    },
    series: [
      {
        name: "",
        type: "line",
        yAxis: 0,
        tooltip: {
          valueDecimals: 4,
          valueSuffix: `$/TH/Day`
        },
        dataLabels: { enabled: true },
        data: [
          {
            x: Date.now() + 28 * 1000 * 86400,
            y: bestHoneylemonPrice,
            //@ts-ignore
            desc: "honeylemon"
          }
        ],
        marker: {
          symbol: "url(favicon.ico)",
          width: 16,
          height: 16
        }
      },
      {
        name: "",
        type: "line",
        color: "#FFF",
        yAxis: 0,
        dataLabels: { style: { color: "white" } },
        tooltip: {
          valueDecimals: 4,
          valueSuffix: `$/TH/Day`
        },
        data: [
          ...miningContracts
            .filter(c => contractDurations.includes(c.duration))
            .sort((c1, c2) => (c1.duration < c2.duration ? -1 : 1))
            .map(c => ({
              x: Date.now() + c.duration * 1000 * 86400,
              y: c.contract_cost || c.contract_cost_btc * currentBTCSpotPrice,
              desc: c.durationAlias
            }))
        ]
      },
      {
        name: "",
        type: "line",
        color: "#2b908f",
        yAxis: 0,
        tooltip: {
          valueDecimals: 4,
          valueSuffix: `$/TH/Day`
        },
        dataLabels: { style: { color: "white" } },
        data: [
          ...miningContracts
            .filter(c => c.issuer === "FTX")
            .sort((c1, c2) => (c1.duration < c2.duration ? -1 : 1))
            .map(c => ({
              x: Date.now() + c.duration * 1000 * 86400,
              y: c.contract_cost || c.contract_cost_btc * currentBTCSpotPrice,
              desc: `FTX ${c.durationAlias}`
            }))
        ]
      },
      {
        name: "MRI_BTC",
        type: "spline",
        yAxis: 0,
        color: "#FF6600",
        enableMouseTracking: false,
        dataLabels: { enabled: false },
        marker: {
          enabled: false
        },
        dashStyle: "Dash",
        data: [
          [Date.now(), currentMRI * currentBTCSpotPrice],
          [Date.now() + 370 * 1000 * 86400, currentMRI * currentBTCSpotPrice]
        ]
      }
    ]
  };

  const difficultyChange =
    ((btcStats?.difficulty?.current - btcStats?.difficulty?.last) /
      btcStats?.difficulty?.last) *
    100;
  return (
    <Grid container direction="column" spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h6" className={classes.pageHeader}>
          <Trans>Bitcoin Mining Live Stats</Trans>
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Paper>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>
                  <Typography variant="caption">
                    <Trans>BTC Price</Trans>
                  </Typography>
                  <br />
                  <Typography variant="caption">
                    <Trans>24h Chg%</Trans>
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="caption">
                    ${" "}
                    {btcStats?.quote.price.toLocaleString(undefined, {
                      maximumFractionDigits: 2
                    })}
                  </Typography>
                  <br />
                  <Typography
                    variant="caption"
                    className={clsx(
                      { [classes.decrease]: btcStats?.quote?.percentChange24h < 0 },
                      { [classes.increase]: btcStats?.quote?.percentChange24h > 0 }
                    )}
                  >
                    {btcStats?.quote?.percentChange24h > 0 ? "+" : ""}{" "}
                    {btcStats?.quote?.percentChange24h.toLocaleString(undefined, {
                      maximumFractionDigits: 1
                    })}
                    %
                  </Typography>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Typography variant="caption">
                    <Trans>Difficulty</Trans>
                  </Typography>
                  <br />
                  <Typography variant="caption">
                    <Trans>Last Adj Chg%</Trans>
                  </Typography>
                  <br />
                  <Typography variant="caption">
                    <Trans>Next Adj Date</Trans>
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="caption">
                    {btcStats?.difficulty?.current.toLocaleString(undefined, {
                      maximumFractionDigits: 0
                    })}
                  </Typography>
                  <br />
                  <Typography
                    variant="caption"
                    className={clsx(
                      { [classes.decrease]: difficultyChange < 0 },
                      { [classes.increase]: difficultyChange > 0 }
                    )}
                  >
                    {`${
                      difficultyChange > 0 ? "+" : ""
                    } ${difficultyChange.toLocaleString(undefined, {
                      maximumFractionDigits: 1
                    })}`}
                    %
                  </Typography>
                  <br />
                  <Typography variant="caption">
                    {dayjs(btcDifficultyAdjustmentDate).format("MMM DD, YYYY")}
                  </Typography>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Typography variant="caption">
                    <Trans>24h Hashrate</Trans>
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="caption">
                    {(btcStats?.hashrate24h / 10 ** 9).toLocaleString(undefined, {
                      maximumFractionDigits: 0
                    })}{" "}
                    TH
                  </Typography>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Typography variant="caption">
                    <Trans>24h Mining Revenue</Trans>
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="caption">
                    ${" "}
                    {(
                      (btcStats?.reward24h?.total / 10 ** 8) *
                      currentBTCSpotPrice
                    ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </Typography>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Typography variant="caption">
                    <Trans>% Block Rewards</Trans>
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="caption">
                    {(
                      (btcStats?.reward24h?.block / btcStats?.reward24h?.total) *
                      100
                    ).toLocaleString(undefined, { maximumFractionDigits: 1 })}{" "}
                    %
                  </Typography>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Typography variant="caption">
                    <Trans>% Transaction Fee</Trans>
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="caption">
                    {(
                      (btcStats?.reward24h?.fees / btcStats?.reward24h?.total) *
                      100
                    ).toLocaleString(undefined, { maximumFractionDigits: 1 })}{" "}
                    %
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
      </Grid>
      <Grid item xs={12}>
        <MRIDisplay />
      </Grid>
      <Grid item xs={12}>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell className={classes.heading}>
                <strong>
                  <Trans>Spot Market</Trans>
                </strong>
              </TableCell>
              <TableCell style={{ width: 50 }}>
                <strong>($/TH/Day)</strong>
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Nicehash</TableCell>
              <TableCell>
                ${" "}
                {(
                  miningContracts.filter(c => c.id.toLowerCase().includes("nicehash"))[0]
                    ?.contract_cost_btc * currentBTCSpotPrice
                ).toLocaleString(undefined, {
                  maximumFractionDigits: PAYMENT_TOKEN_DECIMALS
                })}
              </TableCell>
              <TableCell style={{ width: 50 }} align="right">
                <Link
                  href="https://honeylemon.market/#/product-realtime?from=home&id=NICEHASH-STANDARD-SHA256&coin=BTC"
                  target="_blank"
                  rel="noopener"
                  style={{ color: "#FFF" }}
                >
                  <OpenInNew fontSize="small" />
                </Link>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className={classes.heading}>
                <strong>Forward Market</strong>
              </TableCell>
              <TableCell style={{ width: 50 }}>
                <strong>($/TH/Day)</strong>
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className={classes.honeylemonCell}>
                28-Day Mining Revenue Contract
              </TableCell>
              <TableCell className={classes.honeylemonCell}>
                ${" "}
                {bestHoneylemonPrice.toLocaleString(undefined, {
                  maximumFractionDigits: PAYMENT_TOKEN_DECIMALS
                })}
              </TableCell>
              <TableCell style={{ width: 50 }} align="right">
                <HoneyLemonLogo
                  className={classes.winner}
                  onClick={() => {
                    forwardTo("/buy");
                  }}
                />
              </TableCell>
            </TableRow>
            {miningContracts
              .filter(mc => mc.duration > 0 && contractDurations.includes(mc.duration))
              .sort((a, b) => (a.duration < b.duration ? -1 : 1))
              .map(mc => (
                <TableRow key={mc.durationAlias}>
                  <TableCell>{mc.durationAlias} Cloud Mining</TableCell>
                  <TableCell>
                    ${" "}
                    {miningContracts
                      .filter(c => c.duration === mc.duration)[0]
                      ?.contract_cost?.toLocaleString(undefined, {
                        maximumFractionDigits: PAYMENT_TOKEN_DECIMALS
                      })}
                  </TableCell>
                  <TableCell style={{ width: 50 }} align="right">
                    <Link
                      href={`https://honeylemon.market/#/products?coin=BTC&duration=${mc.duration}`}
                      target="_blank"
                      rel="noopener"
                      style={{ color: "#FFF" }}
                    >
                      <OpenInNew fontSize="small" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            <TableRow>
              <TableCell className={classes.heading}>
                <strong>
                  <Trans>Futures Market</Trans>
                </strong>
              </TableCell>
              <TableCell style={{ width: 50 }}>
                <strong>($/TH/Day)</strong>
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
            {miningContracts
              .filter(mc => mc.issuer === "FTX")
              .sort((a, b) => (a.duration < b.duration ? -1 : 1))
              .map(mc => (
                <TableRow key={mc.durationAlias}>
                  <TableCell>{`${mc.issuer} ${mc.id}`}</TableCell>
                  <TableCell>
                    ${" "}
                    {(mc.contract_cost_btc * currentBTCSpotPrice).toLocaleString(
                      undefined,
                      {
                        maximumFractionDigits: PAYMENT_TOKEN_DECIMALS
                      }
                    )}
                  </TableCell>
                  <TableCell style={{ width: 50 }} align="right">
                    <Link
                      href={`https://honeylemon.market/#/products?coin=BTC&duration=${mc.duration}`}
                      target="_blank"
                      rel="noopener"
                      style={{ color: "#FFF" }}
                    >
                      <OpenInNew fontSize="small" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            <TableRow>
              <TableCell colSpan={3}>
                <Typography variant="caption" style={{ color: "#a9a9a9" }}>
                  <Trans>
                    FTX hashrate futures are instrument on difficulty, price shown is
                    implied.
                  </Trans>
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Grid item xs={12} style={{ paddingTop: 16 }}>
          <Trans>Go to aggregator:</Trans>{" "}
          <Link
            href={`https://honeylemon.market/`}
            target="_blank"
            rel="noopener"
            variant="body2"
          >
            honeylemon.market
            <OpenInNew fontSize="small" />
          </Link>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default MiningStatsPage;
