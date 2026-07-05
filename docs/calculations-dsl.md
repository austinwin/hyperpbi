# Calculation DSL

Calculated fields run row-by-row in dependency order. Metrics run over the current filtered row set. Validation rejects duplicate/missing fields, unknown operators, and dependency cycles. Divide-by-zero and invalid dates return null rather than crashing.

References use `{ "field": "risk_score" }`; literals use `{ "value": 80 }`. Operators include arithmetic, comparison, boolean, text, date, null, conditional, and case operations. Metrics support count/countWhere, sum/sumWhere, avg/avgWhere, min, max, distinctCount, ratio, and percentOfTotal.

```json
{"fields":[{"key":"risk_band","type":"text","expression":{"op":"if","condition":{"op":">=","left":{"field":"risk_score"},"right":{"value":80}},"then":{"value":"High"},"else":{"value":"Normal"}}}],"metrics":[{"key":"high_risk_count","aggregation":"countWhere","where":{"op":"=","left":{"field":"risk_band"},"right":{"value":"High"}}}]}
```
