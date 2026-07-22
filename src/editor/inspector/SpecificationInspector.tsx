import type { ComponentChildren } from "preact";
import { useEffect, useId, useMemo, useRef, useState } from "preact/hooks";
import {
  componentDescriptors,
  getComponentDescriptor,
} from "../../catalog/componentDescriptors";
import type {
  InspectorPropertyDescriptor,
  InspectorPropertyGroup,
} from "../../catalog/componentTypes";
import { Icon } from "../../components/icons/Icon";
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
  error,
}: {
  control: InspectorPropertyDescriptor;
  value: unknown;
  onCommit: (value: unknown) => boolean | void;
  error?: string;
}) {
  const controlId = useId();
  const messageId = `${controlId}-message`;
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
    <div class={`hp-studio-field ${error ? "is-invalid" : ""}`}>
      <label class="hp-studio-field-label" for={controlId}>
        {control.label}
      </label>
      {control.control === "multiline" ? (
        <>
          <textarea
            id={controlId}
            value={draft}
            readOnly={control.readOnly}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error || control.help ? messageId : undefined}
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
          id={controlId}
          type={control.control === "number" ? "number" : "text"}
          min={control.property === "span" ? 1 : undefined}
          max={control.property === "span" ? 12 : undefined}
          value={draft}
          readOnly={control.readOnly}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error || control.help ? messageId : undefined}
          placeholder={control.control === "color" ? "#2563eb or var(--hp-primary)" : undefined}
          onInput={(event) => setDraft(event.currentTarget.value)}
          onBlur={commit}
          onKeyDown={onKeyDown}
        />
      )}
      {error ? (
        <small id={messageId} class="hp-studio-field-error" role="alert">
          {error}
        </small>
      ) : control.help ? (
        <small id={messageId} class="hp-studio-field-help">
          {control.help}
        </small>
      ) : null}
    </div>
  );
}

