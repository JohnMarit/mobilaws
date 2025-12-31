import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/prose.css";
import "./styles/animations.css";
// Initialize Firebase
import "./lib/firebase-init";
// Check API configuration
import { checkApiConfiguration } from "./lib/api-check";
// Sync helper for fixing Auth → Firestore gap
import "./lib/sync-auth-to-firestore";
// Initialize security features
import { initializeSecurity } from "./lib/security";

// Run API configuration check
checkApiConfiguration();

// Initialize security
initializeSecurity();

createRoot(document.getElementById("root")!).render(<App />);
