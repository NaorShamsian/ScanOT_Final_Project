
import { NavLink, Outlet } from 'react-router-dom'
export default function Layout(){
  return (
    <div className="container">
      <nav className="nav">
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/scans">Scans</NavLink>
        <NavLink to="/scans/new">New Scan</NavLink>
        <NavLink to="/assets">Assets</NavLink>
      </nav>
      <Outlet />
    </div>
  )
}