function InspectorSelectControl({
  control,
  value,
  onChange,
  error,
  children,
}: {
  control: InspectorPropertyDescriptor;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  children: ComponentChildren;
}) {
  const controlId = useId();
  const messageId = `${controlId}-message`;
  return (
    <div class={`hp-studio-field ${error ? "is-invalid" : ""}`}>
      <label class="hp-studio-field-label" for={controlId}>
        {control.label}
      </label>
      <select
        id={controlId}
        value={value}
        disabled={control.readOnly}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error || control.help ? messageId : undefined}
        onChange={(event) => onChange(event.currentTarget.value)}
      >
        {children}
      </select>
      {error ? (
        <small id={messageId} class="hp-studio-field-error" role="alert">
          {error}
        </small>
      ) : control.help ? (
        <small id={messageId} class="hp-studio-field-help">
          {control.help}
        </small>
      ) : null}
    </div>
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
  const parsedResult = useMemo(() => {
    try {
      const value = JSON.parse(json) as unknown;
      if (!object(value))
        return {
          error: "The specification must be a JSON object.",
        };
      return { value };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, [json]);
  const parsed = parsedResult.value;
  const [search, setSearch] = useState("");
  const [pane, setPane] = useState<Pane>("tree");
  const [treeWidth, setTreeWidth] = useState(280);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [fragment, setFragment] = useState("");
  const [fragmentProperty, setFragmentProperty] = useState("");
  const [fragmentError, setFragmentError] = useState("");
  const [candidateErrors, setCandidateErrors] = useState<string[]>([]);
  const [rejectedProperty, setRejectedProperty] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState("");
  const [destination, setDestination] = useState("/components");
  const [newType, setNewType] = useState("text");
  const [openGroups, setOpenGroups] = useState<Set<InspectorPropertyGroup>>(
    () => new Set(["Identity", "Data"]),
  );
  const [revision, setRevision] = useState(0);
  const localHistory = useRef(new SpecificationHistory(json));
  const history = sharedHistory ?? localHistory.current;
  const internal = useRef(json);
  const treeItems = useRef(new Map<string, HTMLButtonElement>());
  const treeTab = useRef<HTMLButtonElement>(null);
  const propertiesTab = useRef<HTMLButtonElement>(null);
  const inspectorId = useId();
  const treeTabId = `${inspectorId}-tree-tab`;
  const propertiesTabId = `${inspectorId}-properties-tab`;
  const treePanelId = `${inspectorId}-tree-panel`;
  const propertiesPanelId = `${inspectorId}-properties-panel`;

  useEffect(() => {
    if (json !== internal.current) {
      if (history.value !== json) history.reset(json);
      internal.current = json;
      setCandidateErrors([]);
      setRejectedProperty("");
      setRevision((value) => value + 1);
    }
  }, [json]);
  useEffect(() => {
    setFragmentProperty("");
    setFragment("");
    setFragmentError("");
    setRejectedProperty("");
    setPendingDeleteId("");
  }, [selectedComponentId]);
  useEffect(() => {
    if (generatedRuntimeId && selectedComponentId) setPane("properties");
  }, [generatedRuntimeId, selectedComponentId]);
  useEffect(() => {
    treeItems.current
      .get(selectedComponentId)
      ?.scrollIntoView?.({ block: "nearest" });
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
      <div
        class="hp-spec-inspector hp-inspector-paused"
        role="status"
        aria-live="polite"
      >
        <div class="hp-inspector-state-card">
          <span class="hp-inspector-state-icon" aria-hidden="true">!</span>
          <div>
            <strong>Inspector unavailable</strong>
            <p>
              Fix the specification in the JSON workspace, then return here.
              Your last valid preview is unchanged.
            </p>
            {parsedResult.error && <code>{parsedResult.error}</code>}
          </div>
        </div>
      </div>
    );

  const commit = (value: unknown, property = "") => {
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
      setRejectedProperty(property);
      return false;
    }
    setCandidateErrors([]);
    setRejectedProperty("");
    internal.current = next;
    history.commit(next);
    setRevision((value) => value + 1);
    onChange(next);
    return true;
  };
  const change = (property: string, value: unknown) =>
    commit(
      updateComponent(parsed, selectedComponentId, { [property]: value }),
      property,
    );
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
    setRejectedProperty("");
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
    const controlError =
      rejectedProperty === control.property ? candidateErrors[0] : undefined;
    if (control.control === "checkbox")
      return (
        <div
          key={control.property}
          class={`hp-inspector-control-block ${controlError ? "is-invalid" : ""}`}
        >
          <StudioCheckbox
            label={control.label}
            help={control.help}
            checked={value === true}
            disabled={control.readOnly}
            onChange={(checked) => change(control.property, checked)}
          />
          {controlError && (
            <small class="hp-studio-field-error" role="alert">
              {controlError}
            </small>
          )}
        </div>
      );
    if (["number", "text", "color", "multiline"].includes(control.control))
      return (
        <DraftInspectorControl
          key={control.property}
          control={control}
          value={value}
          error={controlError}
          onCommit={(next) => change(control.property, next)}
        />
      );
    if (control.control === "field")
      return (
        <InspectorSelectControl
          key={control.property}
          control={control}
          value={typeof value === "string" ? value : ""}
          error={controlError}
          onChange={(next) => change(control.property, next || undefined)}
        >
          <option value="">Not set</option>
          {fieldOptionsFor(control).map((field) => (
            <option key={field.value} value={field.value}>
              {field.value} — {field.label}
            </option>
          ))}
        </InspectorSelectControl>
      );
    if (control.control === "dataset")
      return (
        <InspectorSelectControl
          key={control.property}
          control={control}
          value={typeof value === "string" ? value : "powerbi"}
          error={controlError}
          onChange={(next) =>
            change(
              control.property,
              next === "powerbi" ? undefined : next,
            )
          }
        >
          {datasets.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </InspectorSelectControl>
      );
    if (control.control === "component")
      return (
        <InspectorSelectControl
          key={control.property}
          control={control}
          value={typeof value === "string" ? value : ""}
          error={controlError}
          onChange={(next) => change(control.property, next || undefined)}
        >
          <option value="">Not set</option>
          {tree
            .filter((entry) => entry.id !== selectedComponentId)
            .map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.id} ({entry.type})
              </option>
            ))}
        </InspectorSelectControl>
      );
    if (control.control === "enum")
      return (
        <InspectorSelectControl
          key={control.property}
          control={control}
          value={typeof value === "string" ? value : ""}
          error={controlError}
          onChange={(next) => change(control.property, next || undefined)}
        >
          <option value="">Not set</option>
          {control.options?.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </InspectorSelectControl>
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
  const activeTreeId = visibleTree.some(
    (entry) => entry.id === selectedComponentId,
  )
    ? selectedComponentId
    : (visibleTree[0]?.id ?? "");
  const hasTreeChildren = (entry: (typeof tree)[number]) => {
    const index = tree.indexOf(entry);
    return Boolean(tree[index + 1] && tree[index + 1].depth > entry.depth);
  };
  const focusTreeItem = (id: string) => {
    treeItems.current.get(id)?.focus();
    onSelect(id);
    requestAnimationFrame(() => treeItems.current.get(id)?.focus());
  };
  const toggleTreeItem = (id: string, collapse?: boolean) =>
    setCollapsed((current) => {
      const next = new Set(current);
      const shouldCollapse = collapse ?? !next.has(id);
      if (shouldCollapse) next.add(id);
      else next.delete(id);
      return next;
    });
  const keyboardSelect = (event: KeyboardEvent, index: number) => {
    const entry = visibleTree[index];
    if (!entry) return;
    if (
      event.key === "ArrowDown" ||
      event.key === "ArrowUp" ||
      event.key === "Home" ||
      event.key === "End"
    ) {
      event.preventDefault();
      const nextIndex =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? visibleTree.length - 1
            : Math.max(
                0,
                Math.min(
                  visibleTree.length - 1,
                  index + (event.key === "ArrowDown" ? 1 : -1),
                ),
              );
      const next = visibleTree[nextIndex];
      if (next) focusTreeItem(next.id);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      if (!hasTreeChildren(entry)) return;
      if (collapsed.has(entry.id)) {
        toggleTreeItem(entry.id, false);
        return;
      }
      const child = visibleTree
        .slice(index + 1)
        .find(
          (candidate) =>
            candidate.depth === entry.depth + 1 &&
            candidate.path.startsWith(`${entry.path}/`),
        );
      if (child) focusTreeItem(child.id);
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (hasTreeChildren(entry) && !collapsed.has(entry.id)) {
        toggleTreeItem(entry.id, true);
        return;
      }
      const parent = [...visibleTree]
        .slice(0, index)
        .reverse()
        .find(
          (candidate) =>
            candidate.depth === entry.depth - 1 &&
            entry.path.startsWith(`${candidate.path}/`),
        );
      if (parent) focusTreeItem(parent.id);
    }
  };
  const switchPaneFromKeyboard = (event: KeyboardEvent) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
      return;
    event.preventDefault();
    const nextPane: Pane =
      event.key === "ArrowLeft" || event.key === "Home"
        ? "tree"
        : item
          ? "properties"
          : "tree";
    setPane(nextPane);
    requestAnimationFrame(() =>
      (nextPane === "tree" ? treeTab.current : propertiesTab.current)?.focus(),
    );
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
        onKeyDown={switchPaneFromKeyboard}
      >
        <button
          ref={treeTab}
          id={treeTabId}
          role="tab"
          aria-selected={pane === "tree"}
          aria-controls={treePanelId}
          tabIndex={pane === "tree" ? 0 : -1}
          onClick={() => setPane("tree")}
        >
          Tree
        </button>
        <button
          ref={propertiesTab}
          id={propertiesTabId}
          role="tab"
          aria-selected={pane === "properties"}
          aria-controls={propertiesPanelId}
          tabIndex={pane === "properties" ? 0 : -1}
          onClick={() => setPane("properties")}
          disabled={!item}
        >
          Properties
        </button>
      </div>
      {candidateErrors.length > 0 && (
        <section class="hp-inspector-errors" role="alert" aria-live="assertive">
          <div class="hp-inspector-error-summary">
            <span aria-hidden="true">!</span>
            <div>
              <strong>Change wasn’t applied</strong>
              <p>The last valid specification and preview are unchanged.</p>
            </div>
          </div>
          <details open={candidateErrors.length <= 3}>
            <summary>
              Review {candidateErrors.length} validation {candidateErrors.length === 1 ? "issue" : "issues"}
            </summary>
            <ul>
              {candidateErrors.map((error, index) => (
                <li key={`${index}-${error}`}>{error}</li>
              ))}
            </ul>
          </details>
        </section>
      )}
      <div class="hp-inspector-body">
        <nav
          id={treePanelId}
          role="tabpanel"
          aria-labelledby={treeTabId}
          class={`hp-inspector-tree ${pane === "properties" ? "is-mobile-hidden" : ""}`}
        >
          <div class="hp-inspector-search">
            <label for={`${inspectorId}-tree-search`}>Search components</label>
            <div>
              <input
                id={`${inspectorId}-tree-search`}
                type="search"
                placeholder="ID, title, type, or path"
                value={search}
                onInput={(event) => setSearch(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape" && search) {
                    event.preventDefault();
                    setSearch("");
                  } else if (event.key === "ArrowDown" && activeTreeId) {
                    event.preventDefault();
                    focusTreeItem(activeTreeId);
                  }
                }}
              />
              {search && (
                <button
                  type="button"
                  aria-label="Clear component search"
                  onClick={() => setSearch("")}
                >
                  Clear
                </button>
              )}
            </div>
            <small role="status" aria-live="polite">
              {lowerSearch
                ? `${visibleTree.length} matching ${visibleTree.length === 1 ? "component" : "components"}`
                : `${tree.length} ${tree.length === 1 ? "component" : "components"}`}
            </small>
          </div>
          <div role="tree" aria-label="Dashboard components">
            {visibleTree.length > 0 ? (
              visibleTree.map((entry, index) => {
                const hasChildren = hasTreeChildren(entry);
                const maturity = getComponentDescriptor(entry.type)?.maturity;
                const isSelected = selectedComponentId === entry.id;
                return (
                  <div
                    key={entry.id}
                    role="none"
                    class="hp-inspector-tree-row"
                    style={{ paddingLeft: `${6 + entry.depth * 14}px` }}
                  >
                    <button
                      ref={(node) => {
                        if (node) treeItems.current.set(entry.id, node);
                        else treeItems.current.delete(entry.id);
                      }}
                      data-tree-id={entry.id}
                      role="treeitem"
                      aria-level={entry.depth + 1}
                      aria-expanded={
                        hasChildren ? !collapsed.has(entry.id) : undefined
                      }
                      aria-selected={isSelected}
                      tabIndex={activeTreeId === entry.id ? 0 : -1}
                      class={isSelected ? "is-selected" : ""}
                      onClick={() => {
                        onSelect(entry.id);
                        setPane("properties");
                      }}
                      onKeyDown={(event) => keyboardSelect(event, index)}
                      title={entry.path}
                    >
                      {hasChildren ? (
                        <span
                          class="hp-tree-toggle"
                          aria-hidden="true"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleTreeItem(entry.id);
                          }}
                        >
                          {collapsed.has(entry.id) ? "▸" : "▾"}
                        </span>
                      ) : (
                        <span class="hp-tree-spacer" aria-hidden="true" />
                      )}
                      <span class="hp-inspector-tree-copy">
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
                      </span>
                    </button>
                  </div>
                );
              })
            ) : (
              <div class="hp-inspector-search-empty" role="status">
                <strong>{lowerSearch ? "No matching components" : "No components yet"}</strong>
                <p>
                  {lowerSearch
                    ? "Try a shorter name, component type, or JSON path."
                    : "Add a component to the dashboard before editing properties."}
                </p>
                {lowerSearch && (
                  <StudioButton variant="secondary" onClick={() => setSearch("")}>
                    Clear search
                  </StudioButton>
                )}
              </div>
            )}
          </div>
        </nav>
        <section
          id={propertiesPanelId}
          role="tabpanel"
          aria-labelledby={propertiesTabId}
          class={`hp-inspector-properties ${pane === "tree" ? "is-mobile-hidden" : ""}`}
        >
          <StudioButton
            variant="ghost"
            class="hp-inspector-mobile-back"
            onClick={() => {
              setPane("tree");
              requestAnimationFrame(() =>
                treeItems.current.get(selectedComponentId)?.focus(),
              );
            }}
          >
            ← Back to hierarchy
          </StudioButton>
          {item ? (
            <>
              <header class="hp-inspector-component-summary">
                <div class="hp-inspector-component-heading">
                  <div class="hp-inspector-component-identity">
                    <strong>{String(item.type)}</strong>
                    <code title={selectedTree?.path}>{selectedTree?.path}</code>
                  </div>
                  <div
                    class="hp-inspector-component-actions"
                    role="group"
                    aria-label={`Actions for ${selectedComponentId}`}
                  >
                    <StudioButton
                      variant="icon"
                      disabled={!canInsert || position <= 0}
                      aria-label={`Move ${selectedComponentId} up`}
                      title="Move up"
                      onClick={() =>
                        commit(moveComponent(parsed, selectedComponentId, -1))
                      }
                    >
                      <Icon name="chevron-up" size="xs" decorative />
                    </StudioButton>
                    <StudioButton
                      variant="icon"
                      disabled={!canInsert || position >= siblingCount - 1}
                      aria-label={`Move ${selectedComponentId} down`}
                      title="Move down"
                      onClick={() =>
                        commit(moveComponent(parsed, selectedComponentId, 1))
                      }
                    >
                      <Icon name="chevron-down" size="xs" decorative />
                    </StudioButton>
                    <StudioButton
                      variant="icon"
                      disabled={!canInsert}
                      aria-label={`Duplicate ${selectedComponentId}`}
                      title="Duplicate"
                      onClick={() =>
                        commit(duplicateComponent(parsed, selectedComponentId))
                      }
                    >
                      <Icon name="copy" size="xs" decorative />
                    </StudioButton>
                    <StudioButton
                      variant="icon"
                      class="hp-inspector-delete-action"
                      aria-label={`Delete ${selectedComponentId}`}
                      title="Delete"
                      onClick={() => setPendingDeleteId(selectedComponentId)}
                    >
                      <Icon name="trash" size="xs" decorative />
                    </StudioButton>
                  </div>
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
              {pendingDeleteId === selectedComponentId && (
                <div class="hp-inspector-delete-confirm" role="alert">
                  <div>
                    <strong>Delete {selectedComponentId}?</strong>
                    <span>
                      {incomingComponentReferences(parsed, selectedComponentId)
                        .length
                        ? `Referenced by ${incomingComponentReferences(parsed, selectedComponentId).join(", ")}. Those references may also need attention.`
                        : "This removes the component from the dashboard."}
                    </span>
                  </div>
                  <div>
                    <StudioButton
                      variant="secondary"
                      onClick={() => setPendingDeleteId("")}
                    >
                      Cancel
                    </StudioButton>
                    <StudioButton
                      variant="danger"
                      onClick={() => {
                        if (
                          commit(deleteComponent(parsed, selectedComponentId))
                        ) {
                          setPendingDeleteId("");
                          onSelect("");
                        }
                      }}
                    >
                      Confirm delete
                    </StudioButton>
                  </div>
                </div>
              )}
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
                            entry.maturity !== "deprecated",
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
            </>
          ) : (
            <div class="hp-inspector-empty">
              <span class="hp-inspector-state-icon" aria-hidden="true">◇</span>
              <strong>{tree.length ? "Select a component" : "No components yet"}</strong>
              <p>
                {tree.length
                  ? "Choose a component in the hierarchy, or turn on Inspect preview and select it directly on the canvas."
                  : "Add a component in the JSON workspace or Guided Builder, then return here to configure it visually."}
              </p>
              {tree.length > 0 && (
                <StudioButton variant="secondary" onClick={() => setPane("tree")}>
                  Browse hierarchy
                </StudioButton>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
