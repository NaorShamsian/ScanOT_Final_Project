import { useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import Spinner from "../components/Spinner";

type ScanDataResponse = {
  status?: "queued" | "running" | "completed" | "failed";
  items?: any[];
  [key: string]: any;
};

export default function ScanDetails() {
  const { id: target } = useParams();
  const [params] = useSearchParams();
  const date = params.get("date") || undefined;

  const { data, isLoading, error, isFetching } = useQuery<ScanDataResponse>({
    queryKey: ["scan-data", target, date],
    queryFn: () => {
      const base = `/storage/scan-data/${target}`;
      const url = date ? `${base}?date=${encodeURIComponent(date)}` : base;
      return api.get<ScanDataResponse>(url);
    },
    enabled: !!target,
    // Poll while not completed/failed
    refetchInterval: (q) => {
      const d: ScanDataResponse | undefined = q.state.data as any;
      const status = d?.status || d?.meta?.status;
      if (!d || status === "queued" || status === "running") return 3000;
      return false;
    },
  });

  if (isLoading)
    return (
      <div className="container">
        <Spinner />
      </div>
    );
  if (error) return <div className="card">Failed to load scan</div>;

  const items = Array.isArray(data as any) ? (data as any) : data?.items ?? [];
  const status = data?.status || (items.length ? "completed" : "running");

  return (
    <div className="container">
      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Scan: {target}</h2>
          <p className="muted" style={{ margin: 0 }}>
            {date ? (
              <>Started at: {new Date(date).toLocaleString()}</>
            ) : (
              "Latest results"
            )}
          </p>
        </div>
        <div>
          <Link to="/scans" className="btn">
            Back to scans
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <strong>Status:</strong>
          <span>
            {status}
            {isFetching ? " …" : ""}
          </span>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Findings</h3>
        {items.length === 0 ? (
          <div className="muted" style={{ padding: "12px 0" }}>
            {status === "failed"
              ? "Scan failed. Please try again."
              : "No findings yet. If the scan is running, this will update automatically."}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {items.map((f: any, idx: number) => (
                <tr key={idx}>
                  <td>{f.title ?? f.name ?? f.path ?? "—"}</td>
                  <td>
                    {(f.severity ?? f.level ?? "info").toString().toUpperCase()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
