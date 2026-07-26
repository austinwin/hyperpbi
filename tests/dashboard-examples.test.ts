import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type powerbi from "powerbi-visuals-api";
import { describe, expect, it, vi } from "vitest";
import { parseConfig } from "../src/config/hyperpbiConfig";
import { parseCsvRows, parseCsvText } from "../src/data/fileImport";
import { createPowerBiDataWorkspace } from "../src/data/dataWorkspace";
import { parseDataView } from "../src/data/parseDataView";
import type { NormalizedField, Primitive } from "../src/data/normalizeData";
import { prepareAuthoringData } from "../src/editor/prepareAuthoringData";
import { createFieldAliasRegistry } from "../src/fields/fieldAliasRegistry";
import { instantiateDashboardExample } from "../src/playground/dashboardExample";
import { analyzePowerBiPortability } from "../src/playground/powerBiPortability";
import { exportProjectBundle, importProjectBundle } from "../src/playground/projectBundle";
import type { HyperPbiSchema } from "../src/schema/hyperpbiSchema";
import { validateV2Schema } from "../src/schema/validateV2Schema";

interface DashboardExampleManifestEntry {
    id: string;
    slug: string;
    title: string;
    useCase: string;
    summary: string;
    description: string;
    theme: "light" | "dark";
    accent: string;
    tags: string[];
    referenceImages: number[];
    folder: string;
    specification: string;
    runtime: string;
    data: string;
    project: string;
    powerBiPackage: "core" | "maps";
    expected: string;
    limitations: string;
}

const dashboardRoot = resolve(process.cwd(), "examples/dashboards");
const manifest = JSON.parse(readFileSync(resolve(dashboardRoot, "manifest.json"), "utf8")) as {
    version: string;
    examples: DashboardExampleManifestEntry[];
};
const expectedSlugs = [
    "capital-project-controls",
    "digital-banking-overview",
    "industrial-network-telemetry",
    "media-web-performance",
    "patient-care-operations",
    "retail-sales-operations",
    "talent-acquisition",
    "urban-mobility-command-center",
];
const fixedTimestamp = "2026-07-25T00:00:00.000Z";
// `fitMode: "data"` is deliberate for the fleet point layer. The map validator
// warns because that mode is only partially portable for other layer sources,
// so keep this exception scoped to the exact component property and code.
const expectedWarningKeysBySlug: Readonly<Record<string, readonly string[]>> = {
    "urban-mobility-command-center": [
        "/components/1/view/fitMode [MAP_CAPABILITY_LIMITATION]",
    ],
};

interface DiagnosticIdentity {
    code: string;
    path: string;
    severity: string;
}

type JsonObject = Record<string, unknown>;

function asset(entry: DashboardExampleManifestEntry, path: keyof Pick<
    DashboardExampleManifestEntry,
    "specification" | "runtime" | "data" | "project"
>): string {
    return resolve(dashboardRoot, entry[path]);
}

function exampleBySlug(slug: string): DashboardExampleManifestEntry {
    const example = manifest.examples.find(entry => entry.slug === slug);
    if (!example) throw new Error(`Missing dashboard example: ${slug}`);
    return example;
}

function specificationFor(example: DashboardExampleManifestEntry): HyperPbiSchema {
    return JSON.parse(readFileSync(asset(example, "specification"), "utf8")) as HyperPbiSchema;
}

function isJsonObject(value: unknown): value is JsonObject {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function componentById(specification: HyperPbiSchema, id: string): JsonObject {
    const pending: unknown[] = [...specification.components];
    while (pending.length) {
        const candidate = pending.shift();
        if (!isJsonObject(candidate)) continue;
        if (candidate.id === id) return candidate;
        for (const key of ["children", "footer", "tabs", "items", "chart"]) {
            const nested = candidate[key];
            if (Array.isArray(nested)) pending.push(...nested);
            else if (nested !== undefined) pending.push(nested);
        }
    }
    throw new Error(`Missing component: ${id}`);
}

function warningKeys(diagnostics: readonly DiagnosticIdentity[]): string[] {
    return diagnostics
        .filter(diagnostic => diagnostic.severity === "warning")
        .map(diagnostic => `${diagnostic.path} [${diagnostic.code}]`)
        .sort();
}

function warningKeysFromMessages(messages: readonly string[]): string[] {
    return messages.map(message => {
        const match = /^(.+?) \[([^\]]+)\]/.exec(message);
        return match ? `${match[1]} [${match[2]}]` : message;
    }).sort();
}

