import { useState } from "react";
import { AppContext } from "./AppContextCore.js";

export { AppContext };

export function AppProvider({ children }) {
  const [applications, setApplications] = useState([]);

  const addApplication = (application) => {
    setApplications((prev) => [application, ...prev]);
  };

  const removeApplication = (id) => {
    setApplications((prev) =>
      prev.filter((application) => application._id !== id && application.id !== id)
    );
  };

  const updateApplication = (id, updatedData) => {
    setApplications((prev) =>
      prev.map((app) =>
        app._id === id || app.id === id ? { ...app, ...updatedData } : app
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        applications,
        setApplications,
        addApplication,
        removeApplication,
        updateApplication,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
