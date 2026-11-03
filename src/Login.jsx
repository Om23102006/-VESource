import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "./context/UserContext";

function Login() {
  const { login } = useContext(UserContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.user?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#1F2937]">
      {/* Navbar */}
      <nav className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C90000] font-bold text-white shadow-sm">
              V
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#C90000] leading-none">VESource</h1>
              <p className="text-xs text-gray-500 mt-0.5">VESIT Student Portal</p>
            </div>
          </Link>
          <Link to="/" className="text-xs font-semibold text-gray-600 hover:text-[#C90000]">
            ← Back to Home
          </Link>
        </div>
      </nav>

      {/* Login Card */}
      <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 font-bold text-[#C90000]">
              V
            </div>
            <h2 className="mt-4 text-2xl font-bold text-[#1F2937]">Portal Login</h2>
            <p className="mt-1 text-xs text-gray-500">
              Sign in to manage academic documents &amp; scholarship applications
            </p>
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white p-7 sm:p-8 shadow-sm">
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. student@ves.ac.in"
                  required
                  className="w-full rounded-lg border border-[#E5E7EB] px-3.5 py-2.5 text-xs outline-none focus:border-[#C90000]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-lg border border-[#E5E7EB] px-3.5 py-2.5 text-xs outline-none focus:border-[#C90000]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 block w-full rounded-lg bg-[#C90000] py-2.5 text-center text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {loading ? "Authenticating..." : "Sign In to VESource"}
              </button>
            </form>

            <div className="mt-5 rounded-lg bg-[#F8F8F6] p-3 text-center border border-gray-100">
              <p className="text-[11px] text-gray-500">
                Staff / Admin credentials grant access to application verification tools.
              </p>
            </div>

            <p className="mt-5 text-center text-xs text-gray-500">
              New student?{" "}
              <Link to="/register" className="font-semibold text-[#C90000] hover:underline">
                Register an account
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-[11px] text-gray-400">
            © 2026 VESource • Vivekanand Education Society&apos;s Institute of Technology
          </p>
        </div>
      </main>
    </div>
  );
}

export default Login;
