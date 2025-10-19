import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();
  const [nickname, setNickname] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/authentication/sign-up`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ nickname, firstName, lastName, password }),
        }
      );
      if (res.ok) {
        alert("Registered successfully. Please sign in.");
        nav("/login");
      } else {
        let msg = "Registration failed";
        try {
          const j = await res.json();
          msg = j.message || msg;
        } catch {
          alert(msg);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <h1 className="text-2xl" style={{ fontWeight: 700, marginTop: "48px" }}>
        Create account
      </h1>
      <form
        onSubmit={onSubmit}
        className="card"
        style={{ marginTop: 16, display: "grid", gap: 10 }}
      >
        <div>
          <label>Nickname</label>
          <input
            className="input"
            placeholder="1–16 chars"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            minLength={1}
            maxLength={16}
          />
        </div>
        <div className="row">
          <div style={{ flex: 1 }}>
            <label>First name</label>
            <input
              className="input"
              placeholder="1–16"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              minLength={1}
              maxLength={16}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Last name</label>
            <input
              className="input"
              placeholder="1–16"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              minLength={1}
              maxLength={16}
            />
          </div>
        </div>
        <div>
          <label>Password</label>
          <input
            className="input"
            type="password"
            placeholder="8–16 chars"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            maxLength={16}
          />
        </div>
        <div>
          <button className="btn" disabled={loading}>
            {loading ? "Working…" : "Create account"}
          </button>
        </div>
      </form>
    </div>
  );
}
