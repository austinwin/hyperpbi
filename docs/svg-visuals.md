# SVG visuals

HyperPBI 2.0 provides governed, data-bound SVG without user JavaScript. Use `type: "svg"` for animated cards, custom gauges, progress narratives, process flows, pictorial marks, asset schematics, and branded data illustrations. Continue to use ECharts components for standard bar, line, pie, scatter, heatmap, Sankey, treemap, and similar analytical charts.

## Declarative SVG

Declarative SVG renders native SVG nodes from strict element objects. Supported elements are `g`, `path`, `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`, `text`, `tspan`, `defs`, `linearGradient`, `radialGradient`, `stop`, `clipPath`, `mask`, `marker`, `title`, and `desc`. Unknown properties are schema errors. Scripts, event attributes, `foreignObject`, external images, `use`, media, links, and embedded HTML are unavailable.

Values may be literals or use `bind`, `template`, `scale`, `map`, `when`/`then`/`else`, and `state`/`equals`/`then`/`else`. Scales support linear, threshold, ordinal, and safe automatic numeric domains. `position` compiles numeric translate, rotate, and scale values through the transform allowlist. Components use `aggregate`, `selectedRow`, or explicitly sorted `first` data context; they never silently choose an arbitrary first row.

Repeated marks use a named or current dataset, a bounded `limit`, and preferably `keyField`. `$index` and `$count` are available. Dataset lineage is retained so mark activation resolves to original Power BI rows. Nested repeats are not supported.

## Interactions and accessibility

Elements use the normal `interaction` and `uiAction` contracts. This includes internal highlight/filter, Power BI selection/filter, multi-select, overlays, state changes, navigation, and toasts. Interactive elements receive keyboard focus, button semantics, an accessible label, visible focus, and Enter/Space activation. Add component `ariaLabel` and `description`; animation must never be the only carrier of meaning.

## Animation and reduced motion

Presets are `fade-in`, `slide-in`, `scale-in`, `pulse`, `float`, `swim`, `rotate`, `draw-path`, `progress-fill`, `follow-progress`, `flow-dash`, `blink-status`, `bounce`, and `shimmer`. Triggers are `auto`, `hover`, `focus`, `selected`, `dataChange`, `state`, and `none`. Explicit keyframes permit only safe paint, opacity, transform, and geometry properties. Path morphing is not supported.

Motion defaults to `respect-system`. Reduced motion removes continuous movement while preserving final geometry, progress, color, text, and interaction. Offscreen animation is paused with `IntersectionObserver`; ordinary animations use scoped CSS keyframes, not JavaScript loops.

## Raw SVG

`type: "svgMarkup"` is an advanced escape hatch. HyperPBI resolves escaped field templates, parses the XML, validates each element and attribute, rejects external references, prefixes IDs and references, serializes it, and applies a final sanitizer before insertion. Raw SVG cannot contain script, events, `foreignObject`, `iframe`, object/embed, image/use, media, style elements, links, forms, `javascript:`, data/blob/network URLs, or external filters/masks/markers. Raw path injection from fields is not supported.

## Isolation and limits

Namespaces include the visual instance, component ID, and repeat key. Local IDs, `url(#id)` references, markers, gradients, masks, clip paths, filters, and keyframe names are rewritten deterministically. Defaults are 500 elements per component, 2,000 per dashboard, 20 animated elements per component, 50 per dashboard, 100 repeated rows by default, 250 maximum, 20,000 path characters, depth 20, and repeat depth one. Definition limits are 50 gradients, 25 masks, 50 clip paths, and 50 markers. Developer diagnostics report counts and sanitizer/performance warnings.

## AI authoring

Ask AI tools for declarative `svg`, field aliases only, stable IDs, bounded repetition, preset animations, an `ariaLabel`, and no external resources. HyperPBI adds this SVG guidance to generated AI prompts only when the request mentions SVG, animation, illustration, infographic, process flow, diagram, pictorial, gauge, schematic, pipeline, or moving markers.

See the five `examples/specs/svg-*.json` specifications for progress, pipeline, process, repeated pictorial, and sanitized raw examples.
