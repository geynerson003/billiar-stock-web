import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import "./styles.css";
import { registerSW } from "virtual:pwa-register";

registerSW({
  immediate: true,
});

/**
 * Si falla la carga de un módulo dinámico (assets con hash viejo tras un deploy),
 * recarga para tomar la versión nueva. Hoy no hay imports dinámicos, es prevención.
 */
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  window.location.reload();
});


ReactDOM.createRoot(document.getElementById("root")!).render(
  <App />
);
