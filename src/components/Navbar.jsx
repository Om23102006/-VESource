import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import useSocketNotification from "../hooks/useSocketNotification";

function Navbar() {
  const { user, logout } = useContext(UserContext);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const { notifications, unreadCount, markAllAsRead, clearNotifications } =
    useSocketNotification(user);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
    if (!showNotifications && unreadCount > 0) {
      markAllAsRead();
    }
  };

  return (
    <nav className="border-b border-[#E5E7EB] bg-white sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C90000] font-bold text-white shadow-sm">
            V
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#C90000] leading-none">
              VESource
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              VESIT Student Resource &amp; Scholarship Portal
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link
            to="/"
            className="font-medium text-gray-700 hover:text-[#C90000] transition-colors"
          >
            Home
          </Link>
          {user && (
            <Link
              to="/dashboard"
              className="font-medium text-gray-700 hover:text-[#C90000] transition-colors"
            >
              Dashboard
            </Link>
          )}
          <Link
            to="/chat"
            className="font-medium text-gray-700 hover:text-[#C90000] transition-colors"
          >
            💬 Live Chat
          </Link>
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className="font-medium text-purple-700 bg-purple-50 px-3 py-1 rounded-md border border-purple-200 hover:bg-purple-100 transition-colors"
            >
              Admin Panel
            </Link>
          )}

          {/* User Section & Notifications */}
          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-gray-200 relative">
              {/* Notification Bell */}
              <button
                onClick={toggleNotifications}
                className="relative p-2 text-gray-600 hover:text-[#C90000] rounded-full hover:bg-gray-100 transition-colors"
                title="Notifications"
                type="button"
              >
                <span className="text-lg">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#C90000] text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 rounded-lg border border-[#E5E7EB] bg-white shadow-lg p-4 z-50">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Live Notifications
                    </span>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-[11px] text-[#C90000] hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-gray-500 py-4 text-center">
                      No status notifications yet.
                    </p>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {notifications.map((n, i) => (
                        <div
                          key={i}
                          className="rounded border border-gray-100 bg-[#F8F8F6] p-2.5 text-xs text-gray-700"
                        >
                          <div className="flex items-center justify-between font-semibold text-[#1F2937]">
                            <span>{n.scholarshipName}</span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] ${
                                n.status === "Approved"
                                  ? "bg-green-100 text-green-700"
                                  : n.status === "Correction Required"
                                  ? "bg-amber-100 text-amber-800"
                                  : n.status === "Rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {n.status}
                            </span>
                          </div>
                          <p className="mt-1 text-gray-600">{n.message}</p>
                          <span className="text-[10px] text-gray-400 mt-1 block">
                            {new Date(n.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="text-right">
                <p className="text-xs font-semibold text-[#1F2937] leading-tight">
                  {user.name}
                </p>
                <span className="text-[10px] text-gray-500 capitalize">
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-md border border-[#C90000] px-4 py-1.5 text-xs font-semibold text-[#C90000] hover:bg-red-50 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-[#C90000] px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors shadow-sm"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          {user && (
            <button
              onClick={toggleNotifications}
              className="relative p-2 text-gray-600 rounded-full"
              type="button"
            >
              <span className="text-lg">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#C90000] text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-700 hover:text-[#C90000] focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E5E7EB] bg-white px-4 py-3 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-gray-700 hover:text-[#C90000]"
          >
            Home
          </Link>
          {user && (
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-gray-700 hover:text-[#C90000]"
            >
              Dashboard
            </Link>
          )}
          <Link
            to="/chat"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-gray-700 hover:text-[#C90000]"
          >
            💬 Live Chat
          </Link>
          {user?.role === "admin" && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-purple-700"
            >
              Admin Panel
            </Link>
          )}
          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
            {user ? (
              <>
                <p className="text-xs text-gray-500">
                  Signed in as <span className="font-semibold text-gray-800">{user.name}</span> ({user.role})
                </p>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left py-2 text-sm font-medium text-red-600 hover:underline"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center rounded border border-[#C90000] py-2 text-xs font-semibold text-[#C90000]"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center rounded bg-[#C90000] py-2 text-xs font-semibold text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
