import { ChartComponent, ContainerComponent, ContentComponent, ControlComponent, DashboardComponent, DrawerComponent, MapComponent, MatrixComponent, SmallMultiplesComponent, TableComponent, TabsComponent, TimelineComponent } from "../schema/hyperpbiSchema";
import { ChartBlock } from "../components/charts/ChartBlock";
import { ControlBlock } from "../components/controls/Controls";
import { DataDisplayBlock } from "../components/dataDisplay/DataDisplay";
import { HtmlBlock } from "../components/content/HtmlBlock";
import { MarkdownBlock } from "../components/content/MarkdownBlock";
import { TextBlock } from "../components/content/TextBlock";
import { Divider, FlexLayout, GridLayout, Section, Spacer } from "../components/layout/LayoutBlocks";
import { MapBlock } from "../components/maps/MapBlock";
import { Collapsible, Tabs } from "../components/navigation/Navigation";
import { TableBlock } from "../components/tables/TableBlock";
import { EmptyState } from "../components/system/EmptyState";
import { CustomComponent } from "../components/custom/CustomComponent";
import { Drawer } from "../components/navigation/Drawer";
import { Timeline } from "../components/dataDisplay/Timeline";
import { MatrixBlock } from "../components/tables/MatrixBlock";
import { SmallMultiples } from "../components/charts/SmallMultiples";

const controlTypes = new Set(["searchBox", "textInput", "numberInput", "slider", "select", "multiSelect", "segmentedControl", "toggle", "button", "buttonGroup", "filterChips", "dateRange"]);
const dataTypes = new Set(["kpi", "metricGrid", "infoCard", "statusBadge", "progressBar", "alert", "statList", "detailPanel"]);
const chartTypes = new Set(["barChart", "horizontalBarChart", "lineChart", "areaChart", "pieChart", "donutChart", "scatterChart", "gauge", "heatmap", "advancedChart"]);

export function ComponentRegistry({ component, renderChildren }: { component: DashboardComponent; renderChildren: (children: DashboardComponent[]) => preact.ComponentChildren }) {
    if (controlTypes.has(component.type)) return <ControlBlock component={component as ControlComponent} />;
    if (dataTypes.has(component.type)) return <DataDisplayBlock component={component} />;
    if (chartTypes.has(component.type)) return <ChartBlock component={component as ChartComponent} />;
    if(component.type==="smallMultiples")return <SmallMultiples component={component as SmallMultiplesComponent}/>;
    if (component.type === "table") return <TableBlock component={component as TableComponent} />;
    if(component.type==="matrix")return <MatrixBlock component={component as MatrixComponent}/>;
    if (component.type === "map") return <MapBlock component={component as MapComponent} />;
    if(component.type==="timeline")return <Timeline component={component as TimelineComponent}/>;
    if (component.type === "html") return <HtmlBlock component={component as ContentComponent} />;
    if (component.type === "text") return <TextBlock component={component as ContentComponent} />;
    if (component.type === "markdown") return <MarkdownBlock component={component as ContentComponent} />;
    if (component.type === "custom") return <CustomComponent component={component as ContentComponent} />;
    if (component.type === "tabs") return <Tabs component={component as TabsComponent} renderChildren={renderChildren} />;
    if(component.type==="drawer"||component.type==="filterDrawer")return <Drawer component={component as DrawerComponent} renderChildren={renderChildren}/>;
    if (component.type === "collapsible" || component.type === "accordion") return <Collapsible component={component} renderChildren={renderChildren} />;
    if (component.type === "divider") return <Divider />;
    if (component.type === "spacer") return <Spacer />;
    const container = component as ContainerComponent;
    const children = container.children ?? [];
    if (component.type === "grid") return <GridLayout columns={container.columns} gap={container.gap}>{renderChildren(children)}</GridLayout>;
    if (component.type === "flex" || component.type === "toolbar") return <FlexLayout direction={container.direction} gap={container.gap}>{renderChildren(children)}</FlexLayout>;
    if (["section", "leftPanel", "rightPanel", "split"].includes(component.type)) return <Section title={component.title}>{renderChildren(children)}</Section>;
    if (component.type === "stepper") return <Collapsible component={component} renderChildren={renderChildren} />;
    return <EmptyState title={`Unsupported component: ${component.type}`} />;
}
