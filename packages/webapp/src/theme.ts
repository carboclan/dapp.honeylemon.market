import createMuiTheme from "@material-ui/core/styles/createMuiTheme";

const theme = createMuiTheme({
  palette: {
    type: "dark",
    primary: {
      main: "#FFE500"
    },
    secondary: {
      main: "#FF6600"
    }
  },
  typography: {
    fontFamily: ["Montserrat"].join(",")
  },
  overrides: {
    MuiButton: {
      containedPrimary: {
        color: "#000",
        backgroundColor: "#FFE500",
        "&$disabled": {
          backgroundColor: "#4a4622"
        },
        "&:hover": {
          backgroundColor: "#4a4622"
        }
      }
    },
    MuiAppBar: {
      root: {
        minHeight: "64px"
      }
    },
    MuiToolbar: {
      regular: {
        minHeight: "64px",
        paddingLeft: "24px",
        paddingRight: "24px"
      }
    },
    MuiTableCell: {
      root: {
        fontSize: "0.75rem"
      }
    }
  }
});

export default theme;
