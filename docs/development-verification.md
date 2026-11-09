# Development verification

Use `npm run verify:fast` while developing, `npm run verify:pr` before review, and `npm run verify:full` at integration/release checkpoints. These commands record real step durations and exit codes under ignored `.verification/` files and stop on failure. They never report skipped work as passed.

Fast verification uses a bounded critical suite for shared-contract edits or changes spanning more than twenty code files; smaller feature edits use dependency-related test selection. PR verification broadens shared renderer/schema/security changes to all unit tests.

Changed paths include the merge-base diff against `origin/main`, tracked working changes and untracked source files. In CI set `HYPERPBI_VERIFY_BASE` to the PR base commit. Override locally with `-- --base <commit>` or provide a focused list with `-- --files src/fragments/remoteFragmentRequest.ts`. Add `--dry-run` before `--files` to inspect the plan. In Windows PowerShell, use `npm.cmd run verify:fast -- --files ...` or `node scripts/verify.mjs fast --files ...` to preserve named arguments through the npm wrapper. Use a base spanning the entire change, not merely the last fix commit.

| Change | Fast | PR | Full |
|---|---|---|---|
| TypeScript runtime | Incremental typecheck, changed-file lint, dependency-related unit tests | Runtime/web/Playground types, lint, related tests | All types/lint/unit tests |
| Shared renderer, schema, data, security or network | Related unit tests and one live MiniUp chart and popup browser smoke | All unit tests and essential renderer, map, and Dynamic Content browser checks | Every runtime and Playground browser test |
| Map runtime or Map Studio | Related tests and one remote popup smoke | Map runtime and popup integration smoke | Complete browser suites |
| Documentation, examples, metadata | Generated-doc check, links/counts/host claims, executable examples | Same checks plus affected website build | Same checks |
| Website / runtime island | Relevant types/lint/unit tests | Website build and Playground save/reload smoke | One OpenNext website build and Worker staging |
| Package/build configuration | Incremental types and relevant lint/unit tests | All unit tests and affected web/Playground builds | Serialized Core then Maps packaging and archive capability inspection |

Fast checks do not build a production website or package Power BI. PR checks do not package Power BI; shared-contract changes broaden unit coverage rather than selecting one convenient suite. Full checks preserve release coverage, including security, portability, examples, actual ECharts behavior and package contents. Packaged-archive fixture tests remain available during unit testing; final `package:verify` checks the newly produced archives.

## Measured bottlenecks and changes

The original complete unit run starts jsdom for every test file. Pure computation suites now use the Node environment; UI suites retain jsdom and canvas/ResizeObserver setup. Browser servers already reused Vite transforms and did not need another production build. Browser workers are capped at two to limit concurrent heavy chart/editor pages and reduce memory contention; screenshots are produced on failure plus the explicitly requested feature screenshots.

The old CI built Next once with `web:build` and again inside `web:sites:build`. Full verification builds the website through the existing OpenNext/Sites pipeline once, then stages the deployable Worker. PRs build only affected targets. TypeScript and ESLint reuse their incremental caches. Power BI packaging keeps the existing profile lock: Core and Maps are serialized because their temporary capability/provider files share the checkout. CI uploads the already verified artifacts instead of packaging again in a publication job.

CI separates pull-request verification from main/manual full integration. Dependency, TypeScript and lint caches are retained with source/toolchain-aware keys. Playwright browser installation is explicit on CI; local checks use the installed browser. No meaningful test cases were dropped to lower a count.

See [the implementation report](releases/2026-11-remote-fragments.md) for measured durations and the limits of comparing local timings to hosted CI.
