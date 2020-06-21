import createMuiTheme from '@material-ui/core/styles/createMuiTheme';


const theme = (createMuiTheme)({
  palette: {
    type: 'dark',
    primary: {
      main: '#FFFFFF',
    },
    secondary: {
      main: '#FFE500'
    }
  },
  typography: {
    fontFamily: ['Montserrat'].join(',')
  },
  overrides: {
    MuiButton: {
      root: {
        color: '#000',
        backgroundColor: '#FFE500',
        "&$disabled": {
          "backgroundColor": "#4a4622"
        },
        "&:hover": {
          "backgroundColor": "#4a4622"
        }
      },
    },
    MuiAppBar: {
      root: {
        minHeight: '64px'
      },
    },
    MuiToolbar: {
      regular: {
        minHeight: '64px',
        paddingLeft: '24px',
        paddingRight: '24px',
      },
    }
  }
});

export default theme;
