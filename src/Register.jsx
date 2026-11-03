import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "./context/UserContext";

function Register() {
  const { register } = useContext(UserContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      return setError("Password must be at least 8 characters");
    }
    if (!/[A-Z]/.test(form.password)) {
      return setError("Password must contain at least one uppercase letter");
    }
    if (!/[0-9]/.test(form.password)) {
      return setError("Password must contain at least one numeric digit");
    }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/dashboard");
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

      {/* Register Card */}
      <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 font-bold text-[#C90000]">
              V
            </div>
            <h2 className="mt-4 text-2xl font-bold text-[#1F2937]">Create Student Account</h2>
            <p className="mt-1 text-xs text-gray-500">
              Register to submit scholarships and store documents in your vault
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
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Atharva Joshi"
                  required
                  className="w-full rounded-lg border border-[#E5E7EB] px-3.5 py-2.5 text-xs outline-none focus:border-[#C90000]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. student.email@ves.ac.in"
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
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min 8 chars, 1 uppercase, 1 digit"
                  required
                  className="w-full rounded-lg border border-[#E5E7EB] px-3.5 py-2.5 text-xs outline-none focus:border-[#C90000]"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Must be at least 8 characters with 1 uppercase letter and 1 number.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 block w-full rounded-lg bg-[#C90000] py-2.5 text-center text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {loading ? "Creating Account..." : "Register Account"}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-gray-500">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-[#C90000] hover:underline">
                Sign in
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

export default Register;
