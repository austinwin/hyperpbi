# Content and custom components

Choose the narrowest implemented component. Standard custom content is sanitized. Explicit trusted mode supports authored browser markup in an isolated document; it does not replace native map integration.

| Type | Content | Binding/repetition | Security |
|---|---|---|---|
| `text` | Plain text | templates/repeat where supported | rendered as text |
| `markdown` | Structured explanatory text | templates/repeat | parsed output is sanitized |
| `html` | Branded static HTML | templates/repeat and slots | DOMPurify-sanitized |
| `custom` | App-like repeated cards/lists/slicers | `html`, slots, `repeat`, safe `interactions` | HTML sanitized; CSS parsed/scoped |
| `svg` | Structured governed vector scene | typed values, dataset context, repeats, interaction/UI actions | element/property schema, ID isolation, limits |
| `svgMarkup` | One raw SVG document | Escaped text templates for authored markup or `svgBinding` for SVG from a text field | strict SVG parser/sanitizer |

## HTML, slots, and CSS

Normal HTML blocks remove scripts, iframes, object/embed, links/meta, forms/inputs/buttons/selects/textareas, style/base, inline style, `srcset`, form actions, and unsafe URI forms. Data attributes are not accepted; ARIA attributes are.

Component CSS is parsed with `css-tree`, allowlists properties, rejects imports/font-face/document/page/namespace, blocks unsafe URLs/expressions/fixed positioning/abusive z-index, scopes selectors under the component ID, and namespaces safe keyframes. Global CSS uses the corresponding visual scope.

Slots are named HTML fragments (`header`, `subheader`, `body`, `footer`, `actions`, `empty`, `item`, `row`, `cell`, `popup`, `tooltip`, `legend`, `badge`) and pass through the same sanitization.

## Repetition and field binding

Content repeat uses source `rows`, an optional row alias, a bounded `limit`, a template, optional `distinctBy`, `sortBy`, and `sortDirection: asc|desc`. Templates resolve known fields; they are not expressions or HTML-code generators.

For an interactive custom slicer/list, combine a repeat with a safe `interactions.onClick` action such as `selectWhere`, then let the universal `interaction` policy determine internal/external behavior. External filtering still requires a real model-column field.

## SVG distinction

`svg` is a first-class declarative scene graph and should be preferred. It can bind individual geometry/text/paint values, use scales/conditions/state, repeat marks, run allowlisted animation presets, and attach normal interaction/UI actions to elements.

`svgMarkup` is advanced fallback markup. Authored templates are XML-escaped and cannot create tag or attribute names or inject path data. The sanitizer removes external resources, handlers, inline styles, links, images, use, and unknown references. [SVG data binding and supported animation](svg-visuals.md#svg-from-a-power-bi-slicer)

## Prefer first-class components

Use `card`, `listGroup`, `dataGrid`, `detailPanel`, `dropdown`, `popover`, `offcanvas`, `modal`, semantic charts, `table`, `matrix`, or `map` when they fit. These components provide stronger schema validation, accessibility, interactions, and responsive behavior than simulated custom markup.


## Trusted authoring

Runtime Config `security.htmlMode: "trusted"` uses the same isolated document renderer for HTML, custom repeats and slots. `security.svgMode: "trusted"` enables arbitrary raw SVG. `security.cssMode: "trusted"` isolates unrestricted styles in a contained Shadow DOM and passes authored styles to trusted documents. Standard behavior remains the default. Field values are bound after parsing and cannot become executable markup. See [security boundaries and host limits](security.md#trusted-author-documents).

## Dynamic Content

Use `dynamicContent` for declarative trees returned from an approved API. Fragments can include validated text, Markdown, SVG, charts, and tables. Author custom HTML, slots, and overlays in the surrounding dashboard. [Dynamic Content guide](remote-fragments.md).
