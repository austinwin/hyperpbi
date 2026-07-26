# Digital Banking Overview

Captures the midnight Paycent reference with neon accents and a safe CSS-rendered card that works offline.

## Files

- `specification.json` — strict HyperPBI dashboard schema 2.0.
- `runtime.json` — Runtime Configuration protocol 1.0.
- `data.csv` — deterministic synthetic source data.
- `project.hyperpbi` — complete offline Playground project with normalized rows and stable row keys.

## Playground

Load this example from the Dashboard Examples gallery, or import `project.hyperpbi` from the Playground home page. The bundle is local-first and contains no credentials or remote data.

## Power BI

1. Import the HyperPBI Core PBIVIZ package.
2. Import `data.csv` as one table.
3. Add every column to HyperPBI's single **Values** field well. Keep the simple lowercase column names unchanged.
4. Paste `runtime.json` into Runtime Configuration.
5. Paste `specification.json` into Advanced JSON, validate, preview, and save.

All logical datasets use the portable `powerbi` source alias. The CSV has 18 fields, below the visual's 50-field limit, and 73 rows, below the 30,000-row Power BI window.

## Source fields

- `recordtype`
- `recordid`
- `accountname`
- `date`
- `month`
- `monthorder`
- `merchant`
- `category`
- `transactiontype`
- `amount`
- `status`
- `channel`
- `balance`
- `debit`
- `credit`
- `cardlast4`
- `cardholder`
- `expiry`

## Expected behavior

Account summary values, monthly debit/credit activity, category spending, and recent transactions render responsively from one source.

## Limitations

The payment card is a decorative dashboard element and never exposes or processes real card credentials.

All names, organizations, accounts, assets, and events are synthetic and provided only for product demonstration.
