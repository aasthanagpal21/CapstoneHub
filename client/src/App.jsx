
import { useState } from "react";
import "./App.css";
import Dashboard from "./Dashboard";
import MentorDashboard from "./MentorDashboard";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("capstonehub_user");
      const savedToken = localStorage.getItem("capstonehub_token");

      return savedUser && savedToken ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "login" : "register";

      const body = isLogin
        ? { email, password }
        : { name, email, password, role };

      const response = await fetch(
        `http://localhost:5000/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Something went wrong.");
      }

      if (isLogin) {
        localStorage.setItem("capstonehub_token", data.token);
        localStorage.setItem("capstonehub_user", JSON.stringify(data.user));
        setUser(data.user);
      } else {
        setMessage("Account created successfully! You can now log in.");
        setIsLogin(true);
        setPassword("");
      }
    } catch (error) {
      setMessage(
        error.message === "Failed to fetch"
          ? "Cannot connect to the server. Make sure the backend is running."
          : error.message
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("capstonehub_token");
    localStorage.removeItem("capstonehub_user");

    setUser(null);
    setIsLogin(true);
    setName("");
    setEmail("");
    setPassword("");
    setRole("student");
    setMessage("");
  }

  if (user) {
    if (user.role === "mentor") {
      return <MentorDashboard user={user} onLogout={handleLogout} />;
    }

    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <main className="auth-page">
      <section className="brand-panel">
        <div className="brand">
          <div className="brand-icon">C</div>
          <span>CapstoneHub</span>
        </div>

        <div className="brand-content">
          <span className="eyebrow">YOUR IDEAS. YOUR FUTURE.</span>
          <h1>Build something<br />that matters.</h1>
          <p>
            A smarter space to manage projects, collaborate with your team,
            and learn from mentors.
          </p>

          <div className="feature">
            <span className="feature-icon">✦</span>
            <div>
              <strong>Manage projects</strong>
              <p>Turn your ideas into real outcomes.</p>
            </div>
          </div>

          <div className="feature">
            <span className="feature-icon">↗</span>
            <div>
              <strong>Learn together</strong>
              <p>Collaborate and grow with mentors.</p>
            </div>
          </div>
        </div>

        <p className="brand-footer">A better way to build, together.</p>
      </section>

      <section className="form-panel">
        <div className="auth-card">
          <div className="mobile-brand">
            <div className="brand-icon">C</div>
            <span>CapstoneHub</span>
          </div>

          <div className="form-heading">
            <span className="eyebrow">
              {isLogin ? "WELCOME BACK" : "GET STARTED"}
            </span>
            <h2>{isLogin ? "Sign in to your account" : "Create your account"}</h2>
            <p>
              {isLogin
                ? "Enter your details to continue your journey."
                : "Join CapstoneHub and bring your ideas to life."}
            </p>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={isLogin ? "active" : ""}
              onClick={() => {
                setIsLogin(true);
                setMessage("");
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={!isLogin ? "active" : ""}
              onClick={() => {
                setIsLogin(false);
                setMessage("");
              }}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  minLength={2}
                  maxLength={80}
                  required
                />
              </>
            )}

            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder={isLogin ? "Enter your password" : "At least 8 characters"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={8}
              required
            />

            {!isLogin && (
              <>
                <label htmlFor="role">I am joining as</label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="student">Student</option>
                  <option value="mentor">Mentor</option>
                </select>
              </>
            )}

            {message && (
              <div
                className={`form-message ${
                  message.includes("successful") || message.includes("created")
                    ? "success"
                    : "error"
                }`}
                role="status"
              >
                {message}
              </div>
            )}

            <button className="submit-button" type="submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : isLogin
                  ? "Sign In →"
                  : "Create Account →"}
            </button>
          </form>

          <p className="switch-text">
            {isLogin ? "New to CapstoneHub?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage("");
              }}
            >
              {isLogin ? "Create an account" : "Sign in"}
            </button>
          </p>

          <p className="security-note">
            Your journey starts with a single step.
          </p>
        </div>
      </section>
    </main>
  );
}

export default App;
