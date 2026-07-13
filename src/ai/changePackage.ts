import type { DashboardComponent, HyperPbiSchema } from "../schema/hyperpbiSchema";
export type AiChangePackage=
    |{kind:"hyperpbi-change";version:"1.0";operation:"replaceDashboard";specification:HyperPbiSchema;targetId?:never}
    |{kind:"hyperpbi-change";version:"1.0";operation:"replace"|"insertBefore"|"insertAfter";targetId:string;component:DashboardComponent;container?:never}
    |{kind:"hyperpbi-change";version:"1.0";operation:"appendChild";targetId:string;containerPath:string;component:DashboardComponent}
    |{kind:"hyperpbi-change";version:"1.0";operation:"appendRoot";containerPath:"components"|"toolbar"|"leftPanel"|"rightPanel";component:DashboardComponent}
    |{kind:"hyperpbi-change";version:"1.0";operation:"remove";targetId:string};
export const isAiChangePackage=(value:unknown):value is AiChangePackage=>Boolean(value)&&typeof value==="object"&&(value as {kind?:unknown}).kind==="hyperpbi-change";
