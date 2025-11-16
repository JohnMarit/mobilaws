import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Initialize Firebase
import "./lib/firebase-init";
// Check API configuration
import { checkApiConfiguration } from "./lib/api-check";

// Run API configuration check
checkApiConfiguration();

createRoot(document.getElementById("root")!).render(<App />);
