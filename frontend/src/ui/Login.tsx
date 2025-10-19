import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";

export default function Login() {
  const nav = useNavigate();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .userMessage {
        color: red;
        font-weight: 500;
        margin-top: 8px;
        text-align: center;
      }
      .userMessage::before {
        content: "⚠️ ";
      }
    `;
    document.head.appendChild(style);

    return () => style.remove(); 
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    try {
      await api.signin({ nickname, password });
      nav("/scans");
    } catch (e: unknown) {
      const error = e as Error;
      setErrorMsg(error.message || "Unknown error");
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h1>Login</h1>
      <form
        onSubmit={handleSubmit}
        className="card"
        style={{ display: "grid", gap: 10 }}
      >
        <input
          className="input"
          placeholder="Nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <input
          className="input"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn">Sign in</button>
      </form>

      {errorMsg && <p className="userMessage">{errorMsg}</p>}

      <p className="muted">
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
