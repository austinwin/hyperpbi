HyperPBI SVG Full Demo

Files
-----
1. hyperpbi_svg_demo_data.csv
2. hyperpbi_svg_full_demo.json

How to use
----------
1. Import the CSV into Power BI.
2. Add every CSV column to the HyperPBI Values field well.
3. Open HyperPBI Edit mode.
4. Paste the JSON specification into the JSON editor.
5. Validate and preview, then save.

The simple PascalCase CSV headers generate these HyperPBI 2.0 aliases:
alertLevel, assetId, assetName, assetType, capacityMgd, colorHex, completionPct, completionWidth, detailText, energyPct, flowMgd, inspectionCount, lastUpdated, pressurePsi, progressDashOffset, recordOrder, recordType, region, riskScore, stageOrder, stageProgress, status, targetCount, targetPct, uptimePct, xPosition, yPosition

Demonstrated SVG capabilities
-----------------------------
- Declarative SVG elements
- Linear and radial gradients
- Clip paths and local marker references
- Field templates
- Linear scales and mapped colors
- Conditional visibility
- Named logical datasets
- Repeated data marks
- Source-row interaction and Power BI selection
- Preset animations
- Explicit safe keyframes
- Reduced-motion behavior
- Offscreen animation pausing
- Scoped CSS
- Raw sanitized SVG with field templates
- Element and animation performance budgets

Validation summary
------------------
CSV rows: 24
Top-level components: 7
Worst-case declarative SVG elements: 273
Worst-case declarative SVG animations: 41
Referenced fields verified: 21
