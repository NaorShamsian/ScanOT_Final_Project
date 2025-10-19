import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div className="container">
      <div className="card">
        <h1>404</h1>
        <p className="muted">Page not found.</p>
        <Link className="btn" to="/">
          Go home
        </Link>
      </div>
    </div>
  );
}
