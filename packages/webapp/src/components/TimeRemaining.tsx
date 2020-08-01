import React from "react";
import {
  Typography,
  CircularProgress,
  CircularProgressProps,
  Box} from "@material-ui/core";

const TimeRemaining = (
  props: CircularProgressProps & {
    totalDuration: number;
    remainingDuration: number;
    unitLabel: "d" | "h";
  }
) => {
  const { totalDuration, remainingDuration, unitLabel, ...cirularProgressProps } = props;
  return (
    <Box position="relative" display="inline-flex">
      <CircularProgress
        variant="static"
        {...cirularProgressProps}
        value={(1 - remainingDuration / totalDuration) * 100}
        color="primary"
      />
      <Box
        top={0}
        left={0}
        bottom={0}
        right={0}
        position="absolute"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Typography variant="caption" component="div" color="textSecondary">
          {`${remainingDuration}${unitLabel}`}
        </Typography>
      </Box>
    </Box>
  );
};

export default TimeRemaining;
