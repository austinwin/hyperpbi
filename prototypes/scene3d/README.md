# Scene3D experimental proof of concept

This experiment uses Three.js to demonstrate an interactive equipment scene without modifying the HyperPBI core runtime or packaged Power BI visual.

## Open

- [Live demo](https://weak-painting.miniup.app/)
- [Standalone source](index.html)

## What works in the web demo

- WebGL 3D station with four clickable equipment groups, two tanks, piping, lighting, shadows, camera orbit/pan/zoom and top/isometric presets.
- Equipment selection from either the 3D canvas or sidebar updates the same object inspector, KPIs, pressure trend and structured interaction event.
- Status change simulation updates an object material and the linked analytical panels.
- No network access to operational data; all equipment records are synthetic. No telemetry APIs or secrets.
- Responsive layout and user-facing WebGL failure message.

## Not yet implemented

- Not registered as a `scene3d` HyperPBI schema component. The demo currently runs as a standalone website.
- No Power BI selection manager, model-filter interaction, or `pbiviz` build.
- No model/GLB imports, remote data, model editor, or large-scene optimization.
- Not validated across Power BI Desktop, Service, export, or government cloud.
- The Three.js import map uses a public CDN. This is a web-only experiment, not a valid deployment approach for packaged Power BI visuals.

## Proposed integration contract

A first-class `scene3d` component should bind `objectIdField` (for example, `equipmentId`) to a real dataset column and connect selection to the existing `executeComponentInteraction` engine with row indices/keys and Power BI lineage. Set `interaction.internalMode` to `highlight` or `filter` and `interaction.externalMode` to `selection` for actual Power BI row identities.

Before integrating: bundle Three.js as a lazily loaded local module, add schema/descriptor/field traversal/validation/Inspector control, enforce object/material limits, and test cleanup/WebGL context loss. Never run arbitrary JavaScript or load arbitrary remote resources based on dashboard JSON. Evaluate GLB imports only after establishing a trusted asset packaging policy.

## Validation state

HTML was published by MiniUp and the repository file was committed. A full browser/WebGL rendering test and Power BI test have **not** been executed in this environment.
