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
    primary: {
      100: '#87d5ed',
      200: '#7ad1eb',
      300: '#68cbe8',
      400: '#56c4e6',
      500: '#4abfe3',
      600: '#3bacce',
      700: '#2e97b8',
      800: '#23829f',
      900: '#1b6f88',
    },
    secondary: {
      100: '#caecbb',
      200: '#c0e9af',
      300: '#b7e5a4',
      400: '#aee298',
      500: '#a5de8c',
      600: '#8ac770',
      700: '#74b25c',
      800: '#609e47',
      900: '#4c8835',
    },
  }
})

const AppTheme = extendTheme(theme)

export default AppTheme