import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import Home from "./Home";
import Login from "./Login";
import Register from "./Register";
import Chat from "./components/Chat";
import Dashboard from "./components/Dashboard";
import AdminPanel from "./components/AdminPanel";
import { UserContext, UserProvider } from "./context/UserContext";
import { AppProvider } from "./context/AppContext";

// Private route — redirects to /login if not authenticated
function PrivateRoute({ children }) {
  const { user } = useContext(UserContext);
  return user ? children : <Navigate to="/login" replace />;
}

// Admin route — redirects to /dashboard if not admin
function AdminRoute({ children }) {
  const { user } = useContext(UserContext);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/chat" element={<Chat />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
