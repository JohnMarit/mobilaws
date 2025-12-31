import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/prose.css";
// Initialize Firebase
import "./lib/firebase-init";
// Check API configuration
import { checkApiConfiguration } from "./lib/api-check";
// Sync helper for fixing Auth → Firestore gap
import "./lib/sync-auth-to-firestore";

// Run API configuration check
checkApiConfiguration();

createRoot(document.getElementById("root")!).render(<App />);