function expectedWarningKeys(slug: string): string[] {
    return [...(expectedWarningKeysBySlug[slug] ?? [])].sort();
}

function powerBiType(field: NormalizedField): powerbi.ValueTypeDescriptor {
    if (field.dataType === "number") return { numeric: true };
    if (field.dataType === "boolean") return { bool: true };
    if (field.dataType === "date" || field.dataType === "datetime") return { dateTime: true };
    return { text: true };
}

function powerBiValue(value: Primitive, field: NormalizedField): powerbi.PrimitiveValue {
    if (value === null || value === undefined) {
        return null as unknown as powerbi.PrimitiveValue;
    }
    if (
        (field.dataType === "date" || field.dataType === "datetime") &&
        typeof value === "string"
    ) {
        return new Date(value);
    }
    return value;
}

function powerBiDataViewFromCsv(
    csvText: string,
    exampleSlug: string
): {
    dataView: powerbi.DataView;
    headers: string[];
    expectedRowCount: number;
} {
    const uploaded = parseCsvText(csvText, `${exampleSlug}.csv`);
    const fields = Object.values(uploaded.data.fields);
    const headers = fields.map(field => field.displayName);
    const columns = fields.map((field, index) => ({
        displayName: field.displayName,
        index,
        queryName: `ExampleData.${field.displayName}`,
        roles: { values: true },
        type: powerBiType(field),
        isMeasure: false,
    })) as powerbi.DataViewMetadataColumn[];
    const rows = uploaded.data.rows.map(row =>
        fields.map(field => powerBiValue(row[field.key], field))
    );

    return {
        dataView: {
            metadata: { columns },
            table: { columns, rows },
        } as powerbi.DataView,
        headers,
        expectedRowCount: rows.length,
    };
}

