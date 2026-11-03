import { useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "./context/UserContext";

function Home() {
  const { user } = useContext(UserContext);

  return (
    <div className="min-h-screen bg-white text-[#1F2937]">
      {/* Navbar */}
      <nav className="border-b border-[#E5E7EB] bg-white sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C90000] font-bold text-white shadow-sm">
              V
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#C90000] leading-none">
                VESource
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                VESIT Student Resource &amp; Scholarship Portal
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-7 md:flex text-sm">
            <Link to="/" className="font-semibold text-[#C90000]">
              Home
            </Link>
            <a href="#features" className="text-gray-600 hover:text-[#C90000] transition-colors">
              Features
            </a>
            <a href="#scholarships" className="text-gray-600 hover:text-[#C90000] transition-colors">
              Scholarships
            </a>
            <a href="#vault" className="text-gray-600 hover:text-[#C90000] transition-colors">
              Document Vault
            </a>
            <a href="#workflow" className="text-gray-600 hover:text-[#C90000] transition-colors">
              Workflow
            </a>
            <Link to="/chat" className="text-gray-600 hover:text-[#C90000] transition-colors">
              Live Chat
            </Link>

            {user ? (
              <Link
                to="/dashboard"
                className="rounded-lg bg-[#C90000] px-4 py-2 font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-lg border border-[#C90000] px-4 py-2 font-semibold text-[#C90000] hover:bg-red-50 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-[#C90000] px-4 py-2 font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#C90000]">
                VESIT Student Resource &amp; Scholarship Portal
              </p>

              <h2 className="text-4xl font-extrabold leading-tight text-[#1F2937] md:text-5xl">
                Your Academic Documents.
                <br />
                Your Scholarships.
                <br />
                <span className="text-[#C90000]">One Unified Source.</span>
              </h2>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-600">
                Store marksheets and identity certificates securely in your private Document Vault, discover MahaDBT and institutional scholarship schemes, submit forms online, and track college verification in real time.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={user ? "/dashboard" : "/login"}
                  className="rounded-lg bg-[#C90000] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
                >
                  {user ? "Open Student Dashboard" : "Get Started"}
                </Link>

                <a
                  href="#scholarships"
                  className="rounded-lg border border-[#E5E7EB] bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Explore Schemes
                </a>
              </div>
            </div>

            {/* Dashboard Live Preview Card */}
            <div>
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F8F8F6] p-6 shadow-sm">
                <div className="border-b border-[#E5E7EB] pb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Live Portal Overview
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-[#1F2937]">
                    Student Portal Dashboard
                  </h3>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-[#E5E7EB] bg-white p-3.5 text-center">
                    <p className="text-[11px] text-gray-500">Vault Docs</p>
                    <p className="mt-1 text-2xl font-bold text-[#1F2937]">05</p>
                  </div>
                  <div className="rounded-lg border border-[#E5E7EB] bg-white p-3.5 text-center">
                    <p className="text-[11px] text-gray-500">Applications</p>
                    <p className="mt-1 text-2xl font-bold text-[#1F2937]">02</p>
                  </div>
                  <div className="rounded-lg border border-[#E5E7EB] bg-white p-3.5 text-center">
                    <p className="text-[11px] text-gray-500">Pending</p>
                    <p className="mt-1 text-2xl font-bold text-amber-600">01</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2.5">
                  <div className="rounded-lg border border-[#E5E7EB] bg-white p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#1F2937]">
                        Rajarshi Shahu Maharaj EBC Scheme
                      </p>
                      <p className="text-[11px] text-gray-400">
                        College staff verification complete
                      </p>
                    </div>
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-semibold text-green-700">
                      Approved
                    </span>
                  </div>

                  <div className="rounded-lg border border-[#E5E7EB] bg-white p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#1F2937]">
                        Post Matric Scholarship for OBC
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Under college review
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700">
                      Under Review
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-y border-[#E5E7EB] bg-[#F8F8F6] py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center max-w-xl mx-auto">
              <p className="text-xs font-bold uppercase tracking-wide text-[#C90000]">
                Key Capabilities
              </p>
              <h3 className="mt-1.5 text-3xl font-extrabold text-[#1F2937]">
                Everything in One Unified Portal
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Eliminating repeated paperwork and physical office queues with digital workflows.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div id="vault" className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-2xl">
                  📁
                </div>
                <h4 className="mt-4 text-base font-bold text-[#1F2937]">
                  Document Vault
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-gray-600">
                  Securely upload 10th/12th marksheets, Income certificates, and caste credentials once. Reuse them across all applications with role-based access control.
                </p>
              </div>

              <div id="scholarships" className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-2xl">
                  🎓
                </div>
                <h4 className="mt-4 text-base font-bold text-[#1F2937]">
                  Scholarships Catalog
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-gray-600">
                  Browse MahaDBT, EBC, OBC, Minority, and institutional merit-cum-means schemes with clear eligibility criteria, deadlines, and required document checklists.
                </p>
              </div>

              <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-2xl">
                  📤
                </div>
                <h4 className="mt-4 text-base font-bold text-[#1F2937]">
                  Online Application
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-gray-600">
                  Submit scholarship forms directly with academic details (department, roll number, income) and attach verified documents with a single click.
                </p>
              </div>

              <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-2xl">
                  ✓
                </div>
                <h4 className="mt-4 text-base font-bold text-[#1F2937]">
                  Live Verification &amp; Corrections
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-gray-600">
                  Track verification status via a multi-step pipeline. Receive real-time staff correction requests and re-submit corrected proofs seamlessly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section id="workflow" className="mx-auto max-w-7xl px-6 py-16">
          <div className="text-center max-w-xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-wide text-[#C90000]">
              End-to-End Process
            </p>
            <h3 className="mt-1.5 text-3xl font-extrabold text-[#1F2937]">
              From Upload to Sanction
            </h3>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-5 text-center">
            {[
              { num: "1", title: "Upload", desc: "Save documents in Vault" },
              { num: "2", title: "Select", desc: "Pick eligible scheme" },
              { num: "3", title: "Submit", desc: "Submit application online" },
              { num: "4", title: "Verify", desc: "College staff reviews" },
              { num: "5", title: "Sanction", desc: "Track final approval" },
            ].map((step) => (
              <div key={step.num} className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#C90000] text-sm font-bold text-white">
                  {step.num}
                </div>
                <h4 className="mt-3 text-sm font-bold text-[#1F2937]">{step.title}</h4>
                <p className="mt-1 text-xs text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <div className="rounded-2xl bg-[#C90000] px-6 py-12 text-center text-white shadow-md">
            <h3 className="text-2xl sm:text-3xl font-bold">
              Ready to manage your student resources digitally?
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm text-red-100">
              Join VESIT students using VESource to save time, avoid paperwork, and receive timely scholarship updates.
            </p>
            <Link
              to={user ? "/dashboard" : "/register"}
              className="mt-6 inline-block rounded-lg bg-white px-6 py-3 text-xs font-bold text-[#C90000] hover:bg-gray-100 transition-colors shadow-sm"
            >
              {user ? "Open Dashboard" : "Register Now"}
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] bg-white py-6 text-xs text-gray-500">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-2 px-6">
          <p>© 2026 VESource • VESIT Student Resource &amp; Scholarship Portal</p>
          <p>Vivekanand Education Society&apos;s Institute of Technology (VESIT)</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
