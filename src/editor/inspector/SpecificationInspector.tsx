import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import {
  componentDescriptors,
  getComponentDescriptor,
} from "../../catalog/componentDescriptors";
import type {
  InspectorPropertyDescriptor,
  InspectorPropertyGroup,
} from "../../catalog/componentTypes";
import type { NormalizedData } from "../../data/normalizeData";
import { aggregationFieldRequirement } from "../../fields/aggregationFieldPolicy";
import { createFieldAliasRegistry } from "../../fields/fieldAliasRegistry";
import { prepareSpecification } from "../../schema/prepareSpecification";
import type { PreparedAuthoringData } from "../prepareAuthoringData";
import {
  appendToContainer,
  compatibleContainerPaths,
  componentTree,
  createComponent,
  deleteComponent,
  duplicateComponent,
  findComponent,
  incomingComponentReferences,
  insertComponent,
  locateComponent,
  moveComponent,
  moveComponentTo,
  SpecificationHistory,
  updateComponent,
} from "./specificationEditor";
import { StudioButton } from "../ui/StudioButton";
import { StudioCheckbox } from "../ui/StudioCheckbox";
import { StudioField } from "../ui/StudioField";
import { StudioSection } from "../ui/StudioSection";
import { StudioStatusChip } from "../ui/StudioStatusChip";

type Json = Record<string, unknown>;
type Pane = "tree" | "properties";
const propertyGroups: InspectorPropertyGroup[] = [
  "Identity",
  "Data",
  "Layout",
  "Appearance",
  "Interaction",
  "Content",
  "Accessibility",
  "Advanced",
];
const object = (value: unknown): value is Json =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function groupFor(control: InspectorPropertyDescriptor): InspectorPropertyGroup {
  if (control.group) return control.group;
  const property = control.property.toLowerCase();
  if (property === "dataset") return "Identity";
  if (
    control.control === "field" ||
    /field|measure|metric|column|row|series|indicator|aggregation|sort|filter/.test(
      property,
    )
  )
    return "Data";
  if (
    /span|width|height|gap|padding|margin|position|direction|layout|columns|rows|maxrows|page/.test(
      property,
    )
  )
    return "Layout";
  if (
    /style|css|class|color|theme|variant|intent|icon|density|format|heatmap|striped|opacity/.test(
      property,
    )
  )
    return "Appearance";
  if (/interaction|action|target|select|trigger|disabled/.test(property))
    return "Interaction";
  if (
    /text|html|markdown|title|subtitle|content|template|slot|description|label|items|children|footer|tabs|repeat/.test(
      property,
    )
  )
    return "Content";
  if (/aria|accessib|tooltip|role/.test(property)) return "Accessibility";
  return "Advanced";
}

function isControlVisible(
  control: InspectorPropertyDescriptor,
  item: Json | undefined,
): boolean {
  if (!control.visibleWhen) return true;
  const value = item?.[control.visibleWhen.property];
  if ("equals" in control.visibleWhen && value !== control.visibleWhen.equals) return false;
  if ("notEquals" in control.visibleWhen && value === control.visibleWhen.notEquals) return false;
  if (control.visibleWhen.oneOf && !control.visibleWhen.oneOf.includes(value)) return false;
  if (control.visibleWhen.truthy !== undefined && Boolean(value) !== control.visibleWhen.truthy) return false;
  return true;
}

