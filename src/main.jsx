import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.jsx"

// UserProvider and AppProvider are now inside App.jsx to ensure Router context is available
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
)
