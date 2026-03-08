import { useState, useContext } from "react";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await API.post("/auth/login", { email, password });
      login(res.data.token);

      if (res.data.role === "admin") navigate("/admin");
      if (res.data.role === "faculty") navigate("/faculty");
      if (res.data.role === "student") navigate("/student");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        (err?.code === "ECONNABORTED"
          ? "Request timeout. Backend may be down."
          : "Unable to connect to server.");

      setError(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="relative w-full max-w-xl">
        <div className="absolute -top-8 -left-8 h-28 w-28 bg-teal-200 rounded-full blur-2xl opacity-70" />
        <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-orange-200 rounded-full blur-2xl opacity-70" />

        <div className="glass-card p-10 relative">
          <p className="text-xs uppercase tracking-[0.32em] font-bold text-teal-700 mb-3">Welcome Back</p>
          <h2 className="text-5xl font-black mb-2 text-slate-800">Attendance Hub</h2>
          <p className="text-slate-500 mb-8">Sign in to continue managing classes and attendance insights.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3.5 rounded-xl border border-slate-200 bg-white/90 focus:outline-none focus:ring-2 focus:ring-teal-300"
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3.5 rounded-xl border border-slate-200 bg-white/90 focus:outline-none focus:ring-2 focus:ring-teal-300"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-700 to-teal-500 text-white py-3.5 rounded-xl hover:translate-y-[-1px] transition font-semibold shadow-lg"
            >
              Login
            </button>
            {error && <p className="text-red-600 text-sm font-semibold">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
