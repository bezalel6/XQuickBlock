import { createRoot } from "react-dom/client";
import React from "react";
import Popup from "./popup/components/popup-component";
const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <Popup optionsPage />
  </React.StrictMode>
);
