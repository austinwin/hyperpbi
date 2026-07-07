# Security

HyperPBI does not execute user JavaScript. `eval`, `new Function`, scripts, iframes, object/embed, forms, unsafe controls, inline event handlers, and external runtime scripts are prohibited.

Runtime Config defaults to `security.cssMode: "scoped"`, `security.htmlMode: "sanitized"`, and `security.showSanitizerWarnings: false`. This is the certification-oriented mode. The CSS allowlist covers normal dashboard layout, grid/flex, tables, typography, pseudo-content, outlines, filters, and responsive sizing while still blocking imports, external URLs, expressions, fixed positioning, and abusive z-index.

For controlled local/internal dashboards, `cssMode: "trusted"` accepts broader parsed declarations and `htmlMode: "trusted"` accepts a broader HTML/SVG vocabulary. Trusted-author mode is not an unsafe-script mode: scripts, inline event handlers, iframes, object/embed, unsafe links, and executable CSS remain blocked. Warnings are always available in Studio Issues and appear in rendered dashboards only when `showSanitizerWarnings` is explicitly enabled.

DOMPurify sanitizes HTML after template substitution. CSS Tree parses CSS; an allowlist removes imports, URLs, expressions, behavior, fixed positioning, unknown properties, and extreme z-index. Selectors are scoped to the visual or component instance. Popup and slot HTML use the same sanitizer.

External network access exists only in the maps build, through configured basemap/geocoder providers and declared WebAccess domains. Address geocoding requires an explicit Studio action and privacy acknowledgement.
