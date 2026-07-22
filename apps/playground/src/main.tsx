import { render } from "preact";
import "@tabler/core/dist/css/tabler.css";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "../../../src/styles/tabler-overrides.css";
import "../../../src/styles/hyperpbi.css";
import "../../../src/styles/hyperpbi-studio.css";
import "../../../src/styles/hyperpbi-map-studio.css";
import "../../../src/styles/hyperpbi-inspector.css";
import "../../../src/styles/hyperpbi-shell.css";
import "../../../src/styles/hyperpbi-map.css";
import "../../../src/styles/hyperpbi-svg.css";
import "./playground.css";
import { App } from "./App";

const host = document.getElementById("app");
if (!host) throw new Error("Playground root element was not found.");
render(<App />, host);
