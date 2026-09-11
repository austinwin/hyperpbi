# Mermaid diagram

`mermaidDiagram` is HyperPBI's first-class authored diagram component. It uses the locally bundled Mermaid npm package, so Power BI and web builds have no CDN, iframe, mermaid.live, or runtime network dependency.

Use `networkGraph` for a data-driven relationship explorer derived from bound Power BI entity fields. Use `mermaidDiagram` for authored flowcharts, sequence diagrams, class/state/ER diagrams, architecture, and process documentation, with optional node-to-row bindings.

## Safe rendering model

HyperPBI fixes Mermaid to `startOnLoad: false`, `securityLevel: "strict"`, and `htmlLabels: false`. Authors cannot override the raw Mermaid config or security level. Rendering is lazy-loaded, serialized to avoid cross-component global-theme races, parsed before display, and converted to SVG. Mermaid's `bindFunctions` callback hook is deliberately ignored.

The generated SVG passes through HyperPBI's existing sanitizer and SVG ID namespace isolation. Scripts, event attributes, `foreignObject`, links, external URLs, arbitrary data attributes, unsafe `href`/`src`, and raw inline styles are blocked. Mermaid CSS is extracted, processed by HyperPBI's scoped CSS allowlist, and rewritten to isolated IDs. Only the controlled `data-hp-mermaid-node` identity attribute may pass through. Invalid syntax produces a normal HyperPBI error state; Mermaid's error SVG is never inserted.

Source-authored Mermaid `click callback()` JavaScript is never executed. Safe navigation can be added later only through HyperPBI's curated `uiAction` model.

## Schema and example

```json
{
  "type": "mermaidDiagram",
  "id": "processFlow",
  "source": "flowchart LR\nSR[Service Request] --> WO[Work Order]",
  "theme": "auto",
  "fit": "contain",
  "panZoom": true,
  "frameless": true,
  "nodeBindings": [
    { "nodeId": "SR", "field": "serviceRequestNumber", "value": "20302270", "label": "Service request 20302270" },
    { "nodeId": "WO", "field": "workOrderNumber", "value": 15106276, "label": "Work order 15106276" }
  ],
  "interaction": {
    "enabled": true,
    "trigger": "click",
    "internalMode": "filter",
    "internalScope": "others",
    "externalMode": "selection",
    "selectionMode": "replace",
    "clearOnSecondClick": true
  }
}
```

`source` is required, nonblank, and limited to 100,000 characters. `theme` supports `auto`, `default`, `neutral`, `dark`, `forest`, and `base`. `fit` supports `contain`, `width`, and `none`. Node IDs must be unique safe logical identifiers, and fields must be Field Manifest aliases.

## Node interactions and accessibility

A binding matches rows where `field` equals `value`; when `value` is omitted, the first nonblank value in the current component rows is used. Clicking a bound node uses `resolveInteractionPolicy`, `createInteractionPayload`, and `executeComponentInteraction`, including `targets`, internal highlight/filter behavior, external Power BI selection/filter behavior, selection modes, and clear-on-second-click. A binding-level `interaction` safely overrides component policy properties.

Bound nodes receive a subtle selected glow when their corresponding component rows are selected. They are focusable buttons with an accessible binding label and activate with Enter or Space. Event listeners are removed on update/unmount.

Flowchart logical-node mapping is tested and supported. Class, state, and ER node mapping is attempted only where Mermaid exposes a stable generated node identity. Sequence-diagram participants and diagram-specific sub-elements do not yet have a universal stable binding contract; those diagrams still render but should be treated as non-interactive unless a tested logical node maps successfully.

## Pan and zoom

With `panZoom: true`, the wheel zooms from 0.35× to 5×, dragging empty diagram space pans, and the Fit button resets the view. Pointer gestures that begin on a bound node remain node interactions. `fit: "contain"` is the default; `width` fits horizontally and `none` preserves the native SVG size.
