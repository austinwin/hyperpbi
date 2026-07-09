import { ComponentChildren, h } from "preact";
import type {
    ChartComponent, ContainerComponent, ContentComponent, ControlComponent,
    DashboardComponent, DrawerComponent, MapComponent, MatrixComponent,
    SmallMultiplesComponent, TableComponent, TabsComponent, TimelineComponent,
    CardComponent, OffcanvasComponent, AccordionComponent,
    ListGroupComponent, DataGridComponent, EmptyStateComponent,
    PlaceholderComponent, SpinnerComponent, CountUpComponent, TrackingComponent,
    StepsComponent, IconComponent, IconButtonComponent, AvatarComponent, AvatarGroupComponent,
} from "../schema/hyperpbiSchema";
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
import { CardBlock } from "../components/display/CardBlock";
import { Accordion } from "../components/navigation/Accordion";
import { Steps } from "../components/navigation/Steps";
import { ListGroup } from "../components/display/ListGroup";
import { DataGrid } from "../components/display/DataGrid";
import { EmptyStateBlock } from "../components/feedback/EmptyStateBlock";
import { PlaceholderBlock, SpinnerBlock } from "../components/feedback/LoadingBlocks";
import { CountUp } from "../components/display/CountUp";
import { Tracking } from "../components/display/Tracking";
import { Icon } from "../components/icons/Icon";
import { IconButton } from "../components/display/IconButton";
import { Avatar, AvatarGroup } from "../components/display/Avatar";

type RenderChildren = (children: DashboardComponent[]) => ComponentChildren;
type ComponentRenderer = (component: DashboardComponent, renderChildren: RenderChildren) => ComponentChildren;

const controlTypes = new Set(["searchBox", "textInput", "numberInput", "slider", "select", "multiSelect", "segmentedControl", "toggle", "button", "buttonGroup", "filterChips", "dateRange", "textarea", "checkbox", "checkboxGroup", "radioGroup", "inputGroup"]);
const dataTypes = new Set(["kpi", "metricGrid", "infoCard", "statusBadge", "progressBar", "alert", "statList", "detailPanel"]);
const chartTypes = new Set(["barChart", "horizontalBarChart", "lineChart", "areaChart", "pieChart", "donutChart", "scatterChart", "gauge", "heatmap", "advancedChart"]);

const componentRenderers: Record<string, ComponentRenderer> = {
    table: c => h(TableBlock, { component: c as TableComponent }),
    matrix: c => h(MatrixBlock, { component: c as MatrixComponent }),
    map: c => h(MapBlock, { component: c as MapComponent }),
    smallMultiples: c => h(SmallMultiples, { component: c as SmallMultiplesComponent }),
    timeline: c => h(Timeline, { component: c as TimelineComponent }),
    tabs: (c, rc) => h(Tabs, { component: c as TabsComponent, renderChildren: rc }),
    html: c => h(HtmlBlock, { component: c as ContentComponent }),
    text: c => h(TextBlock, { component: c as ContentComponent }),
    markdown: c => h(MarkdownBlock, { component: c as ContentComponent }),
    custom: c => h(CustomComponent, { component: c as ContentComponent }),
    divider: () => h(Divider, {}),
    spacer: () => h(Spacer, {}),
    // Layout containers
    grid: (c, rc) => { const comp = c as ContainerComponent; return h(GridLayout, { columns: comp.columns, gap: comp.gap }, rc(comp.children ?? [])); },
    flex: (c, rc) => { const comp = c as ContainerComponent; return h(FlexLayout, { direction: comp.direction, gap: comp.gap }, rc(comp.children ?? [])); },
    toolbar: (c, rc) => { const comp = c as ContainerComponent; return h(FlexLayout, { direction: comp.direction, gap: comp.gap }, rc(comp.children ?? [])); },
    // New primitives
    card: (c, rc) => h(CardBlock, { component: c as CardComponent, renderChildren: rc }),
    accordion: (c, rc) => h(Accordion, { component: c as AccordionComponent, renderChildren: rc }),
    steps: c => h(Steps, { component: c as StepsComponent }),
    listGroup: c => h(ListGroup, { component: c as ListGroupComponent }),
    dataGrid: c => h(DataGrid, { component: c as DataGridComponent }),
    emptyState: c => h(EmptyStateBlock, { component: c as EmptyStateComponent }),
    placeholder: c => h(PlaceholderBlock, { component: c as PlaceholderComponent }),
    spinner: c => h(SpinnerBlock, { component: c as SpinnerComponent }),
    countUp: c => h(CountUp, { component: c as CountUpComponent }),
    tracking: c => h(Tracking, { component: c as TrackingComponent }),
    icon: c => { const ic = c as IconComponent; return h(Icon, { name: ic.icon, size: ic.size }) },
    iconButton: c => h(IconButton, { component: c as IconButtonComponent }),
    avatar: c => h(Avatar, { component: c as AvatarComponent }),
    avatarGroup: c => h(AvatarGroup, { component: c as AvatarGroupComponent }),
    // overlays - triggers render inline, body rendered by OverlayHost
    modal: () => null, // rendered by OverlayHost
    dropdown: () => null, // TODO: implement dropdown renderer
    offcanvas: () => null, // TODO: implement offcanvas renderer
    popover: () => null, // TODO: implement popover renderer
    // stepper normalized to steps via migration
    stepper: (c, rc) => h(Collapsible, { component: c, renderChildren: rc }),
    // drawer and filterDrawer use the existing Drawer (will be normalized to offcanvas in migration)
    drawer: (c, rc) => h(Drawer, { component: c as DrawerComponent, renderChildren: rc }),
    filterDrawer: (c, rc) => h(Drawer, { component: c as DrawerComponent, renderChildren: rc }),
    // navigation
    collapsible: (c, rc) => h(Collapsible, { component: c, renderChildren: rc }),
};

// Populate renderers for sets
for (const type of controlTypes) {
    componentRenderers[type] = c => h(ControlBlock, { component: c as ControlComponent });
}
for (const type of dataTypes) {
    componentRenderers[type] = c => h(DataDisplayBlock, { component: c as any });
}
for (const type of chartTypes) {
    componentRenderers[type] = c => h(ChartBlock, { component: c as ChartComponent });
}
// section, leftPanel, rightPanel, split
for (const type of ["section", "leftPanel", "rightPanel", "split"]) {
    componentRenderers[type] = (c, rc) => {
        const comp = c as ContainerComponent;
        return h(Section, { title: comp.title }, rc(comp.children ?? []));
    };
}

export function ComponentRegistry({ component, renderChildren }: { component: DashboardComponent; renderChildren: RenderChildren }) {
    const renderer = componentRenderers[component.type];
    if (renderer) {
        return h("div", {}, renderer(component, renderChildren));
    }
    // Unsupported component fallback
    return h(EmptyState, { title: `Unsupported component: ${component.type}` });
}

