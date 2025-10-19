
import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from './ui/Layout'
import Login from './ui/Login'
import Register from './ui/Register'
import Scans from './ui/Scans'
import NewScan from './ui/NewScan'
import ScanDetails from './ui/ScanDetails'
import Protected from './ui/Protected'

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { element: <Protected />, children: [
    { element: <Layout />, children:[
      { path: '/', element: <Navigate to="/scans" replace /> },
      { path: '/scans', element: <Scans /> },
      { path: '/scans/new', element: <NewScan /> },
      { path: '/scans/:id', element: <ScanDetails /> },
    ] }
  ]}
])
