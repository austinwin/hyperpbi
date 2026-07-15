export interface MapStudioDraftDiagnostic {
  severity: "info" | "warning" | "error";
  message: string;
}

export interface MapStudioDraftState {
  activeMapId: string;
  activeLayerId: string;
  activeSection: string;
  layerDrafts: Record<string, unknown>;
  dirtyPaths: Set<string>;
  validationByPath: Record<string, MapStudioDraftDiagnostic[]>;
}

export type MapStudioDraftAction =
  | { type: "activateMap"; mapId: string }
  | { type: "activateLayer"; layerId: string }
  | { type: "activateSection"; section: string }
  | { type: "updateLayerDraft"; layerId: string; value: unknown; dirtyPath: string }
  | { type: "setPathValidation"; path: string; diagnostics: MapStudioDraftDiagnostic[] }
  | { type: "commitPaths"; paths?: string[] };

export function createMapStudioDraftState(mapId = ""): MapStudioDraftState {
  return {
    activeMapId: mapId,
    activeLayerId: "",
    activeSection: "source",
    layerDrafts: {},
    dirtyPaths: new Set(),
    validationByPath: {},
  };
}

export function mapStudioDraftReducer(
  state: MapStudioDraftState,
  action: MapStudioDraftAction,
): MapStudioDraftState {
  if (action.type === "activateMap") {
    if (state.activeMapId === action.mapId) return state;
    return { ...state, activeMapId: action.mapId, activeLayerId: "" };
  }
  if (action.type === "activateLayer")
    return state.activeLayerId === action.layerId
      ? state
      : { ...state, activeLayerId: action.layerId };
  if (action.type === "activateSection")
    return state.activeSection === action.section
      ? state
      : { ...state, activeSection: action.section };
  if (action.type === "updateLayerDraft") {
    const dirtyPaths = new Set(state.dirtyPaths);
    dirtyPaths.add(action.dirtyPath);
    return {
      ...state,
      layerDrafts: { ...state.layerDrafts, [action.layerId]: action.value },
      dirtyPaths,
    };
  }
  if (action.type === "setPathValidation")
    return {
      ...state,
      validationByPath: {
        ...state.validationByPath,
        [action.path]: action.diagnostics,
      },
    };
  const dirtyPaths = new Set(state.dirtyPaths);
  if (action.paths) action.paths.forEach((path) => dirtyPaths.delete(path));
  else dirtyPaths.clear();
  return { ...state, dirtyPaths };
}

