# Security

HyperPBI does not execute user JavaScript. `eval`, `new Function`, scripts, iframes, object/embed, forms, unsafe controls, inline event handlers, and external runtime scripts are prohibited.

DOMPurify sanitizes HTML after template substitution. CSS Tree parses CSS; an allowlist removes imports, URLs, expressions, behavior, fixed positioning, unknown properties, and extreme z-index. Selectors are scoped to the visual or component instance. Popup and slot HTML use the same sanitizer.

External network access exists only in the maps build, through configured basemap/geocoder providers and declared WebAccess domains. Address geocoding requires an explicit Studio action and privacy acknowledgement.
