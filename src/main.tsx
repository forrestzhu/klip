/**
 * Application Entry Point
 *
 * Renders the root React component into the DOM.
 * This is the main entry point for the Klip clipboard manager application.
 *
 * @module main
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
