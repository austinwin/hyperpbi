import { TableComponent } from "../../schema/hyperpbiSchema";
import { SimpleVirtualTable } from "./TableBlock";

// The schema-facing adapter intentionally keeps Tabulator details out of HyperPBI.
// The native engine is used in certified/offline builds to reduce bundle and CSP risk.
export function TabulatorTable({ component }: { component: TableComponent }) { return <SimpleVirtualTable component={component} />; }
