import React from "react";
import { Button, Typography, makeStyles, Grid, Divider } from "@material-ui/core";
import { forwardTo } from "../helpers/history";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { useOnboard } from "../contexts/OnboardContext";
import { useHoneylemon } from "../contexts/HoneylemonContext";
import ConnectWalletButton from "./ConnectWalletButton";
import DifficultyAdjustmentCountdown from "./DifficultyAdjustmentCountdown";
import MRIDisplay from "./MRIDisplay";
import { Trans } from "@lingui/macro";

dayjs.extend(duration);

const useStyles = makeStyles(({ palette, spacing }) => ({
  button: {
    paddingTop: spacing(1),
    paddingBottom: spacing(1),
    fontWeight: "bold"
  },
  divider: {
    margin: spacing(2)
  },
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
  },
  connectSpacer: {
    textAlign: "center"
  },
  loadingSpinner: {
    width: 20,
    flexBasis: "end",
    flexGrow: 0,
    color: palette.primary.main
  },
  mriInfo: {
    textAlign: "center"
  },
  liveStatsButton: {
    borderColor: palette.primary.main,
    borderWidth: 2,
    borderStyle: "solid",
    color: palette.primary.main,
    backgroundColor: "#303030"
  }
}));

const HomePage: React.SFC = () => {
  const { isReady } = useOnboard();
  const { isInMaintenanceMode } = useHoneylemon();
  const classes = useStyles();

  return (
    <Grid container direction="column" spacing={2}>
      <Grid item>
        <MRIDisplay />
      </Grid>
      <DifficultyAdjustmentCountdown />
      <Grid item xs={12} style={{ textAlign: "center" }}>
        <Button
          onClick={() => forwardTo("/stats")}
          className={classes.liveStatsButton}
          fullWidth
        >
          <Typography align="center" style={{ fontWeight: "bold" }}>
            <span role="img" aria-label="fire">
              🔥
            </span>
            <Trans>Mining Market Live Stats</Trans>
            <span role="img" aria-label="fire">
              🔥
            </span>
          </Typography>
        </Button>
      </Grid>
      <Grid item xs={12} className={classes.connectSpacer}>
        <ConnectWalletButton />
      </Grid>
      {isReady && (
        <>
          {isInMaintenanceMode ? (
            <Typography
              variant="caption"
              color="error"
              style={{ fontWeight: "bold" }}
              paragraph
            >
              <Trans>
                Honeylemon service is currently in maintenance mode. Please come back and
                try again later.
              </Trans>
            </Typography>
          ) : null}
          <Typography variant="h5" style={{ fontWeight: "bold" }}>
            <Trans>I am a BTC investor.</Trans>
          </Typography>
          <Typography color="primary" style={{ fontWeight: "bold" }} gutterBottom>
            <Trans>Pay Cash & Earn Mining Revenue in BTC</Trans>
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => forwardTo("/buy")}
            className={classes.button}
            disabled={isInMaintenanceMode}
          >
            <Trans>BUY CONTRACTS</Trans>
          </Button>
          <Divider className={classes.divider} />
          <Typography variant="h5" style={{ fontWeight: "bold" }}>
            <Trans>I am a BTC miner.</Trans>
          </Typography>
          <Typography color="primary" style={{ fontWeight: "bold" }}>
            <Trans>Hedge Mining Risk & Get Cash Upfront</Trans>
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => forwardTo("/offer")}
            className={classes.button}
            disabled={isInMaintenanceMode}
          >
            <Trans>OFFER CONTRACTS</Trans>
          </Button>
        </>
      )}
    </Grid>
  );
};

export default HomePage;
