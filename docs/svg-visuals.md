# SVG visuals

HyperPBI implements two governed vector components:

- `svg`: structured declarative scene graph; preferred
- `svgMarkup`: strictly sanitized raw SVG fallback

Use SVG for diagrams, process flows, pictorial marks, schematics, custom gauges, and animated KPI presentation. Use semantic ECharts components for standard analytical charts.

## Structured `svg`

Required properties are `viewBox` and `elements`; include `ariaLabel`. Optional component properties include width/height, preserveAspectRatio, role, description, dataContext, motion, performance, dataset, normal component interaction/UI actions, and shared styling.

### Supported elements

`g`, `path`, `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`, `text`, `tspan`, `defs`, `linearGradient`, `radialGradient`, `stop`, `clipPath`, `mask`, `marker`, `title`, and `desc`.

The schema allowlists properties by element family:

- shapes: coordinates, dimensions, path/points/pathLength
- text: text/position/anchor/baseline/font properties
- gradients/stops: endpoints/centers/radius/offset/color/opacity/units/transform/spread
- groups/defs/clip/mask/marker: marker dimensions/reference/orientation/viewBox/aspect
- common: safe paint/stroke/opacity/transform/position/reference/pointer/visibility, children, repeat, animation, interaction, and UI action

Unknown element types or properties are errors.

### Values and bindings

A value is a literal string/number/Boolean/null or an object using:

- `bind`: current-row field, `$index`, or `$count`
- `template`: `{{field}}`, `{{row.field}}`, or `{{state.key}}`
- `scale`: `linear|threshold|ordinal`, domain array or `auto`, range, optional clamp
- `map`: string-keyed value map with fallback
- `when`/`then`/`else`: field condition using the standard filter operators
- `state`/`equals`/`then`/`else`: dashboard-state condition

`position` resolves numeric x/y/rotate/scale into a safe transform. Literal transforms allow only numeric translate/scale/rotate/skew/matrix functions—no URL/expression content.

### Data contexts

- `aggregate` (default): sums fields whose non-null values are all finite numbers; otherwise takes the first non-null value
- `selectedRow`: uses the first selected row key; falls back to aggregate with a warning
- `first`: optionally sorts by `sortBy`; default direction is descending unless `asc`; warns when multiple rows are used without a sort field

The component's `dataset` controls its normal rows. An element repeat may name another dataset.

### Repeat semantics

`repeat` accepts optional `dataset`, `limit`, `keyField`, and required `children`.

- default row limit: 100
- hard row limit: 250
- nested repeats: not supported (`maxRepeatDepth: 1`)
- a missing `keyField` is allowed but warns because identity may be unstable
- repeated local IDs are re-namespaced per repeat key
- interaction against a repeated named dataset maps selected dataset rows through that dataset's lineage to source rows

### Interactions

An SVG element may carry the same universal `interaction` and `uiAction` as a component. Repeated elements carry their row index/key. Selection trigger state is computed from component-selected source rows. External filter rules remain unchanged: a real model-column field is required; derived fields/metrics cannot directly filter Power BI.

### Animations

Presets:

`fade-in`, `slide-in`, `scale-in`, `pulse`, `float`, `swim`, `rotate`, `draw-path`, `progress-fill`, `follow-progress`, `flow-dash`, `blink-status`, `bounce`, `shimmer`

Triggers:

`auto`, `hover`, `focus`, `selected`, `dataChange`, `state`, `none`

`state` requires `stateKey`; `selected` activates only for selected marks; `dataChange` changes the animation key when the bound row changes. Hover/focus use scoped selectors. `none` disables animation.

Duration is 100–60,000 ms; delay 0–30,000 ms; finite iterations 1–100. Infinite iteration is allowed only for continuous presets `pulse`, `float`, `swim`, `rotate`, `flow-dash`, `bounce`, and `shimmer`. Direction is `normal|reverse|alternate|alternate-reverse`; fill mode is `none|forwards|backwards|both`. Easing is limited to standard keywords, bounded cubic-bezier, or steps.

Custom keyframes allow only offset plus opacity, transform, fill/stroke properties, stroke dash offset, and x/y/cx/cy/r/width/height. Offset is 0–1.

`draw-path` is limited to path/line/polyline/polygon. `progress-fill` is limited to rect/line/path.

### Reduced motion and lifecycle

Motion policy is `respect-system`, `always-reduce`, or `never-reduce`. Component/runtime motion may also be disabled. Reduced mode emits no animation and leaves the authored final/static state. Every compiled animation also contains a `prefers-reduced-motion` guard. Offscreen/inactive SVG blocks pause animations.

The active animation budget is the minimum of component performance, component motion, runtime config (default 12), and the hard limit.

## Exact limits

| Limit | Value |
|---|---:|
| Elements per component | 500 |
| Elements per dashboard | 2,000 |
| Animated elements per component | 20 |
| Animated elements per dashboard | 50 |
| Default repeat rows | 100 |
| Maximum repeat rows | 250 |
| Path `d` characters | 20,000 |
| Gradients per component | 50 |
| Masks per component | 25 |
| Clip paths per component | 50 |
| Markers per component | 50 |
| Nesting depth | 20 |
| Repeat depth | 1 |
| Raw SVG markup characters | 250,000 |

Performance overrides (`maxElements`, `maxAnimatedElements`, `maxRepeatedRows`) can only lower the corresponding hard limits.

## `svgMarkup`

`svgMarkup` requires nonempty `svg` containing one parseable SVG document. Text templates are XML-escaped. Templates cannot create element/attribute names, and a field cannot inject `d` path data.

The sanitizer:

- accepts only `svg` plus the structured element allowlist
- accepts only the explicit attribute allowlist
- removes every `on*`, `style`, `href`, `xlink:href`, `src`, `srcset`, and form-action attribute
- blocks JavaScript/data/blob/HTTP/HTTPS/protocol-relative values
- rejects duplicate/unsafe IDs, namespaces valid IDs, and rewrites local references
- removes unknown/malformed local references
- blocks content deeper than 20 and paths longer than 20,000 characters
- returns an empty SVG when markup exceeds 500 elements
- applies a final DOMPurify SVG pass

Explicitly forbidden tags include `script`, `foreignObject`, `iframe`, `object`, `embed`, `image`, `use`, audio/video/canvas, `style`, `a`, `switch`, `set`, and `discard`. SVG filters are disabled in the final profile.

Raw markup does not accept arbitrary CSS. Component `css`, if used, still passes the scoped CSS sanitizer and may reference only safe local SVG IDs when that mode is enabled.

## Minimal example

```json
{
  "type": "svg",
  "id": "completion_gauge",
  "viewBox": "0 0 400 140",
  "height": 140,
  "ariaLabel": "Completion percentage",
  "dataContext": { "mode": "aggregate" },
  "motion": {
    "enabled": true,
    "reducedMotion": "respect-system",
    "maxConcurrentAnimations": 4
  },
  "elements": [
    {
      "type": "rect",
      "id": "track",
      "x": 20,
      "y": 70,
      "width": 360,
      "height": 20,
      "rx": 10,
      "fill": "#e5e7eb"
    },
    {
      "type": "rect",
      "id": "value",
      "x": 20,
      "y": 70,
      "width": {
        "bind": "completionRate",
        "scale": {
          "type": "linear",
          "domain": [0, 1],
          "range": [0, 360],
          "clamp": true
        }
      },
      "height": 20,
      "rx": 10,
      "fill": "#206bc4",
      "animation": {
        "preset": "progress-fill",
        "durationMs": 800
      }
    }
  ]
}
```