function DraftInspectorControl({
  control,
  value,
  onCommit,
}: {
  control: InspectorPropertyDescriptor;
  value: unknown;
  onCommit: (value: unknown) => void;
}) {
  const committed =
    typeof value === "string" || typeof value === "number" ? String(value) : "";
  const [draft, setDraft] = useState(committed);
  useEffect(() => setDraft(committed), [committed, control.property]);
  const reset = () => setDraft(committed);
  const commit = () => {
    if (draft === committed) return;
    onCommit(
      control.control === "number"
        ? draft === ""
          ? undefined
          : Number(draft)
        : draft || undefined,
    );
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      reset();
    } else if (event.key === "Enter" && control.control !== "multiline") {
      event.preventDefault();
      commit();
      (event.currentTarget as HTMLInputElement).blur();
    }
  };
  return (
    <StudioField label={control.label} help={control.help}>
      {control.control === "multiline" ? (
        <>
          <textarea
            value={draft}
            readOnly={control.readOnly}
            onInput={(event) => setDraft(event.currentTarget.value)}
            onKeyDown={onKeyDown}
          />
          <StudioButton
            variant="compact"
            disabled={control.readOnly || draft === committed}
            onClick={commit}
          >
            Apply
          </StudioButton>
        </>
      ) : (
        <input
          type={control.control === "number" ? "number" : "text"}
          min={control.property === "span" ? 1 : undefined}
          max={control.property === "span" ? 12 : undefined}
          value={draft}
          readOnly={control.readOnly}
          placeholder={control.control === "color" ? "#2563eb or var(--hp-primary)" : undefined}
          onInput={(event) => setDraft(event.currentTarget.value)}
          onBlur={commit}
          onKeyDown={onKeyDown}
        />
      )}
    </StudioField>
  );
}

