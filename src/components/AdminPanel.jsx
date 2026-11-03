import { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import Navbar from "./Navbar";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { io } from "socket.io-client";

const API = "/api";

function AdminPanel() {
  useDocumentTitle("VESource — College Admin Panel");
  const { user, token } = useContext(UserContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("applications"); // "applications" | "users"
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Correction Modal State
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [selectedAppForCorrection, setSelectedAppForCorrection] = useState(null);
  const [correctionRemarksInput, setCorrectionRemarksInput] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // App detail view modal
  const [selectedAppDetail, setSelectedAppDetail] = useState(null);

  // Redirect if not admin
  useEffect(() => {
    if (!user) navigate("/login");
    else if (user.role !== "admin") navigate("/dashboard");
  }, [user, navigate]);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [adminRes, appsRes] = await Promise.all([
        fetch(`${API}/auth/admin`, { headers }),
        fetch(`${API}/applications`, { headers }),
      ]);

      if (adminRes.ok) {
        const adminData = await adminRes.json();
        if (adminData.users) setUsers(adminData.users);
      }
      if (appsRes.ok) {
        const apps = await appsRes.json();
        if (Array.isArray(apps)) setApplications(apps);
      }
    } catch {
      setError("Failed to fetch administrative data.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let ignore = false;
    if (!token) return;

    const initialFetch = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [adminRes, appsRes] = await Promise.all([
          fetch(`${API}/auth/admin`, { headers }),
          fetch(`${API}/applications`, { headers }),
        ]);

        if (!ignore) {
          if (adminRes.ok) {
            const adminData = await adminRes.json();
            if (adminData.users) setUsers(adminData.users);
          }
          if (appsRes.ok) {
            const apps = await appsRes.json();
            if (Array.isArray(apps)) setApplications(apps);
          }
        }
      } catch {
        if (!ignore) setError("Failed to fetch administrative data.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    initialFetch();

    return () => {
      ignore = true;
    };
  }, [token]);

  // Real-time listener for incoming student submissions
  useEffect(() => {
    if (!user || user.role !== "admin") return;
    const socket = io(window.location.origin, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      socket.emit("joinAdmin");
    });

    socket.on("newApplication", (data) => {
      setSuccess(`New application received: "${data.scholarshipName}" by ${data.studentName}`);
      loadData();
    });

    socket.on("correctionSubmitted", (data) => {
      setSuccess(`Correction submitted: "${data.scholarshipName}" by ${data.studentName}`);
      loadData();
    });

    return () => {
      socket.disconnect();
    };
  }, [user, loadData]);

  // Handle direct status changes
  const handleStatusChange = async (app, newStatus) => {
    if (newStatus === "Correction Required") {
      setSelectedAppForCorrection(app);
      setCorrectionRemarksInput(app.correctionRemarks || "");
      setShowCorrectionModal(true);
      return;
    }

    try {
      setError("");
      const res = await fetch(`${API}/applications/${app._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Status update failed");

      setApplications((prev) =>
        prev.map((a) => (a._id === app._id ? data : a))
      );
      setSuccess(`Status for ${app.studentName}'s application updated to "${newStatus}".`);
    } catch (err) {
      setError(err.message || "Failed to update status");
    }
  };

  // Submit Correction Required with remarks
  const handleSaveCorrectionRemarks = async (e) => {
    e.preventDefault();
    if (!correctionRemarksInput.trim()) {
      setError("Please specify the exact correction needed.");
      return;
    }

    setUpdatingStatus(true);
    try {
      const res = await fetch(
        `${API}/applications/${selectedAppForCorrection._id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: "Correction Required",
            correctionRemarks: correctionRemarksInput.trim(),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Status update failed");

      setApplications((prev) =>
        prev.map((a) => (a._id === selectedAppForCorrection._id ? data : a))
      );
      setSuccess(
        `Correction request sent to student ${selectedAppForCorrection.studentName}.`
      );
      setShowCorrectionModal(false);
      setSelectedAppForCorrection(null);
    } catch (err) {
      setError(err.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Delete application
  const handleDeleteApplication = async (id, studentName) => {
    if (!window.confirm(`Delete application for student "${studentName}"?`)) return;
    try {
      const res = await fetch(`${API}/applications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }
      setApplications((prev) => prev.filter((a) => a._id !== id));
      setSuccess("Application deleted successfully.");
    } catch (err) {
      setError(err.message || "Failed to delete application");
    }
  };

  if (!user || user.role !== "admin") return null;

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    const matchesStatus =
      filterStatus === "ALL" || app.status === filterStatus;
    const matchesSearch =
      searchQuery === "" ||
      app.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.scholarshipName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.studentDetails?.rollNumber
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#1F2937]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
                ADMINISTRATION CONSOLE
              </span>
              <span className="text-xs text-gray-400">Staff Verification Portal</span>
            </div>
            <h2 className="text-2xl font-bold text-[#1F2937] mt-1">
              Scholarship Verification &amp; Document Review
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Review student applications, verify attached academic credentials, and request corrections.
            </p>
          </div>

          <button
            onClick={loadData}
            className="rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 self-start"
          >
            <span>🔄</span> Refresh Data
          </button>
        </div>

        {/* Global Feedback Messages */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError("")} className="font-bold">×</button>
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-xs text-green-700 flex items-center justify-between">
            <span>✓ {success}</span>
            <button onClick={() => setSuccess("")} className="font-bold">×</button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-[#E5E7EB] mb-6">
          <button
            onClick={() => setActiveTab("applications")}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "applications"
                ? "border-[#C90000] text-[#C90000]"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Scholarship Applications ({applications.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "users"
                ? "border-[#C90000] text-[#C90000]"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Registered Students ({users.length})
          </button>
        </div>

        {/* Tab 1: Applications */}
        {activeTab === "applications" && (
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-gray-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">Filter Status:</span>
                {["ALL", "Submitted", "Under Review", "Correction Required", "Approved", "Rejected"].map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => setFilterStatus(st)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        filterStatus === st
                          ? "bg-[#C90000] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>

              <input
                type="text"
                placeholder="Search by student, scheme, roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-[#C90000] w-full sm:w-64"
              />
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-gray-400">
                Loading applications...
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                No scholarship applications match the criteria.
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {filteredApps.map((app) => (
                  <div
                    key={app._id}
                    className="rounded-lg border border-gray-200 bg-[#F8F8F6] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-[#1F2937]">
                          {app.studentName}
                        </h4>
                        <span className="text-xs text-gray-500">
                          ({app.studentDetails?.rollNumber || "No Roll #"} • {app.studentDetails?.department || "General"})
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                            app.status === "Approved"
                              ? "bg-green-100 text-green-700"
                              : app.status === "Correction Required"
                              ? "bg-amber-100 text-amber-800"
                              : app.status === "Rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-[#C90000]">
                        {app.scholarshipName}
                      </p>

                      <p className="text-[11px] text-gray-500">
                        Category: {app.studentDetails?.category || "OPEN"} • Income: ₹{app.studentDetails?.annualIncome?.toLocaleString() || "0"} • Applied on {new Date(app.createdAt).toLocaleDateString()}
                      </p>

                      {/* Attached Documents with preview */}
                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold text-gray-600">
                          Attached Proofs:
                        </span>
                        {app.attachedDocuments && app.attachedDocuments.length > 0 ? (
                          app.attachedDocuments.map((doc, idx) => {
                            const docId = doc.documentId || doc._id;
                            return (
                              <a
                                key={idx}
                                href={`${API}/documents/${docId}/download?token=${token}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded bg-white border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-700 hover:text-[#C90000] hover:border-red-300"
                              >
                                <span>📄</span> {doc.title || doc.fileName} (View)
                              </a>
                            );
                          })
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">
                            No documents attached
                          </span>
                        )}
                      </div>

                      {/* Display correction remarks if present */}
                      {app.correctionRemarks && (
                        <div className="mt-2 rounded bg-amber-50 p-2 text-[11px] text-amber-900 border border-amber-200">
                          <span className="font-bold">Correction Remark:</span> {app.correctionRemarks}
                        </div>
                      )}
                    </div>

                    {/* Status Update Control & Delete */}
                    <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app, e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 outline-none focus:border-[#C90000]"
                      >
                        <option value="Submitted">Submitted</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Correction Required">Correction Required</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>

                      <button
                        onClick={() => setSelectedAppDetail(app)}
                        className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
                        title="View Full Details"
                      >
                        Inspect
                      </button>

                      <button
                        onClick={() => handleDeleteApplication(app._id, app.studentName)}
                        className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                        title="Delete Application"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Registered Students */}
        {activeTab === "users" && (
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm overflow-x-auto">
            <h3 className="text-base font-bold text-[#1F2937] mb-4">
              Registered Portal Users
            </h3>
            <table className="w-full text-xs">
              <thead className="bg-[#F8F8F6] border-b border-gray-200 text-gray-600">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold">Name</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Email</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Role</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-semibold text-[#1F2937]">{u.name}</td>
                    <td className="px-4 py-2.5 text-gray-600">{u.email}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* ── Modal: Enter Correction Remarks ──────────────────────────────────── */}
      {showCorrectionModal && selectedAppForCorrection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-[#1F2937]">
                Request Correction from Student
              </h3>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ×
              </button>
            </div>

            <div className="mt-3 text-xs text-gray-600">
              Student: <span className="font-bold text-[#1F2937]">{selectedAppForCorrection.studentName}</span>
              <br />
              Scheme: <span className="font-bold text-[#C90000]">{selectedAppForCorrection.scholarshipName}</span>
            </div>

            <form onSubmit={handleSaveCorrectionRemarks} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Correction Note (Explains what student needs to correct) *
                </label>
                <textarea
                  required
                  rows={4}
                  value={correctionRemarksInput}
                  onChange={(e) => setCorrectionRemarksInput(e.target.value)}
                  placeholder="e.g. Income certificate is expired. Please upload current FY certificate and re-submit."
                  className="w-full rounded-lg border border-[#E5E7EB] p-2.5 text-xs outline-none focus:border-[#C90000]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {updatingStatus ? "Sending..." : "Send Correction Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Inspect Application Details ────────────────────────────────── */}
      {selectedAppDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-[#1F2937]">
                Application Details
              </h3>
              <button
                onClick={() => setSelectedAppDetail(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ×
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-gray-700">
              <div className="grid grid-cols-2 gap-2 bg-[#F8F8F6] p-3 rounded-lg">
                <div>
                  <span className="font-semibold text-gray-500">Student:</span>
                  <p className="font-bold text-[#1F2937]">{selectedAppDetail.studentName}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Roll No:</span>
                  <p className="font-bold text-[#1F2937]">{selectedAppDetail.studentDetails?.rollNumber || "N/A"}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Department:</span>
                  <p className="text-gray-800">{selectedAppDetail.studentDetails?.department} ({selectedAppDetail.studentDetails?.year})</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Category & Income:</span>
                  <p className="text-gray-800">{selectedAppDetail.studentDetails?.category} • ₹{selectedAppDetail.studentDetails?.annualIncome?.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <span className="font-semibold text-gray-700">Scholarship Scheme:</span>
                <p className="font-bold text-[#C90000]">{selectedAppDetail.scholarshipName}</p>
              </div>

              <div>
                <span className="font-semibold text-gray-700">Current Status:</span>
                <p className="font-bold">{selectedAppDetail.status}</p>
              </div>

              {selectedAppDetail.correctionRemarks && (
                <div className="rounded bg-amber-50 p-2.5 text-amber-900 border border-amber-200">
                  <span className="font-bold">Remarks:</span> {selectedAppDetail.correctionRemarks}
                </div>
              )}

              <div>
                <span className="font-semibold text-gray-700">Attached Academic Proofs:</span>
                <div className="mt-1 space-y-1">
                  {selectedAppDetail.attachedDocuments?.map((doc, idx) => {
                    const docId = doc.documentId || doc._id;
                    return (
                      <div key={idx} className="flex items-center justify-between border-b border-gray-100 py-1">
                        <span>📎 {doc.title || doc.fileName}</span>
                        <a
                          href={`${API}/documents/${docId}/download?token=${token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#C90000] font-semibold hover:underline"
                        >
                          View / Download
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 flex justify-end border-t border-gray-100">
              <button
                onClick={() => setSelectedAppDetail(null)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
