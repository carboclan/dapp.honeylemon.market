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
    fontFamily: ['Montserrat', 'Roboto'].join(',')
  },
  overrides: {
  }
});

export default theme;
