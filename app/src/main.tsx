import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// No StrictMode: the story engine's effects advance game state and must run once.
createRoot(document.getElementById("root")!).render(<App />);
