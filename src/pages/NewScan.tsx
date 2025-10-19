import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { queryClient } from "../app/queryClient";

type StartScanResponse = {
  target: string;
  date?: string;
  id?: string;
  status?: string;
};

export default function NewScan() {
  const nav = useNavigate();
  const [target, setTarget] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createScan(e: React.FormEvent) {
    e.preventDefault();
    if (!target.trim()) {
      setError("Please enter a target (IP / host)");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<StartScanResponse>(
        "/storage/azure-scanner/scan",
        { target }
      );
      await queryClient.invalidateQueries({ queryKey: ["available-scans"] });
      const t = res?.target ?? target;
      const d = res?.date;
      // Go straight to the scan details page so the user sees live progress
      nav(
        d
          ? `/scans/${encodeURIComponent(t)}?date=${encodeURIComponent(d)}`
          : `/scans/${encodeURIComponent(t)}`
      );
    } catch (err: any) {
      setError(err?.message ?? "Failed to start scan");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 600 }}>
      <h1>New Scan</h1>
      <form
        onSubmit={createScan}
        className="card"
        style={{ display: "grid", gap: 10 }}
      >
        <label>Target</label>
        <input
          className="input"
          placeholder="10.0.0.4"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          disabled={isSubmitting}
        />
        {error && (
          <div
            className="card"
            style={{ background: "#ffecec", color: "#a10000" }}
          >
            {error}
          </div>
        )}
        <div>
          <button className="btn" disabled={isSubmitting}>
            {isSubmitting ? "Starting…" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
