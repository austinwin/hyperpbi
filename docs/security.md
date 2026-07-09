# HyperPBI Security

## JSON is Data, Not Code

HyperPBI specifications are static JSON objects. HyperPBI never executes user-supplied code:

- No `eval`, `new Function`, or `Function` constructor
- No inline event handlers (`onclick`, `onerror`, etc.)
- No `<script>`, `<iframe>`, `<object>`, or `<embed>` tags
- No JavaScript URLs (`javascript:`)
- No dynamic module imports
- No browser navigation from user data
- No arbitrary URL opening

## HTML Sanitization

All user-supplied HTML is sanitized with DOMPurify before rendering:
- Scripts, iframes, event handlers, and unsafe elements are removed
- Popup templates are sanitized before DOM insertion
- Slot content is sanitized per slot
- Trusted-author mode (`htmlMode: "trusted"`) relaxes sanitization for controlled environments but still blocks scripts and event handlers

## CSS Sanitization

All user-supplied CSS is parsed with css-tree, validated against an allowlist, and scoped:
- Only approved CSS properties are permitted
- `position: fixed` is blocked (would escape the visual)
- `z-index` values above 100 are blocked
- CSS `url()`, `expression()`, `behavior:`, and `javascript:` are blocked
- `@import`, `@font-face`, `@namespace` rules are blocked
- CSS is scoped to the visual root or component element
- Internal runtime CSS (overlays, toasts) uses higher controlled z-index values from trusted source code

## UI Action Safety

UI actions are declarative and safe:
- Never execute strings as code
- Never navigate the browser
- Never open arbitrary URLs
- Never import modules
- Only dispatch known engine actions
- Validate required targets before execution
- Clamp toast duration to 1-30 seconds
- Cap toast queue to 5 messages

## Overlay Safety

- All overlays render within `.hyperpbi-root` — no portal to `document.body`
- Modal uses `position: absolute` within the visual root
- Backdrop and Escape close work for modals
- Dropdown and popover render near their triggers
- No `position: fixed` used in overlay positioning

## Icon Safety

- Icons come from a curated, bundled registry of ~40 SVG icons
- No arbitrary SVG strings accepted from JSON
- Icons use `currentColor` and safe SVG attributes
- Decorative icons hidden from assistive technology

## Chart Option Sanitization

- ECharts options are recursively sanitized
- JavaScript function callbacks are blocked
- Event handler keys are removed
- External URLs and executable markup are blocked
- Safe string formatter templates are allowed

## External Provider Builds

### Core Package
- No WebAccess privileges
- External request call sites removed by SDK certification-fix
- No external tiles, geocoding, or ArcGIS requests possible

### Maps Package
- WebAccess for declared hosts only
- Hosts specified at package build time via `HYPERPBI_MAP_HOSTS`
- User-entered URLs cannot bypass package privileges
- ArcGIS Online wildcards included by default

## ArcGIS REST Security

- HTTPS required for all service URLs
- Host allowlist enforced at build time
- Recognized ArcGIS REST path patterns only
- No credentials embedded in URLs (rejected by parser)
- No tokens in JSON specification
- No persisted tokens
- No OAuth or portal authentication

### Query Safety
- WHERE clauses built from validated field metadata only
- String values safely quoted with apostrophe escaping
- No SQL comments, semicolons, or injection vectors
- Query size limited per batch
- Feature count limited per layer
- No `outFields=*` by default — minimal field list computed from configuration

### Public Services Only
- Secured services (ArcGIS error 498/499, HTTP 401/403) are detected
- Clear "requires authentication — public layers only" message displayed
- No token field exposed to users
- No authentication flow implemented

## Join Privacy

When a geometry join is configured:
- Only the explicit join-key field values are transmitted to the service host
- No other Power BI fields are sent
- Values are normalized and deduplicated before transmission
- The report author must acknowledge this before saving (when Map Builder is implemented)

## Request Limits and Cancellation

- Requests are aborted when components unmount
- Timeout enforced on all external requests (default 30s)
- Maximum 2 retries for transient errors (429, 5xx)
- No retry for authentication or validation failures
- Concurrent request limiting (default 4)
- Response size bounded
- Feature count bounded (default 20,000 per layer, 30,000 join keys)

## Server Errors

Service errors do not expose internal implementation details. Standardized messages map common ArcGIS error codes to user-friendly explanations.

## Trusted-Author Mode

For controlled internal dashboards:
- `cssMode: "trusted"` — broader CSS property set, still blocks `position: fixed` and `url()`
- `htmlMode: "trusted"` — relaxed sanitization, still blocks scripts and event handlers
- Never fully disables security — no code execution regardless of mode

## Known Limitations

- Focus trapping not yet implemented for modals
- No Content Security Policy header control (Power BI host responsibility)
- No request signing or HMAC for ArcGIS queries
- No encrypted storage for cached metadata
- ArcGIS REST layered rendering is developer preview — runtime integration incomplete
