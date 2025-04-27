import { createRoot } from "react-dom/client";
import React from "react";
import Popup from "./components/popup-component";
import { ExtensionSettings } from "../types";

// Extract highlight parameter from URL query string
const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <Popup highlight={undefined} />
  </React.StrictMode>
);
