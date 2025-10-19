import { NavLink, Outlet } from "react-router-dom";
export default function Layout() {
  return (
    <div className="container">
      <nav className="nav">
        <NavLink to="/login">Login</NavLink>
        <NavLink to="/scans">Scans</NavLink>
        <NavLink to="/scans/new">New Scan</NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