export function SpecificationInspector({
  json,
  data,
  onChange,
  selectedComponentId = "",
  onSelect = () => undefined,
  aliasOverrides = {},
  generatedRuntimeId,
  history: sharedHistory,
  onOpenMapStudio,
  prepared: sharedPrepared,
  validateCandidate,
}: {
  json: string;
  data: NormalizedData;
  onChange: (json: string) => void;
  selectedComponentId?: string;
  onSelect?: (id: string) => void;
  aliasOverrides?: Record<string, string>;
  generatedRuntimeId?: string;
  history?: SpecificationHistory;
  onOpenMapStudio?: () => void;
  prepared?: PreparedAuthoringData;
  validateCandidate?: (candidateSpecificationJson: string) => PreparedAuthoringData;
}) {
  const parsed = useMemo(() => {
    try {
      return JSON.parse(json) as Json;
    } catch {
      return undefined;
    }
  }, [json]);
  const [search, setSearch] = useState("");
  const [pane, setPane] = useState<Pane>("tree");
  const [treeWidth, setTreeWidth] = useState(280);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [fragment, setFragment] = useState("");
  const [fragmentProperty, setFragmentProperty] = useState("");
  const [fragmentError, setFragmentError] = useState("");
  const [candidateErrors, setCandidateErrors] = useState<string[]>([]);
  const [destination, setDestination] = useState("/components");
  const [newType, setNewType] = useState("text");
  const [openGroups, setOpenGroups] = useState<Set<InspectorPropertyGroup>>(
    () => new Set(["Identity", "Data"]),
  );
  const [revision, setRevision] = useState(0);
  const localHistory = useRef(new SpecificationHistory(json));
  const history = sharedHistory ?? localHistory.current;
  const internal = useRef(json);
  const selectedNode = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (json !== internal.current) {
      if (history.value !== json) history.reset(json);
      internal.current = json;
      setCandidateErrors([]);
      setRevision((value) => value + 1);
    }
  }, [json]);
  useEffect(() => {
    setFragmentProperty("");
    setFragment("");
    setFragmentError("");
  }, [selectedComponentId]);
  useEffect(() => {
    selectedNode.current?.scrollIntoView?.({ block: "nearest" });
  }, [selectedComponentId, search, collapsed]);

  const tree = useMemo(() => componentTree(parsed), [json]);
  const item = findComponent(parsed, selectedComponentId);
  const location = locateComponent(parsed, selectedComponentId);
  const selectedTree = tree.find((entry) => entry.id === selectedComponentId);
  const descriptor = item
    ? getComponentDescriptor(String(item.type))
    : undefined;
  const prepared = useMemo(
    () =>
      sharedPrepared?.preparedSpecification ??
      (parsed
        ? prepareSpecification(parsed, data, { repair: false, aliasOverrides })
        : undefined),
    [json, data, aliasOverrides, sharedPrepared],
  );
  const effectiveData = sharedPrepared?.configuredData ?? data;
  const aliases = createFieldAliasRegistry(
    effectiveData,
    aliasOverrides,
  ).entries;
  const aliasByKey = new Map(aliases.map((field) => [field.key, field]));
  const datasetName = selectedTree?.datasetName ?? "powerbi";
  const scopeFields =
    sharedPrepared?.datasets?.get(datasetName)?.data.fields ??
    prepared?.datasets?.datasets.get(datasetName)?.fields ??
    {};
  const datasets = [
    "powerbi",
    ...Object.keys(
      parsed?.data && object(parsed.data) && object(parsed.data.datasets)
        ? parsed.data.datasets
        : {},
    ),
  ];
  const containers = compatibleContainerPaths(parsed);
  useEffect(() => {
    if (!containers.includes(destination)) setDestination(containers[0] ?? "");
  }, [json, selectedComponentId]);
  useEffect(() => {
    const relevant = descriptor?.inspector.filter(
      (control) => control.control !== "json" && isControlVisible(control, item),
    ) ?? [];
    const firstContentGroup = (["Content", "Layout"] as InspectorPropertyGroup[]).find(
      (group) => relevant.some((control) => groupFor(control) === group),
    );
    setOpenGroups(new Set(["Identity", "Data", ...(firstContentGroup ? [firstContentGroup] : [])]));
  }, [selectedComponentId, descriptor?.type]);

  if (!parsed)
    return (
      <div class="hp-spec-inspector hp-inspector-paused" role="status">
        Inspector is paused until the JSON is valid.
      </div>
    );

  const commit = (value: unknown) => {
    const next = JSON.stringify(value, null, 2);
    const validation = validateCandidate?.(next);
    const standaloneValidation = validation
      ? undefined
      : prepareSpecification(value, data, {
          repair: false,
          aliasOverrides,
        });
    if (!(validation?.specification ?? standaloneValidation?.schema)) {
      setCandidateErrors(validation?.errors ?? standaloneValidation?.errors ?? []);
      return false;
    }
    setCandidateErrors([]);
    internal.current = next;
    history.commit(next);
    setRevision((value) => value + 1);
    onChange(next);
    return true;
  };
  const change = (property: string, value: unknown) =>
    commit(updateComponent(parsed, selectedComponentId, { [property]: value }));
  const restore = (next: string) => {
    internal.current = next;
    if (
      selectedComponentId &&
      !componentTree(JSON.parse(next)).some(
        (entry) => entry.id === selectedComponentId,
      )
    )
      onSelect("");
    setCandidateErrors([]);
    setRevision((value) => value + 1);
    onChange(next);
  };
  void revision;

  const lowerSearch = search.trim().toLowerCase();
  const visibleTree = tree.filter((entry) => {
    if (lowerSearch)
      return `${entry.id} ${entry.type} ${entry.title ?? ""} ${entry.path}`
        .toLowerCase()
        .includes(lowerSearch);
    return !tree.some(
      (ancestor) =>
        ancestor.depth < entry.depth &&
        collapsed.has(ancestor.id) &&
        entry.path.startsWith(`${ancestor.path}/`),
    );
  });
  const complex =
    descriptor?.inspector.filter(
      (control) => control.control === "json" && isControlVisible(control, item),
    ) ?? [];
  const simple =
    descriptor?.inspector
      .filter((control) => control.control !== "json" && isControlVisible(control, item))
      .sort((left, right) => (left.order ?? 1000) - (right.order ?? 1000)) ?? [];
  const controlsByGroup = new Map(
    propertyGroups.map((group) => [
      group,
      simple.filter((control) => groupFor(control) === group),
    ]),
  );
  const canInsert = Boolean(location && Array.isArray(location.parent));
  const position = canInsert ? (location!.index as number) : -1;
  const siblingCount = canInsert ? (location!.parent as unknown[]).length : 0;

  const fieldOptionsFor = (control: InspectorPropertyDescriptor) => {
    const descriptorField = descriptor?.fields.find(
      (field) => field.property === control.property,
    );
    let requirement = descriptorField?.requirement ?? "any";
    if (
      ["field", "measure", "valueField"].includes(control.property) &&
      typeof item?.aggregation === "string"
    )
      requirement = aggregationFieldRequirement(
        item.aggregation,
        "first",
      ).requirement;
    return Object.values(scopeFields)
      .filter(
        (field) =>
          requirement !== "numeric" ||
          field.dataType === "number" ||
          field.dataType === "unknown",
      )
      .map((field) => ({
        value:
          selectedTree?.datasetName === "powerbi"
            ? (aliasByKey.get(field.key)?.alias ?? field.key)
            : field.key,
        label: `${field.displayName} · ${field.dataType ?? "unknown"}`,
      }));
  };

  const renderControl = (control: InspectorPropertyDescriptor) => {
    const value = item?.[control.property];
    if (control.control === "checkbox")
      return (
        <StudioCheckbox
          label={control.label}
          help={control.help}
          checked={value === true}
          disabled={control.readOnly}
          onChange={(checked) => change(control.property, checked)}
        />
      );
    if (["number", "text", "color", "multiline"].includes(control.control))
      return (
        <DraftInspectorControl
          control={control}
          value={value}
          onCommit={(next) => change(control.property, next)}
        />
      );
    if (control.control === "field")
      return (
        <label>
          <span>{control.label}</span>
          <select
            value={typeof value === "string" ? value : ""}
            disabled={control.readOnly}
            onChange={(event) =>
              change(control.property, event.currentTarget.value || undefined)
            }
          >
            <option value="">Not set</option>
            {fieldOptionsFor(control).map((field) => (
              <option value={field.value}>
                {field.value} — {field.label}
              </option>
            ))}
          </select>
        </label>
      );
    if (control.control === "dataset")
      return (
        <label>
          <span>{control.label}</span>
          <select
            value={typeof value === "string" ? value : "powerbi"}
            disabled={control.readOnly}
            onChange={(event) =>
              change(
                control.property,
                event.currentTarget.value === "powerbi"
                  ? undefined
                  : event.currentTarget.value,
              )
            }
          >
            {datasets.map((name) => (
              <option value={name}>{name}</option>
            ))}
          </select>
        </label>
      );
    if (control.control === "component")
      return (
        <label>
          <span>{control.label}</span>
          <select
            value={typeof value === "string" ? value : ""}
            disabled={control.readOnly}
            onChange={(event) =>
              change(control.property, event.currentTarget.value || undefined)
            }
          >
            <option value="">Not set</option>
            {tree
              .filter((entry) => entry.id !== selectedComponentId)
              .map((entry) => (
                <option value={entry.id}>
                  {entry.id} ({entry.type})
                </option>
              ))}
          </select>
        </label>
      );
    if (control.control === "enum")
      return (
        <label>
          <span>{control.label}</span>
          <select
            value={typeof value === "string" ? value : ""}
            disabled={control.readOnly}
            onChange={(event) =>
              change(control.property, event.currentTarget.value || undefined)
            }
          >
            <option value="">Not set</option>
            {control.options?.map((option) => (
              <option value={option}>{option}</option>
            ))}
          </select>
        </label>
      );
    return null;
  };

  const add = (mode: "before" | "after" | "container") => {
    const child = createComponent(newType, parsed);
    const candidate =
      mode === "container"
        ? appendToContainer(parsed, destination, child)
        : insertComponent(parsed, selectedComponentId, mode, child);
    if (commit(candidate)) onSelect(String(child.id));
  };
  const keyboardSelect = (event: KeyboardEvent, index: number) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next =
        visibleTree[
          Math.max(
            0,
            Math.min(
              visibleTree.length - 1,
              index + (event.key === "ArrowDown" ? 1 : -1),
            ),
          )
        ];
      if (next) onSelect(next.id);
    } else if (event.key === "ArrowRight")
      setCollapsed((current) => {
        const next = new Set(current);
        next.delete(visibleTree[index].id);
        return next;
      });
    else if (event.key === "ArrowLeft")
      setCollapsed((current) => new Set(current).add(visibleTree[index].id));
  };

  return (
    <div
      class="hp-studio hp-spec-inspector"
      data-active-pane={pane}
      style={{ "--hp-inspector-tree-width": `${treeWidth}px` }}
    >
      <header class="hp-inspector-toolbar">
        <div class="hp-inspector-history">
          <StudioButton
            variant="compact"
            disabled={!history.canUndo}
            onClick={() => restore(history.undo())}
          >
            Undo
          </StudioButton>
          <StudioButton
            variant="compact"
            disabled={!history.canRedo}
            onClick={() => restore(history.redo())}
          >
            Redo
          </StudioButton>
        </div>
        <div class="hp-inspector-selection-summary">
          <strong
            title={`${String(item?.type ?? "No selection")} ${selectedComponentId}`}
          >
            {item
              ? `${String(item.type)} · ${selectedComponentId}`
              : "Select a component"}
          </strong>
          <StudioStatusChip tone={prepared?.schema ? "valid" : "invalid"} announce>
            {prepared?.schema ? "Valid" : "Invalid"}
          </StudioStatusChip>
        </div>
        <label class="hp-inspector-width-control">
          Hierarchy width{" "}
          <input
            aria-label="Hierarchy pane width"
            type="range"
            min="220"
            max="520"
            value={treeWidth}
            onInput={(event) => setTreeWidth(Number(event.currentTarget.value))}
          />
        </label>
      </header>
      <div
        class="hp-inspector-pane-switch"
        role="tablist"
        aria-label="Inspector pane"
      >
        <button
          role="tab"
          aria-selected={pane === "tree"}
          onClick={() => setPane("tree")}
        >
          Tree
        </button>
        <button
          role="tab"
          aria-selected={pane === "properties"}
          onClick={() => setPane("properties")}
          disabled={!item}
        >
          Properties
        </button>
      </div>
      {candidateErrors.length > 0 && (
        <div class="hp-inspector-errors" role="alert">
          <strong>
            Edit not applied; the last valid preview is unchanged.
          </strong>
          <ul>
            {candidateErrors.map((error) => (
              <li>{error}</li>
            ))}
          </ul>
        </div>
      )}
      <div class="hp-inspector-body">
        <nav
          class={`hp-inspector-tree ${pane === "properties" ? "is-mobile-hidden" : ""}`}
          aria-label="Dashboard component hierarchy"
        >
          <label class="hp-inspector-search">
            <span class="hp-visually-hidden">Search hierarchy</span>
            <input
              placeholder="Search ID, title, type, or path"
              value={search}
              onInput={(event) => setSearch(event.currentTarget.value)}
            />
          </label>
          <div role="tree">
            {visibleTree.map((entry, index) => {
              const next = tree[tree.indexOf(entry) + 1];
              const hasChildren = Boolean(next && next.depth > entry.depth);
              const maturity = getComponentDescriptor(entry.type)?.maturity;
              return (
                <div
                  class="hp-inspector-tree-row"
                  style={{ paddingLeft: `${8 + entry.depth * 14}px` }}
                >
                  {hasChildren ? (
                    <button
                      class="hp-tree-toggle"
                      aria-label={`${collapsed.has(entry.id) ? "Expand" : "Collapse"} ${entry.id}`}
                      aria-expanded={!collapsed.has(entry.id)}
                      onClick={() =>
                        setCollapsed((current) => {
                          const nextSet = new Set(current);
                          if (nextSet.has(entry.id)) nextSet.delete(entry.id);
                          else nextSet.add(entry.id);
                          return nextSet;
                        })
                      }
                    >
                      {collapsed.has(entry.id) ? "▸" : "▾"}
                    </button>
                  ) : (
                    <span class="hp-tree-spacer" />
                  )}
                  <button
                    ref={
                      selectedComponentId === entry.id
                        ? selectedNode
                        : undefined
                    }
                    data-tree-id={entry.id}
                    role="treeitem"
                    aria-selected={selectedComponentId === entry.id}
                    class={
                      selectedComponentId === entry.id ? "is-selected" : ""
                    }
                    onClick={() => {
                      onSelect(entry.id);
                      setPane("properties");
                    }}
                    onKeyDown={(event) => keyboardSelect(event, index)}
                    title={entry.path}
                  >
                    <span>
                      <code>{entry.id}</code>
                      {maturity && (
                        <em class={`hp-maturity hp-maturity-${maturity}`}>
                          {maturity}
                        </em>
                      )}
                    </span>
                    <small>
                      {entry.type}
                      {entry.title ? ` · ${entry.title}` : ""}
                    </small>
                  </button>
                </div>
              );
            })}
          </div>
        </nav>
        <section
          class={`hp-inspector-properties ${pane === "tree" ? "is-mobile-hidden" : ""}`}
          aria-label="Selected component properties"
        >
          {item ? (
            <>
              <header class="hp-inspector-component-summary">
                <div>
                  <strong>{String(item.type)}</strong>
                  <code title={selectedTree?.path}>{selectedTree?.path}</code>
                </div>
                <dl>
                  <div>
                    <dt>ID</dt>
                    <dd title={selectedComponentId}>{selectedComponentId}</dd>
                  </div>
                  <div>
                    <dt>Maturity</dt>
                    <dd>{descriptor?.maturity ?? "unknown"}</dd>
                  </div>
                  <div>
                    <dt>Dataset</dt>
                    <dd>{selectedTree?.datasetName ?? "powerbi"}</dd>
                  </div>
                </dl>
              </header>
              {item.type === "map" && onOpenMapStudio && (
                <button class="hp-open-map-studio" onClick={onOpenMapStudio}>
                  Open in Map Studio
                </button>
              )}
              <div class="hp-inspector-property-groups">
                {propertyGroups.map((group) => {
                  const controls = controlsByGroup.get(group) ?? [];
                  if (!controls.length) return null;
                  return (
                    <StudioSection
                      title={group}
                      open={openGroups.has(group)}
                      onToggle={(open) => setOpenGroups((current) => {
                        const next = new Set(current);
                        if (open) next.add(group); else next.delete(group);
                        return next;
                      })}
                    >
                      <div class="hp-inspector-control-grid">
                        {controls.map(renderControl)}
                      </div>
                    </StudioSection>
                  );
                })}
              </div>
              {complex.length > 0 && (
                <StudioSection title="Structured JSON" className="hp-inspector-fragment">
                  <label>
                    <span>Complex property</span>
                    <select
                      value={fragmentProperty}
                      onChange={(event) => {
                        const property = event.currentTarget.value;
                        setFragmentProperty(property);
                        setFragment(
                          property
                            ? JSON.stringify(item[property], null, 2)
                            : "",
                        );
                        setFragmentError("");
                      }}
                    >
                      <option value="">Choose property</option>
                      {complex.map((control) => (
                        <option value={control.property}>
                          {control.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {fragmentProperty && (
                    <>
                      <textarea
                        aria-label={`${fragmentProperty} JSON draft`}
                        value={fragment}
                        onInput={(event) =>
                          setFragment(event.currentTarget.value)
                        }
                      />
                      {fragmentError && <p role="alert">{fragmentError}</p>}
                      <StudioButton
                        variant="secondary"
                        onClick={() => {
                          try {
                            const value = JSON.parse(fragment);
                            if (change(fragmentProperty, value))
                              setFragmentError("");
                          } catch (error) {
                            setFragmentError(
                              error instanceof Error
                                ? error.message
                                : String(error),
                            );
                          }
                        }}
                      >
                        Apply validated fragment
                      </StudioButton>
                    </>
                  )}
                </StudioSection>
              )}
              <StudioSection title="Add, insert, or move" className="hp-inspector-mutations">
                <div class="hp-inspector-control-grid">
                  <label>
                    <span>Component type</span>
                    <select
                      value={newType}
                      onChange={(event) =>
                        setNewType(event.currentTarget.value)
                      }
                    >
                      {componentDescriptors
                        .filter(
                          (entry) =>
                            entry.maturity !== "deprecated" &&
                            entry.maturity !== "legacy",
                        )
                        .map((entry) => (
                          <option value={entry.type}>
                            {entry.label} · {entry.maturity}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    <span>Compatible destination</span>
                    <select
                      value={destination}
                      onChange={(event) =>
                        setDestination(event.currentTarget.value)
                      }
                    >
                      {containers.map((path) => (
                        <option value={path}>{path}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div class="hp-button-row">
                  <button
                    disabled={!destination}
                    title={
                      !destination
                        ? "No descriptor-declared component container is available."
                        : undefined
                    }
                    onClick={() => add("container")}
                  >
                    Add child
                  </button>
                  <button
                    disabled={!canInsert}
                    title={
                      !canInsert
                        ? "The selected node is not in an ordered component array."
                        : undefined
                    }
                    onClick={() => add("before")}
                  >
                    Insert before
                  </button>
                  <button
                    disabled={!canInsert}
                    title={
                      !canInsert
                        ? "The selected node is not in an ordered component array."
                        : undefined
                    }
                    onClick={() => add("after")}
                  >
                    Insert after
                  </button>
                  <button
                    disabled={!canInsert || !destination}
                    onClick={() =>
                      commit(
                        moveComponentTo(
                          parsed,
                          selectedComponentId,
                          destination,
                        ),
                      )
                    }
                  >
                    Move to compatible container
                  </button>
                </div>
              </StudioSection>
              <div class="hp-inspector-node-actions">
                <StudioButton
                  variant="secondary"
                  disabled={!canInsert || position <= 0}
                  onClick={() =>
                    commit(moveComponent(parsed, selectedComponentId, -1))
                  }
                >
                  Move up
                </StudioButton>
                <StudioButton
                  variant="secondary"
                  disabled={!canInsert || position >= siblingCount - 1}
                  onClick={() =>
                    commit(moveComponent(parsed, selectedComponentId, 1))
                  }
                >
                  Move down
                </StudioButton>
                <StudioButton
                  variant="secondary"
                  disabled={!canInsert}
                  onClick={() =>
                    commit(duplicateComponent(parsed, selectedComponentId))
                  }
                >
                  Duplicate
                </StudioButton>
                <StudioButton
                  variant="danger"
                  onClick={() => {
                    const references = incomingComponentReferences(
                      parsed,
                      selectedComponentId,
                    );
                    if (
                      references.length &&
                      !globalThis.confirm(
                        `Delete ${selectedComponentId}? Referenced by ${references.join(", ")}`,
                      )
                    )
                      return;
                    if (commit(deleteComponent(parsed, selectedComponentId)))
                      onSelect("");
                  }}
                >
                  Delete
                </StudioButton>
              </div>
            </>
          ) : (
            <div class="hp-inspector-empty">
              <strong>Select a component</strong>
              <p>
                Choose an authoring node in the hierarchy or use Inspect
                preview. Tree paths are canonical JSON pointers.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
