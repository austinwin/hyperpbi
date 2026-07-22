import type { DataWorkspace } from "../data/dataWorkspace";
import type { Diagnostic } from "../schema/diagnostics";
import type { HyperPbiSchema } from "../schema/hyperpbiSchema";

export interface AuthoringContext {
    dataWorkspace: DataWorkspace;
    viewport?: { width: number; height: number };
    diagnostics?: Diagnostic[];
    selectedComponentId?: string;
}

/** Provider-neutral boundary for future AI authoring. The Playground has no provider implementation yet. */
export interface SpecificationAuthoringService {
    createSpecification(context: AuthoringContext): Promise<HyperPbiSchema>;
    reviseSpecification(
        specification: HyperPbiSchema,
        instruction: string,
        context: AuthoringContext
    ): Promise<HyperPbiSchema>;
}
