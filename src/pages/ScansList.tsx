import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Link } from "react-router-dom";
import Spinner from "../components/Spinner";

type ScanRow = { target: string; date?: string; status?: string };

export default function ScansList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["available-scans"],
    queryFn: () => api.get<any>("/storage/available-scans"),
  });
  if (isLoading)
    return (
      <div className="container">
        <Spinner />
      </div>
    );
  if (error) return <div className="card">Failed to load scans</div>;

  // Support both array response or { scans: [], total, ... }
  const items: ScanRow[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.scans)
    ? data.scans
    : [];

  return (
    <div>
      <div className="container">
        <div
          className="card"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0 }}>Scans</h2>
          <Link className="btn" to="/scans/new">
            New Scan
          </Link>
        </div>
        <div className="card" style={{ marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Target</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s: ScanRow, idx: number) => {
                const to = s.date
                  ? `/scans/${encodeURIComponent(
                      s.target
                    )}?date=${encodeURIComponent(s.date)}`
                  : `/scans/${encodeURIComponent(s.target)}`;
                return (
                  <tr key={idx}>
                    <td>
                      <Link to={to}>{s.target}</Link>
                    </td>
                    <td>{s.date ? new Date(s.date).toLocaleString() : "—"}</td>
                    <td>{s.status ?? "available"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
