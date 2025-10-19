
import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Dashboard from '../pages/Dashboard'
import ScansList from '../pages/ScansList'
import ScanDetails from '../pages/ScanDetails'
import NewScan from '../pages/NewScan'
import Assets from '../pages/Assets'
import NotFound from '../pages/NotFound'
import Layout from '../components/Layout'

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <Layout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'scans', element: <ScansList /> },
          { path: 'scans/new', element: <NewScan /> },
          { path: 'scans/:id', element: <ScanDetails /> },
          { path: 'assets', element: <Assets /> },
        ],
      }
    ]
  },
  { path: '*', element: <NotFound /> }
])
