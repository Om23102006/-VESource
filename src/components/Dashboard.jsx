import { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import Navbar from "./Navbar";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { io } from "socket.io-client";

const API = "/api";

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function Dashboard() {
  useDocumentTitle("VESource — Student Dashboard");
  const { user, token } = useContext(UserContext);
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "vault" | "scholarships" | "applications"
  const [applications, setApplications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Document Upload Modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState("Marksheet");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Application Modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [applicationForm, setApplicationForm] = useState({
    rollNumber: "",
    department: "Computer Engineering",
    year: "FE",
    category: "OPEN",
    annualIncome: "",
    attachedDocIds: [],
    declaration: false,
  });
  const [submittingApp, setSubmittingApp] = useState(false);

  // Correction Modal state
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctingApp, setCorrectingApp] = useState(null);
  const [correctionResponseRemarks, setCorrectionResponseRemarks] = useState("");
  const [correctionAttachedDocIds, setCorrectionAttachedDocIds] = useState([]);
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  // Fetch initial data
  useEffect(() => {
    let ignore = false;
    if (!token) return;

    const loadInitialData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [appsRes, docsRes, schRes] = await Promise.all([
          fetch(`${API}/applications`, { headers }),
          fetch(`${API}/documents`, { headers }),
          fetch(`${API}/scholarships`),
        ]);

        if (!ignore) {
          if (appsRes.ok) {
            const appsData = await appsRes.json();
            if (Array.isArray(appsData)) setApplications(appsData);
          }
          if (docsRes.ok) {
            const docsData = await docsRes.json();
            if (Array.isArray(docsData)) setDocuments(docsData);
          }
          if (schRes.ok) {
            const schData = await schRes.json();
            if (schData.data) setScholarships(schData.data);
          }
        }
      } catch {
        if (!ignore) {
          setError("Failed to load dashboard data. Please check your connection.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      ignore = true;
    };
  }, [token]);

  // Real-time WebSocket connection for instant updates
  useEffect(() => {
    if (!user || !user.id) return;
    const socket = io(window.location.origin, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      socket.emit("joinUser", user.id);
    });

    socket.on("statusNotification", (data) => {
      setSuccess(
        `Update on ${data.scholarshipName}: Status changed to "${data.status}".`
      );
      // Refresh applications list
      fetch(`${API}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((apps) => {
          if (Array.isArray(apps)) setApplications(apps);
        })
        .catch(() => {});
    });

    return () => {
      socket.disconnect();
    };
  }, [user, token]);

  // Handle Document Upload
  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !selectedFile) {
      setError("Please provide a title and select a valid document file.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit. Please upload a smaller file.");
      return;
    }

    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];
    if (!allowed.includes(selectedFile.type)) {
      setError("Invalid file type. Only PDF, JPG, and PNG documents are allowed.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("title", uploadTitle.trim());
    formData.append("documentType", uploadType);
    formData.append("document", selectedFile);

    try {
      const res = await fetch(`${API}/documents/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");

      setDocuments((prev) => [data, ...prev]);
      setSuccess(`Document "${data.title}" securely stored in Document Vault.`);
      setShowUploadModal(false);
      setUploadTitle("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  // Handle Document Delete
  const handleDeleteDocument = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const res = await fetch(`${API}/documents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }
      setDocuments((prev) => prev.filter((d) => d._id !== id));
      setSuccess(`Document "${title}" removed from vault.`);
    } catch (err) {
      setError(err.message || "Failed to delete document");
    }
  };

  // Open Application Modal
  const handleOpenApply = (sch) => {
    setSelectedScholarship(sch);
    setApplicationForm({
      rollNumber: "",
      department: "Computer Engineering",
      year: "FE",
      category: sch.category?.includes("OBC") ? "OBC" : "OPEN",
      annualIncome: "",
      attachedDocIds: documents.map((d) => d._id), // pre-select available documents
      declaration: false,
    });
    setError("");
    setSuccess("");
    setShowApplyModal(true);
  };

  // Submit Scholarship Application
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applicationForm.declaration) {
      setError("Please confirm the verification declaration to submit.");
      return;
    }

    setSubmittingApp(true);
    setError("");
    setSuccess("");

    // Map attached document IDs to metadata
    const attachedDocuments = documents
      .filter((d) => applicationForm.attachedDocIds.includes(d._id))
      .map((d) => ({
        documentId: d._id,
        title: d.title,
        fileName: d.fileName,
      }));

    try {
      const payload = {
        studentName: user.name,
        scholarshipName: selectedScholarship.name,
        studentDetails: {
          rollNumber: applicationForm.rollNumber.trim(),
          department: applicationForm.department,
          year: applicationForm.year,
          category: applicationForm.category,
          annualIncome: Number(applicationForm.annualIncome) || 0,
        },
        attachedDocuments,
      };

      const res = await fetch(`${API}/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");

      setApplications((prev) => [data, ...prev]);
      setSuccess(`Application for ${selectedScholarship.name} submitted successfully!`);
      setShowApplyModal(false);
      setActiveTab("applications");
    } catch (err) {
      setError(err.message || "Failed to submit application");
    } finally {
      setSubmittingApp(false);
    }
  };

  // Open Correction Modal
  const handleOpenCorrection = (app) => {
    setCorrectingApp(app);
    setCorrectionResponseRemarks("");
    setCorrectionAttachedDocIds(
      app.attachedDocuments?.map((d) => d.documentId || d._id) || []
    );
    setShowCorrectionModal(true);
  };

  // Submit Correction Re-submission
  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    if (!correctionResponseRemarks.trim()) {
      setError("Please provide an explanatory remark for the correction.");
      return;
    }

    setSubmittingCorrection(true);
    setError("");
    setSuccess("");

    const attachedDocuments = documents
      .filter((d) => correctionAttachedDocIds.includes(d._id))
      .map((d) => ({
        documentId: d._id,
        title: d.title,
        fileName: d.fileName,
      }));

    try {
      const res = await fetch(`${API}/applications/${correctingApp._id}/correction`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          responseRemarks: correctionResponseRemarks.trim(),
          attachedDocuments,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Correction update failed");

      setApplications((prev) =>
        prev.map((a) => (a._id === data._id ? data : a))
      );
      setSuccess("Application correction re-submitted for college review!");
      setShowCorrectionModal(false);
      setCorrectingApp(null);
    } catch (err) {
      setError(err.message || "Failed to submit correction");
    } finally {
      setSubmittingCorrection(false);
    }
  };

  // Withdraw / Delete Application (if in Submitted status)
  const handleDeleteApplication = async (id, name) => {
    if (!window.confirm(`Withdraw application for "${name}"?`)) return;
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
      setSuccess("Application withdrawn.");
    } catch (err) {
      setError(err.message || "Failed to delete application");
    }
  };

  if (!user) return null;

  // Overview Counts
  const approvedCount = applications.filter((a) => a.status === "Approved").length;
  const pendingCount = applications.filter(
    (a) => a.status === "Submitted" || a.status === "Under Review"
  ).length;
  const correctionCount = applications.filter(
    (a) => a.status === "Correction Required"
  ).length;

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#1F2937]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Welcome Banner */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-red-100 px-2.5 py-0.5 text-xs font-bold text-[#C90000]">
                STUDENT PORTAL
              </span>
              <span className="text-xs text-gray-500">VESIT Academic Session 2026</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1F2937] mt-1.5">
              Welcome back, {user.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Store academic credentials, discover state &amp; institutional scholarships, and track verification in real time.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#C90000] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
            >
              <span>📤</span> Upload Document
            </button>
            <button
              onClick={() => setActiveTab("scholarships")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#C90000] bg-white px-4 py-2.5 text-xs font-semibold text-[#C90000] hover:bg-red-50 transition-colors"
            >
              <span>🎓</span> Explore Scholarships
            </button>
          </div>
        </div>

        {/* Global Notifications / Alerts */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-700 font-bold"
            >
              ×
            </button>
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span>{success}</span>
            </div>
            <button
              onClick={() => setSuccess("")}
              className="text-green-500 hover:text-green-700 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Action Tabs */}
        {loading && (
          <div className="mb-4 rounded-lg bg-gray-50 border border-gray-200 py-3 text-center text-xs text-gray-500">
            ⏳ Synchronizing your student records and documents...
          </div>
        )}
        <div className="flex flex-wrap gap-2 border-b border-[#E5E7EB] mb-6">
          {[
            { id: "overview", label: "Overview", icon: "📊" },
            { id: "vault", label: `Document Vault (${documents.length})`, icon: "📁" },
            { id: "scholarships", label: `Scholarships (${scholarships.length})`, icon: "🎓" },
            { id: "applications", label: `My Applications (${applications.length})`, icon: "📝" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[#C90000] text-[#C90000]"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === "applications" && correctionCount > 0 && (
                <span className="rounded-full bg-amber-500 text-white text-[10px] px-1.5 py-0.2">
                  {correctionCount} action
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Document Vault
                </p>
                <p className="mt-2 text-3xl font-bold text-[#1F2937]">
                  {documents.length}
                </p>
                <p className="mt-1 text-xs text-green-600">Saved academic proofs</p>
              </div>

              <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Applications
                </p>
                <p className="mt-2 text-3xl font-bold text-[#1F2937]">
                  {applications.length}
                </p>
                <p className="mt-1 text-xs text-gray-500">Submitted to college</p>
              </div>

              <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Pending Review
                </p>
                <p className="mt-2 text-3xl font-bold text-amber-600">
                  {pendingCount}
                </p>
                <p className="mt-1 text-xs text-amber-700">Awaiting verification</p>
              </div>

              <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Approved
                </p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {approvedCount}
                </p>
                <p className="mt-1 text-xs text-green-700">Verified &amp; sanctions</p>
              </div>
            </div>

            {/* Quick Action Sections */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Applications Preview */}
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="text-base font-bold text-[#1F2937]">
                    Recent Applications
                  </h3>
                  <button
                    onClick={() => setActiveTab("applications")}
                    className="text-xs font-semibold text-[#C90000] hover:underline"
                  >
                    View All →
                  </button>
                </div>
                {applications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-500">
                    No scholarship applications yet.
                    <div className="mt-2">
                      <button
                        onClick={() => setActiveTab("scholarships")}
                        className="text-xs text-[#C90000] font-semibold hover:underline"
                      >
                        Explore eligible schemes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {applications.slice(0, 3).map((app) => (
                      <div
                        key={app._id}
                        className="flex items-center justify-between rounded-lg border border-gray-100 bg-[#F8F8F6] p-3.5"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#1F2937]">
                            {app.scholarshipName}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Submitted on {new Date(app.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
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
                    ))}
                  </div>
                )}
              </div>

              {/* Document Vault Preview */}
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="text-base font-bold text-[#1F2937]">
                    Document Vault Status
                  </h3>
                  <button
                    onClick={() => setActiveTab("vault")}
                    className="text-xs font-semibold text-[#C90000] hover:underline"
                  >
                    Manage Vault →
                  </button>
                </div>
                {documents.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-500">
                    No documents uploaded yet.
                    <div className="mt-2">
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="text-xs text-[#C90000] font-semibold hover:underline"
                      >
                        Upload your 10th / 12th / Income certificates
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {documents.slice(0, 3).map((doc) => (
                      <div
                        key={doc._id}
                        className="flex items-center justify-between rounded-lg border border-gray-100 bg-[#F8F8F6] p-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">📄</span>
                          <div>
                            <p className="text-sm font-semibold text-[#1F2937]">
                              {doc.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {doc.documentType} • {formatBytes(doc.fileSize)}
                            </p>
                          </div>
                        </div>
                        <a
                          href={`${API}/documents/${doc._id}/download?token=${token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-[#C90000] hover:underline"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Document Vault */}
        {activeTab === "vault" && (
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-[#1F2937]">
                  Document Vault
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Upload, inspect and reuse your academic credentials securely across multiple scholarship applications.
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#C90000] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
              >
                <span>+</span> Upload New Document
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="py-14 text-center">
                <span className="text-4xl">📂</span>
                <h4 className="mt-3 text-base font-bold text-gray-800">
                  Your Document Vault is empty
                </h4>
                <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                  Upload your 10th marksheet, 12th marksheet, Income Certificate, and Caste Validity documents once to attach them easily to applications.
                </p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="mt-4 rounded-lg bg-[#C90000] px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Upload First Document
                </button>
              </div>
            ) : (
              <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div
                    key={doc._id}
                    className="flex flex-col justify-between rounded-lg border border-[#E5E7EB] bg-[#F8F8F6] p-4 hover:border-gray-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-[#C90000]">
                          {doc.documentType}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {formatBytes(doc.fileSize)}
                        </span>
                      </div>
                      <h4 className="mt-2 text-sm font-bold text-[#1F2937]">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-gray-500 truncate mt-0.5" title={doc.fileName}>
                        {doc.fileName}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-200">
                      <a
                        href={`${API}/documents/${doc._id}/download?token=${token}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#C90000] hover:underline"
                      >
                        <span>👁️</span> Preview / Download
                      </a>
                      <button
                        onClick={() => handleDeleteDocument(doc._id, doc.title)}
                        className="text-xs font-medium text-red-600 hover:text-red-800"
                        title="Delete Document"
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

        {/* Tab 3: Scholarships Catalog */}
        {activeTab === "scholarships" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold text-[#1F2937]">
                Scholarship Schemes Catalog
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Explore government and institutional scholarship schemes applicable to VESIT students.
                <span className="ml-1 text-gray-400 italic">
                  (Sample demonstration information with realistic eligibility parameters)
                </span>
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {scholarships.map((sch) => (
                <div
                  key={sch.id}
                  className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                        {sch.category}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        Deadline: {sch.deadline}
                      </span>
                    </div>

                    <h4 className="mt-2.5 text-lg font-bold text-[#1F2937]">
                      {sch.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">{sch.provider}</p>

                    <div className="mt-3 rounded-lg bg-[#F8F8F6] p-3 text-xs text-gray-700">
                      <span className="font-semibold text-[#1F2937]">Benefit: </span>
                      {sch.benefit}
                    </div>

                    {/* Eligibility List */}
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-700">
                        Eligibility Criteria:
                      </p>
                      <ul className="mt-1 list-disc list-inside text-xs text-gray-600 space-y-0.5">
                        {sch.eligibility?.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Required Documents */}
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-700">
                        Required Documents:
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {sch.requiredDocuments?.map((reqDoc, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600"
                          >
                            ✓ {reqDoc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">
                      Online Application via VESource
                    </span>
                    <button
                      onClick={() => handleOpenApply(sch)}
                      className="rounded-lg bg-[#C90000] px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors shadow-sm"
                    >
                      Apply Now →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: My Applications & Verification Pipeline */}
        {activeTab === "applications" && (
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-[#1F2937]">
                  My Scholarship Applications
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Track verification status, view attached proofs, or respond to college staff correction requests.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("scholarships")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#C90000] hover:underline"
              >
                + New Application
              </button>
            </div>

            {applications.length === 0 ? (
              <div className="py-14 text-center">
                <span className="text-4xl">📝</span>
                <h4 className="mt-3 text-base font-bold text-gray-800">
                  No scholarship applications submitted yet
                </h4>
                <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                  Pick an eligible scheme from the Scholarships tab and submit your academic details online.
                </p>
                <button
                  onClick={() => setActiveTab("scholarships")}
                  className="mt-4 rounded-lg bg-[#C90000] px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                >
                  View Available Scholarships
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {applications.map((app) => (
                  <div
                    key={app._id}
                    className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#1F2937]">
                            {app.scholarshipName}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
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
                        <p className="text-xs text-gray-500 mt-0.5">
                          Applicant: {app.studentName} • Submitted {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {app.status === "Correction Required" && (
                          <button
                            onClick={() => handleOpenCorrection(app)}
                            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                          >
                            ✏️ Re-submit Correction
                          </button>
                        )}
                        {app.status === "Submitted" && (
                          <button
                            onClick={() =>
                              handleDeleteApplication(app._id, app.scholarshipName)
                            }
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-red-600"
                          >
                            Withdraw
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Tracker Pipeline */}
                    <div className="mt-4 py-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 mb-1">
                        <span className={app.status !== "" ? "text-[#C90000]" : ""}>
                          1. Submitted
                        </span>
                        <span
                          className={
                            app.status === "Under Review" ||
                            app.status === "Approved" ||
                            app.status === "Correction Required"
                              ? "text-[#C90000]"
                              : ""
                          }
                        >
                          2. College Review
                        </span>
                        <span
                          className={
                            app.status === "Approved"
                              ? "text-green-600"
                              : app.status === "Correction Required"
                              ? "text-amber-600"
                              : app.status === "Rejected"
                              ? "text-red-600"
                              : ""
                          }
                        >
                          3. {app.status === "Correction Required" ? "Correction Needed" : "Sanction / Final"}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            app.status === "Approved"
                              ? "w-full bg-green-500"
                              : app.status === "Rejected"
                              ? "w-full bg-red-500"
                              : app.status === "Correction Required"
                              ? "w-2/3 bg-amber-500"
                              : app.status === "Under Review"
                              ? "w-2/3 bg-blue-500"
                              : "w-1/3 bg-[#C90000]"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Prominent Correction Message Box if Correction Required */}
                    {app.status === "Correction Required" && (
                      <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900">
                        <div className="flex items-center gap-2 font-bold text-amber-900">
                          <span>⚠️ Action Required by Student</span>
                        </div>
                        <p className="mt-1 font-medium">
                          College Review Note: &quot;{app.correctionRemarks}&quot;
                        </p>
                        <p className="mt-1 text-[11px] text-amber-700">
                          Please update your details or attach the missing document from your vault using the &quot;Re-submit Correction&quot; button above.
                        </p>
                      </div>
                    )}

                    {/* Student Academic Details & Documents */}
                    <div className="mt-4 grid sm:grid-cols-2 gap-4 text-xs bg-[#F8F8F6] p-3 rounded-lg">
                      <div>
                        <span className="font-semibold text-gray-700">Academic Details:</span>
                        <p className="text-gray-600 mt-0.5">
                          Roll No: {app.studentDetails?.rollNumber || "N/A"} • Dept: {app.studentDetails?.department || "N/A"} ({app.studentDetails?.year || "FE"})
                        </p>
                        <p className="text-gray-600">
                          Category: {app.studentDetails?.category || "OPEN"} • Annual Income: ₹{app.studentDetails?.annualIncome?.toLocaleString() || "0"}
                        </p>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">Attached Academic Proofs:</span>
                        {app.attachedDocuments && app.attachedDocuments.length > 0 ? (
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {app.attachedDocuments.map((doc, idx) => (
                              <span
                                key={idx}
                                className="rounded bg-white border border-gray-200 px-2 py-0.5 text-[11px] text-gray-700"
                              >
                                📎 {doc.title || doc.fileName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400 mt-0.5">No documents attached.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Modal 1: Upload Document ─────────────────────────────────────────── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-[#1F2937]">
                Upload Document to Vault
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. 10th Marksheet, Income Certificate FY25-26"
                  required
                  className="w-full rounded-lg border border-[#E5E7EB] px-3.5 py-2 text-xs outline-none focus:border-[#C90000]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Document Type
                </label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3.5 py-2 text-xs outline-none focus:border-[#C90000]"
                >
                  <option>Marksheet</option>
                  <option>Identity Proof</option>
                  <option>Income Certificate</option>
                  <option>Caste Certificate</option>
                  <option>Domicile Certificate</option>
                  <option>Fee Receipt</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select File (PDF, JPG, PNG — Max 5MB) *
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                  required
                  className="w-full text-xs text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-gray-700 hover:file:bg-gray-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="rounded-lg bg-[#C90000] px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Save to Vault"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 2: Apply for Scholarship ───────────────────────────────────── */}
      {showApplyModal && selectedScholarship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#C90000]">
                  Scholarship Application Form
                </span>
                <h3 className="text-base font-bold text-[#1F2937]">
                  {selectedScholarship.name}
                </h3>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Student Name
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user.name}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Roll Number / Student ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={applicationForm.rollNumber}
                    onChange={(e) =>
                      setApplicationForm({
                        ...applicationForm,
                        rollNumber: e.target.value,
                      })
                    }
                    placeholder="e.g. 2024BIT012"
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-xs outline-none focus:border-[#C90000]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={applicationForm.department}
                    onChange={(e) =>
                      setApplicationForm({
                        ...applicationForm,
                        department: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-[#E5E7EB] px-2 py-1.5 text-xs"
                  >
                    <option>Computer Engineering</option>
                    <option>Information Technology</option>
                    <option>AI & Data Science</option>
                    <option>Electronics & Telecom</option>
                    <option>Instrumentation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Year of Study
                  </label>
                  <select
                    value={applicationForm.year}
                    onChange={(e) =>
                      setApplicationForm({
                        ...applicationForm,
                        year: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-[#E5E7EB] px-2 py-1.5 text-xs"
                  >
                    <option>FE</option>
                    <option>SE</option>
                    <option>TE</option>
                    <option>BE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={applicationForm.category}
                    onChange={(e) =>
                      setApplicationForm({
                        ...applicationForm,
                        category: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-[#E5E7EB] px-2 py-1.5 text-xs"
                  >
                    <option>OPEN</option>
                    <option>OBC</option>
                    <option>SC</option>
                    <option>ST</option>
                    <option>EWS</option>
                    <option>VJNT / SBC</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Annual Family Income (in ₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="10000000"
                  placeholder="e.g. 350000"
                  value={applicationForm.annualIncome}
                  onChange={(e) =>
                    setApplicationForm({
                      ...applicationForm,
                      annualIncome: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-xs outline-none focus:border-[#C90000]"
                />
              </div>

              {/* Attach Documents from Vault */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Attach Academic Proofs from Document Vault:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    className="text-[11px] text-[#C90000] hover:underline"
                  >
                    + Upload New Proof
                  </button>
                </div>

                {documents.length === 0 ? (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded border border-amber-200">
                    ⚠️ You haven&apos;t uploaded any documents to your vault yet. Please upload required certificates first.
                  </p>
                ) : (
                  <div className="max-h-32 overflow-y-auto space-y-1.5 rounded-lg border border-gray-200 p-2 bg-[#F8F8F6]">
                    {documents.map((doc) => {
                      const isChecked = applicationForm.attachedDocIds.includes(
                        doc._id
                      );
                      return (
                        <label
                          key={doc._id}
                          className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const newIds = e.target.checked
                                ? [...applicationForm.attachedDocIds, doc._id]
                                : applicationForm.attachedDocIds.filter(
                                    (id) => id !== doc._id
                                  );
                              setApplicationForm({
                                ...applicationForm,
                                attachedDocIds: newIds,
                              });
                            }}
                          />
                          <span>{doc.title}</span>
                          <span className="text-[10px] text-gray-400">
                            ({doc.documentType})
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Declaration Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applicationForm.declaration}
                    onChange={(e) =>
                      setApplicationForm({
                        ...applicationForm,
                        declaration: e.target.checked,
                      })
                    }
                    className="mt-0.5"
                  />
                  <span>
                    I hereby declare that the information provided is correct and the attached documents are authentic copies of the original records.
                  </span>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApp}
                  className="rounded-lg bg-[#C90000] px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {submittingApp ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 3: Re-submit Correction ────────────────────────────────────── */}
      {showCorrectionModal && correctingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold text-amber-700 uppercase">
                  Correction Response
                </span>
                <h3 className="text-base font-bold text-[#1F2937]">
                  {correctingApp.scholarshipName}
                </h3>
              </div>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ×
              </button>
            </div>

            <div className="mt-3 rounded-md bg-amber-50 p-3 text-xs text-amber-900 border border-amber-200">
              <span className="font-bold">Staff Remark:</span> {correctingApp.correctionRemarks}
            </div>

            <form onSubmit={handleCorrectionSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Your Response / Explanation *
                </label>
                <textarea
                  required
                  rows={3}
                  value={correctionResponseRemarks}
                  onChange={(e) => setCorrectionResponseRemarks(e.target.value)}
                  placeholder="e.g. Uploaded the updated Income Certificate for FY 2025-26 and attached it below."
                  className="w-full rounded-lg border border-[#E5E7EB] p-2.5 text-xs outline-none focus:border-[#C90000]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Attached Documents for Correction:
                </label>
                <div className="max-h-32 overflow-y-auto space-y-1 rounded-lg border border-gray-200 p-2 bg-[#F8F8F6]">
                  {documents.map((doc) => {
                    const isChecked = correctionAttachedDocIds.includes(doc._id);
                    return (
                      <label
                        key={doc._id}
                        className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const newIds = e.target.checked
                              ? [...correctionAttachedDocIds, doc._id]
                              : correctionAttachedDocIds.filter((id) => id !== doc._id);
                            setCorrectionAttachedDocIds(newIds);
                          }}
                        />
                        <span>{doc.title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCorrection}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {submittingCorrection ? "Re-submitting..." : "Re-submit for Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
