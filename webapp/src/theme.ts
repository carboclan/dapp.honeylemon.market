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
        backgroundColor: '#FFE500'
      }
    }
  }
});

export default theme;
