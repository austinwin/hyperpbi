import type { NormalizedField } from "../../data/normalizeData";
import type { MapLayerDefinition } from "../../schema/mapSchema";
import type { PreparedAuthoringData } from "../prepareAuthoringData";

export function MapDiagnosticsPanel({
  layer,
  dataset,
  rows,
  fields,
  prepared,
  selectedMapPath,
  selectedLayerPath,
}: {
  layer: MapLayerDefinition;
  dataset: string;
  rows: Array<Record<string, unknown>>;
  fields: NormalizedField[];
  prepared: PreparedAuthoringData;
  selectedMapPath: string;
  selectedLayerPath: string;
}) {
  const layerIssues = prepared.diagnostics.filter(
    (item) =>
      item.path === selectedLayerPath ||
      item.path.startsWith(`${selectedLayerPath}/`),
  );
  const mapIssues = prepared.diagnostics.filter(
    (item) =>
      (item.path === selectedMapPath || item.path.startsWith(`${selectedMapPath}/`)) &&
      !item.path.startsWith(`${selectedMapPath}/layers/`),
  );
  const fieldSource =
    layer.renderer && "fieldSource" in layer.renderer
      ? layer.renderer.fieldSource
      : undefined;
  const serviceLayerId =
    layer.source.type === "arcgisFeature" ? layer.source.layerId : undefined;
  return (
    <div class="hp-map-studio-diagnostics">
      <dl>
        <div><dt>Exact JSON pointer</dt><dd><code>{selectedLayerPath}</code></dd></div>
        <div><dt>Effective dataset</dt><dd>{dataset}</dd></div>
        <div><dt>Source</dt><dd>{layer.source.type}</dd></div>
        <div><dt>Dataset rows</dt><dd>{rows.length}</dd></div>
        <div><dt>Fields</dt><dd>{fields.length}</dd></div>
        <div><dt>Field source</dt><dd>{fieldSource ?? "context default"}</dd></div>
        {serviceLayerId !== undefined && (
          <div><dt>Service layer ID</dt><dd>{serviceLayerId}</dd></div>
        )}
      </dl>
      <DiagnosticSection title="Selected layer static authoring diagnostics" issues={layerIssues} />
      <DiagnosticSection title="Selected map diagnostics" issues={mapIssues} />
      <section>
        <strong>Selected layer runtime diagnostics</strong>
        <p>Runtime request, geometry, join, feature, and timing diagnostics appear in the live layer panel.</p>
      </section>
      <section>
        <strong>Global map-provider diagnostics</strong>
        <p>Provider-access diagnostics remain separate from authored layer diagnostics.</p>
      </section>
    </div>
  );
}

function DiagnosticSection({
  title,
  issues,
}: {
  title: string;
  issues: PreparedAuthoringData["diagnostics"];
}) {
  return (
    <section>
      <strong>{title}</strong>
      {issues.length ? (
        <ul>
          {issues.slice(0, 25).map((item) => (
            <li>
              <code>{item.code}</code> <span>{item.severity}</span>{" "}
              <code>{item.path}</code>: {item.message}
            </li>
          ))}
        </ul>
      ) : (
        <p>None.</p>
      )}
    </section>
  );
}
