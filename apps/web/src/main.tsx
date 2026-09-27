import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app.tsx";
import "@fontsource/m-plus-rounded-1c/500.css";
import "@fontsource/m-plus-rounded-1c/800.css";
import "@fontsource/jersey-10";
import "@fontsource/bangers";
import "./styles.css";

const root = document.getElementById("root");
if (root === null) throw new Error("index.html is missing #root");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
