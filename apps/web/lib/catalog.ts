import catalogJson from "../generated/component-catalog.json";

export interface CatalogComponent {
  type: string;
  label: string;
  category: string;
  maturity: "stable" | "beta" | "experimental" | "deprecated";
  complexity: "recommended" | "standard" | "advanced";
  useWhen: string;
  summary: string;
  accessibility: string[];
  relatedTypes: string[];
  capabilities: Record<string, boolean>;
  interaction: {
    defaultEnabled: boolean;
    naturalTrigger: string;
    autoExternalMode: string;
  };
  required: string[];
  allowed: string[];
  example: Record<string, unknown>;
}

export interface CatalogData {
  generated: true;
  version: number;
  componentCount: number;
  categories: string[];
  components: CatalogComponent[];
}

export const componentCatalog = catalogJson as CatalogData;
