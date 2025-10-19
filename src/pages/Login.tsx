import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { queryClient } from "../app/queryClient";

export default function Login() {
  const nav = useNavigate();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/authentication/sign-in`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nickname, password }),
      }
    );
    if (res.ok) {
      await queryClient.invalidateQueries({ queryKey: ["auth-check"] });
      nav("/");
    } else if (res.status === 401) {
      alert("Invalid credentials");
    } else {
      alert("An error occurred. Please try again.");
    }
  }
  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h1 className="text-2xl" style={{ fontWeight: 700, marginTop: "72px" }}>
        Sign in
      </h1>
      <form
        onSubmit={onSubmit}
        className="card"
        style={{ marginTop: 16, display: "grid", gap: 10 }}
      >
        <input
          className="input"
          placeholder="Nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn">Login</button>
      </form>
      <p className="muted" style={{ marginTop: 12 }}>
        No account? <a href="/register">Create account</a>
      </p>
    </div>
  );
}
