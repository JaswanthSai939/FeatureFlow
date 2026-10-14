
import { useState } from "react";
import {
  loginUser,
  registerUser,
} from "../services/authService";

export default function AuthPage({ onAuthenticated }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      let data;

      if (isLogin) {
        data = await loginUser(email, password);
      } else {
        data = await registerUser(name, email, password);

        // Registration also returns a JWT.
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
      }

      onAuthenticated(data.user);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h1>FeatureFlow</h1>
        <p>
          {isLogin
            ? "Welcome back! Sign in to continue."
            : "Create an account to join the community."}
        </p>

        {!isLogin && (
          <input
            style={styles.input}
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            maxLength={60}
            required
          />
        )}

        <input
          style={styles.input}
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          maxLength={128}
          required
        />

        {error && <p style={styles.error}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={styles.button}
        >
          {loading
            ? "Please wait..."
            : isLogin
              ? "Sign In"
              : "Create Account"}
        </button>

        <p>
          {isLogin
            ? "Don't have an account?"
            : "Already have an account?"}{" "}
          <button
            type="button"
            style={styles.link}
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f6f7fb",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "380px",
    padding: "32px",
    margin: "16px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    boxSizing: "border-box",
    boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
  },
  input: {
    width: "100%",
    padding: "12px",
    margin: "8px 0",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "12px",
    marginTop: "12px",
    border: "none",
    borderRadius: "8px",
    background: "#635bff",
    color: "#fff",
    cursor: "pointer",
  },
  link: {
    border: "none",
    background: "transparent",
    color: "#635bff",
    cursor: "pointer",
  },
  error: {
    color: "#dc2626",
    fontSize: "14px",
  },
};