describe("portable dashboard examples", () => {
    it("indexes the complete real-world dashboard set with stable metadata", () => {
        expect(manifest.version).toBe("1.0");
        expect(manifest.examples.map(example => example.slug).sort()).toEqual(expectedSlugs);
        expect(new Set(manifest.examples.map(example => example.id)).size).toBe(manifest.examples.length);
        expect(new Set(manifest.examples.map(example => example.folder)).size).toBe(manifest.examples.length);

        for (const example of manifest.examples) {
            expect(example.id).toBe(example.slug);
            expect(example.folder).toBe(example.slug);
            expect(example.title.length).toBeGreaterThan(8);
            expect(example.useCase.length).toBeGreaterThan(12);
            expect(example.summary.length).toBeGreaterThan(30);
            expect(example.description.length).toBeGreaterThan(40);
            expect(example.expected.length).toBeGreaterThan(30);
            expect(example.limitations.length).toBeGreaterThan(20);
            expect(example.tags.length).toBeGreaterThanOrEqual(3);
            expect(example.referenceImages.length).toBeGreaterThan(0);
            expect(example.accent).toMatch(/^#[0-9a-f]{6}$/i);

            for (const path of ["specification", "runtime", "data", "project"] as const) {
                expect(existsSync(asset(example, path)), `${example.slug}: ${example[path]}`).toBe(true);
            }
            expect(existsSync(resolve(dashboardRoot, example.folder, "README.md"))).toBe(true);
        }
    });

    it("keeps every specification strict-valid and every dataset inside Power BI limits", () => {
        const failures: string[] = [];

        for (const example of manifest.examples) {
            const specification = JSON.parse(readFileSync(asset(example, "specification"), "utf8")) as unknown;
            const validation = validateV2Schema(specification);
            for (const diagnostic of validation.diagnostics.filter(item => item.severity === "error")) {
                failures.push(`${example.slug} ${diagnostic.path} ${diagnostic.code}`);
            }
            expect(
                warningKeys(validation.diagnostics),
                `${example.slug}: unexpected strict-schema warning`
            ).toEqual(expectedWarningKeys(example.slug));

            const rows = parseCsvRows(readFileSync(asset(example, "data"), "utf8"));
            if (rows.length < 2) failures.push(`${example.slug} has no data rows`);
            if ((rows[0]?.length ?? 0) > 50) failures.push(`${example.slug} exceeds the 50-field Power BI limit`);
            if (rows.length - 1 > 30_000) failures.push(`${example.slug} exceeds the 30,000-row Power BI window`);
            if (new Set(rows[0]).size !== rows[0]?.length) failures.push(`${example.slug} has duplicate CSV headers`);
        }

        expect(failures).toEqual([]);
    });

    it.each(manifest.examples)(
        "$slug survives the real single-Values Power BI ingestion and preparation path",
        example => {
            const specificationText = readFileSync(asset(example, "specification"), "utf8");
            const runtimeText = readFileSync(asset(example, "runtime"), "utf8");
            const csvText = readFileSync(asset(example, "data"), "utf8");
            const { dataView, headers, expectedRowCount } = powerBiDataViewFromCsv(
                csvText,
                example.slug
            );

            expect(dataView.table?.columns).toHaveLength(headers.length);
            expect(dataView.table?.rows).toHaveLength(expectedRowCount);
            expect(dataView.table?.columns.every(column => column.roles?.values)).toBe(true);
            expect(dataView.table?.columns.every(column => column.isMeasure === false)).toBe(true);

            const normalized = parseDataView(dataView);
            expect(Object.keys(normalized.fields)).toHaveLength(headers.length);
            expect(normalized.rows).toHaveLength(expectedRowCount);
            expect(normalized.rowKeys).toHaveLength(expectedRowCount);
            expect(new Set(normalized.rowKeys).size).toBe(expectedRowCount);
            expect(normalized.aggregates.count).toBe(expectedRowCount);

            const fieldManifest = createFieldAliasRegistry(normalized);
            expect(fieldManifest.errors).toEqual([]);
            expect(fieldManifest.entries.map(field => field.alias).sort()).toEqual(
                [...headers].sort()
            );
            expect(fieldManifest.entries.every(field => field.kind === "column")).toBe(true);
            expect(fieldManifest.entries.every(field => field.origin === "powerbi-column")).toBe(true);
            expect(fieldManifest.entries.every(field => field.supportsExternalFilter)).toBe(true);

            const prepared = prepareAuthoringData(
                specificationText,
                runtimeText,
                normalized
            );
            expect(prepared.errors, prepared.errors.join("\n")).toEqual([]);
            expect(
                prepared.diagnostics.filter(diagnostic => diagnostic.severity === "error"),
                prepared.diagnostics
                    .filter(diagnostic => diagnostic.severity === "error")
                    .map(diagnostic => `${diagnostic.path}: ${diagnostic.message}`)
                    .join("\n")
            ).toEqual([]);
            expect(
                warningKeys(prepared.diagnostics),
                `${example.slug}: unexpected Power BI preparation warning`
            ).toEqual(expectedWarningKeys(example.slug));
            expect(prepared.specification).toBeDefined();
            expect(prepared.config).toBeDefined();
            expect(prepared.configuredData?.rows).toHaveLength(expectedRowCount);
            expect(prepared.datasets?.get("powerbi")?.data.rows).toHaveLength(expectedRowCount);
            expect(prepared.datasets?.get("powerbi")?.lineage).toHaveLength(expectedRowCount);
            expect(prepared.datasetEvaluation?.errors).toEqual([]);

            const specification = JSON.parse(specificationText) as HyperPbiSchema;
            for (const datasetName of Object.keys(specification.data?.datasets ?? {})) {
                expect(prepared.datasets?.has(datasetName), datasetName).toBe(true);
            }

            const parsedRuntime = parseConfig(runtimeText);
            expect(parsedRuntime.errors).toEqual([]);
            expect(parsedRuntime.config?.providers?.mode).toBe(example.powerBiPackage);
            if (example.powerBiPackage === "maps") {
                expect(parsedRuntime.config?.providers?.basemap?.enabled).toBe(true);
                expect(parsedRuntime.config?.providers?.privacyAcknowledged).toBe(true);
            } else {
                expect(parsedRuntime.config?.providers?.basemap?.enabled).toBe(false);
            }

            const portability = analyzePowerBiPortability(
                specification,
                parsedRuntime.config!,
                createPowerBiDataWorkspace(normalized)
            );
            expect(portability.status).toBe("compatible");
            expect(portability.issues.filter(issue => issue.severity === "error")).toEqual([]);
            expect(portability.powerBiSpecification).toBeDefined();
        }
    );

    it("instantiates each example without host APIs and reproduces its checked-in project bundle", () => {
        const failures: string[] = [];

        for (const example of manifest.examples) {
            const specification = JSON.parse(readFileSync(asset(example, "specification"), "utf8")) as unknown;
            const runtimeConfiguration = JSON.parse(readFileSync(asset(example, "runtime"), "utf8")) as unknown;
            const csvText = readFileSync(asset(example, "data"), "utf8");

            try {
                const instantiated = instantiateDashboardExample({
                    id: example.id,
                    title: example.title,
                    specification,
                    runtimeConfiguration,
                    csvText,
                    dataFileName: "data.csv",
                }, {
                    projectId: `example-${example.id}`,
                    createdAt: fixedTimestamp,
                    updatedAt: fixedTimestamp,
                    requirePowerBiCompatible: true,
                });
                if (instantiated.portability.status !== "compatible") {
                    failures.push(`${example.slug} portability: ${instantiated.portability.status}`);
                }
                const actualWarningKeys = warningKeysFromMessages(instantiated.warnings);
                const allowedWarningKeys = expectedWarningKeys(example.slug);
                if (JSON.stringify(actualWarningKeys) !== JSON.stringify(allowedWarningKeys)) {
                    failures.push(
                        `${example.slug} warnings: ${actualWarningKeys.join(", ") || "none"}`
                    );
                }

                const expectedBundle = readFileSync(asset(example, "project"), "utf8").trim();
                const actualBundle = exportProjectBundle(instantiated.project);
                if (actualBundle !== expectedBundle) failures.push(`${example.slug} project bundle is stale`);

                const imported = importProjectBundle(expectedBundle);
                for (const error of imported.errors) failures.push(`${example.slug} bundle import: ${error}`);
            } catch (error) {
                failures.push(`${example.slug} instantiation: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        expect(failures).toEqual([]);
    });

    it("imports the same maintained example as distinct fresh local copies", () => {
        const example = exampleBySlug("talent-acquisition");
        const bundle = readFileSync(asset(example, "project"), "utf8");
        const source = JSON.parse(bundle) as { metadata: { id: string; createdAt: string; updatedAt: string } };

        vi.useFakeTimers();
        try {
            vi.setSystemTime(new Date("2026-07-26T12:00:00.000Z"));
            const first = importProjectBundle(bundle);
            vi.setSystemTime(new Date("2026-07-26T12:05:00.000Z"));
            const second = importProjectBundle(bundle);

            expect(first.errors).toEqual([]);
            expect(second.errors).toEqual([]);
            expect(first.project?.metadata.id).not.toBe(source.metadata.id);
            expect(second.project?.metadata.id).not.toBe(source.metadata.id);
            expect(first.project?.metadata.id).not.toBe(second.project?.metadata.id);
            expect(first.project?.metadata.createdAt).toBe("2026-07-26T12:00:00.000Z");
            expect(first.project?.metadata.updatedAt).toBe("2026-07-26T12:00:00.000Z");
            expect(second.project?.metadata.createdAt).toBe("2026-07-26T12:05:00.000Z");
            expect(second.project?.metadata.updatedAt).toBe("2026-07-26T12:05:00.000Z");
            expect(first.project?.dataWorkspace).toEqual(second.project?.dataWorkspace);
        } finally {
            vi.useRealTimers();
        }
    });

    it("preserves the audited design and dataset invariants", () => {
        const capital = exampleBySlug("capital-project-controls");
        const progressGauges = componentById(specificationFor(capital), "progressgauges");
        expect(progressGauges.columns).toBe(3);
        expect(
            Array.isArray(progressGauges.children)
                ? progressGauges.children.map(child => isJsonObject(child) ? child.span : undefined)
                : []
        ).toEqual([1, 1, 1]);

        const media = exampleBySlug("media-web-performance");
        const mediaRows = parseCsvText(
            readFileSync(asset(media, "data"), "utf8"),
            "media-web-performance.csv"
        ).data.rows;
        expect(mediaRows.find(row => row.recordtype === "Summary")?.bouncerate).toBe(82.5);
        expect(componentById(specificationFor(media), "bouncegauge")).toMatchObject({
            options: {
                series: [{
                    max: 100,
                    detail: { formatter: "{value}%" },
                }],
            },
        });

        const patient = exampleBySlug("patient-care-operations");
        const patientRows = parseCsvText(
            readFileSync(asset(patient, "data"), "utf8"),
            "patient-care-operations.csv"
        ).data.rows;
        expect(patientRows).toHaveLength(72);
        expect(componentById(specificationFor(patient), "carecalendar").html).toContain(
            "72 encounters"
        );

        const banking = exampleBySlug("digital-banking-overview");
        const bankingCsvText = readFileSync(asset(banking, "data"), "utf8");
        const bankingRows = parseCsvText(
            bankingCsvText,
            "digital-banking-overview.csv"
        ).data.rows.filter(row => row.recordtype === "Transaction");
        const transactionTypesByCategory = new Map<string, Set<string>>();
        for (const row of bankingRows) {
            const category = String(row.category);
            const transactionType = String(row.transactiontype);
            const types = transactionTypesByCategory.get(category) ?? new Set<string>();
            types.add(transactionType);
            transactionTypesByCategory.set(category, types);
        }
        expect([...transactionTypesByCategory.keys()].sort()).toEqual([
            "Food",
            "Health",
            "Shopping",
            "Travel",
        ]);
        for (const types of transactionTypesByCategory.values()) {
            expect([...types].sort()).toEqual(["Credit", "Debit"]);
        }
        const bankingDataView = powerBiDataViewFromCsv(bankingCsvText, banking.slug).dataView;
        const preparedBanking = prepareAuthoringData(
            readFileSync(asset(banking, "specification"), "utf8"),
            readFileSync(asset(banking, "runtime"), "utf8"),
            parseDataView(bankingDataView)
        );
        const expensesData = preparedBanking.datasets?.get("expenses")?.data;
        const expenseCategoryKey = Object.values(expensesData?.fields ?? {})
            .find(field => field.displayName === "category")?.key;
        expect(expenseCategoryKey).toBeDefined();
        expect(
            expensesData?.rows
                .map(row => expenseCategoryKey ? row[expenseCategoryKey] : undefined)
                .sort()
        ).toEqual(["Food", "Health", "Shopping", "Travel"]);

        const telemetry = exampleBySlug("industrial-network-telemetry");
        const telemetryCsvText = readFileSync(asset(telemetry, "data"), "utf8");
        const telemetryRows = parseCsvText(
            telemetryCsvText,
            "industrial-network-telemetry.csv"
        ).data.rows.filter(row => row.recordtype === "Reading");
        const networksByNode = new Map<string, Set<string>>();
        for (const row of telemetryRows) {
            const site = String(row.site);
            const networks = networksByNode.get(site) ?? new Set<string>();
            networks.add(String(row.network));
            networksByNode.set(site, networks);
        }
        expect(networksByNode.size).toBe(8);
        expect([...networksByNode.values()].every(networks => networks.size === 1)).toBe(true);
        const preparedTelemetry = prepareAuthoringData(
            readFileSync(asset(telemetry, "specification"), "utf8"),
            readFileSync(asset(telemetry, "runtime"), "utf8"),
            parseDataView(powerBiDataViewFromCsv(telemetryCsvText, telemetry.slug).dataView)
        );
        expect(preparedTelemetry.datasets?.get("sites")?.data.rows).toHaveLength(8);
        expect(
            componentById(specificationFor(telemetry), "networktopology").ariaLabel
        ).toBe("Industrial network topology");

        const talent = exampleBySlug("talent-acquisition");
        const talentCsvText = readFileSync(asset(talent, "data"), "utf8");
        const talentRows = parseCsvText(
            talentCsvText,
            "talent-acquisition.csv"
        ).data.rows;
        const currentApplications = talentRows.filter(row => row.period === "Current");
        const preparedTalent = prepareAuthoringData(
            readFileSync(asset(talent, "specification"), "utf8"),
            readFileSync(asset(talent, "runtime"), "utf8"),
            parseDataView(powerBiDataViewFromCsv(talentCsvText, talent.slug).dataView)
        );
        expect(preparedTalent.configuredData?.calculatedMetrics).toMatchObject({
            totalapplications: currentApplications.length,
            shortlisted: currentApplications.filter(row => row.stage === "Shortlisted").length,
            rejected: currentApplications.filter(row => row.stage === "Rejected").length,
            finalised: currentApplications.filter(row => row.stage === "Finalised").length,
        });
    });

    it("documents both supported hosts and the applicable Power BI package", () => {
        for (const example of manifest.examples) {
            const readme = readFileSync(resolve(dashboardRoot, example.folder, "README.md"), "utf8");
            expect(readme).toContain("## Playground");
            expect(readme).toContain("## Power BI");
            expect(readme).toContain("single **Values** field well");
            expect(readme).toContain(example.powerBiPackage === "maps" ? "HyperPBI Maps" : "HyperPBI Core");
            if (example.powerBiPackage === "maps") {
                expect(readme).toContain("fetches remote tiles");
                expect(readme).toContain("network connection is required");
                expect(readme).not.toContain("complete offline Playground project");
                expect(readme).not.toContain("contains no credentials or remote data");
            } else {
                expect(readme).toContain("complete offline Playground project");
                expect(readme).toContain("contains no credentials or remote data");
            }
        }
    });
});
