import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  fonts: {
    heading: 'Roboto,sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"',
    body: 'Roboto, sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"',
  },
  colors: {
    impact: {
      100: '#ffa299',
      200: '#ff938a',
      300: '#ff8c80',
      400: '#ff7c70',
      500: '#ff6e61',
      600: '#e1594c',
      700: '#c4463b',
      800: '#aa362c',
      900: '#922a20',
    },
  }
})

const AppTheme = extendTheme(theme)

export default AppTheme