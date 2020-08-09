import React, { useEffect, useState } from "react";
import { Typography, makeStyles, Grid } from "@material-ui/core";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { useHoneylemon } from "../contexts/HoneylemonContext";
import { Trans } from "@lingui/macro";

dayjs.extend(duration);

const useStyles = makeStyles(({ palette, spacing }) => ({
  countdownDigit: {
    border: 3,
    borderStyle: "solid",
    borderColor: palette.primary.main,
    borderRadius: 4,
    fontSize: 20,
    fontWeight: "bold",
    padding: spacing(1),
    margin: spacing(0.5)
  },
  countdownSection: {
    textAlign: "center"
  }
}));

const DifficultyAdjustmentCountdown: React.FC = () => {
  const {
    marketData: { btcDifficultyAdjustmentDate }
  } = useHoneylemon();
  const [adjustmentInterval, setAdjustmentInterval] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00"
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setAdjustmentInterval({
        days: Math.floor(
          dayjs.duration(dayjs(btcDifficultyAdjustmentDate).diff(dayjs())).asDays()
        )
          .toString()
          .padStart(2, "0"),
        hours: dayjs
          .duration(dayjs(btcDifficultyAdjustmentDate).diff(dayjs()))
          .hours()
          .toString()
          .padStart(2, "0"),
        minutes: dayjs
          .duration(dayjs(btcDifficultyAdjustmentDate).diff(dayjs()))
          .minutes()
          .toString()
          .padStart(2, "0"),
        seconds: dayjs
          .duration(dayjs(btcDifficultyAdjustmentDate).diff(dayjs()))
          .seconds()
          .toString()
          .padStart(2, "0")
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [btcDifficultyAdjustmentDate]);

  const classes = useStyles();

  return (
    <Grid
      item
      container
      direction="row"
      className={classes.countdownSection}
      spacing={2}
      justify="center"
      alignItems="stretch"
    >
      <Grid item xs={12}>
        <Typography style={{ fontWeight: "bold" }}>
          <Trans>Next Difficulty Adjustment</Trans>
        </Typography>
      </Grid>
      <Grid item xs={3}>
        <span className={classes.countdownDigit}>
          {adjustmentInterval.days.split("")[0]}
        </span>
        <span className={classes.countdownDigit}>
          {adjustmentInterval.days.split("")[1]}
        </span>
      </Grid>
      <Grid item xs={3}>
        <span className={classes.countdownDigit}>
          {adjustmentInterval.hours.split("")[0]}
        </span>
        <span className={classes.countdownDigit}>
          {adjustmentInterval.hours.split("")[1]}
        </span>
      </Grid>
      <Grid item xs={3}>
        <span className={classes.countdownDigit}>
          {adjustmentInterval.minutes.split("")[0]}
        </span>
        <span className={classes.countdownDigit}>
          {adjustmentInterval.minutes.split("")[1]}
        </span>
      </Grid>
      <Grid item xs={3}>
        <span className={classes.countdownDigit}>
          {adjustmentInterval.seconds.split("")[0]}
        </span>
        <span className={classes.countdownDigit}>
          {adjustmentInterval.seconds.split("")[1]}
        </span>
      </Grid>
      <Grid item xs={3}>
        <span>
          <Trans>Days</Trans>
        </span>
      </Grid>
      <Grid item xs={3}>
        <span>
          <Trans>Hours</Trans>
        </span>
      </Grid>
      <Grid item xs={3}>
        <span>
          <Trans>Mins</Trans>
        </span>
      </Grid>
      <Grid item xs={3}>
        <span>
          <Trans>Secs</Trans>
        </span>
      </Grid>
      <Grid item xs={12}>
        <Typography style={{ fontWeight: "bold" }}>
          <Trans>Estimate:</Trans>&nbsp;
          {dayjs(btcDifficultyAdjustmentDate).format("MMM DD, YYYY HH:mm")}
          &nbsp; UTC
        </Typography>
      </Grid>
    </Grid>
  );
};

export default DifficultyAdjustmentCountdown;
