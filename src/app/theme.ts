import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    dark: {
      palette: {
        primary: { main: '#edede8' },
        background: { default: '#181817' },
        text: { primary: '#edede8' },
      },
    },
    light: {
      palette: {
        primary: { main: '#191918' },
        background: { default: '#e8e8e6' },
        text: { primary: '#191918' },
      },
    },
  },
  typography: {
    fontFamily: 'Lato, sans-serif',
  },
});
