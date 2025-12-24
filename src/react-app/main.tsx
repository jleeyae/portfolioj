import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";

document.documentElement.dataset.theme =
  localStorage.getItem("pp.theme.v1") ?? "light";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
