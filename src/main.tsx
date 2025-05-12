import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Root from './routes/Root.jsx'
import List from './routes/List.jsx'
import AppTheme from './theme.tsx'
import { ChakraProvider } from '@chakra-ui/react'

const START_YEAR = 2015;

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root startYear={START_YEAR} />,
  },
  {
    path: "/:year",
    element: <List startYear={START_YEAR}/>,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider theme={AppTheme}>
      <RouterProvider router={router} />
    </ChakraProvider>
  </React.StrictMode>,
)
