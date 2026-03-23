import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, Loader2, AlertTriangle, UserPlus } from "lucide-react";
import { SentinelLogo } from "../components/branding/SentinelLogo";
import { getApiBase, readFetchError } from "../api.js";
import { isAuthenticated } from "./LoginPage.jsx";

const API = getApiBase();

export default function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated()) return <Navigate to="/app" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const msg = await readFetchError(res);
        throw new Error(msg || "Registration failed");
      }
      const data = await res.json();
      localStorage.setItem("sentinel_token", data.access_token);
      navigate("/app", { replace: true });
    } catch (err) {
      if (err.message === "Failed to fetch") {
        setError(
          "Network error: Cannot reach the API. Check backend URL, or CORS (SENTINEL_CORS_ORIGINS must include this site's origin).",
        );
      } else {
        setError(err.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg" aria-hidden>
        <div className="login-bg__blob login-bg__blob--1" />
        <div className="login-bg__blob login-bg__blob--2" />
        <div className="login-bg__blob login-bg__blob--3" />
        <div className="login-bg__grid" />
      </div>

      <div className="login-card">
        <div className="login-card__header">
          <div className="mb-4">
            <SentinelLogo size="lg" variant="lockup" />
          </div>
          <p className="login-card__subtitle">Create Scanner Account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-card__form">
          <div className="login-field">
            <label htmlFor="username" className="login-field__label">Username</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              autoFocus
              required
              minLength={3}
              className="login-field__input"
              placeholder="new user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="login-field">
            <label htmlFor="password" className="login-field__label">Password</label>
            <div className="login-field__input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={6}
                className="login-field__input login-field__input--with-icon"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="login-field__eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /><span>Creating account...</span></>
            ) : (
              <><UserPlus className="h-4 w-4" /><span>Create Account</span></>
            )}
          </button>
        </form>

        <p className="login-card__hint">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
