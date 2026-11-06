import { describe,it,expect } from "vitest";
import { validateSchema } from "../src/schema/validateSchema";
import { createXyzShell } from "../src/components/maps/MapBlock";
import { arcGisTileDefinitionSignature } from "../src/components/maps/runtime/mapLayerSignatures";
import { resolveMapLayerCapabilities } from "../src/maps/model/mapLayerCapabilities";
import { act } from "preact/test-utils";
import { button,mountMapStudio,change } from "./map-studio-fixture";

describe("native WMS raster authoring",()=>{
    it("preserves WMS source parameters, rebuilds when layers change and remains display only",()=>{
        const layer={id:"wms",name:"WMS",source:{type:"xyz" as const,url:"https://sampleserver6.arcgisonline.com/arcgis/services/USA/MapServer/WMSServer",wms:{layers:"0",version:"1.3.0" as const,transparent:true}}};
        expect(validateSchema({version:"2.0",components:[{type:"map",id:"map",layers:[layer]}]}).errors).toEqual([]);
        const shell=createXyzShell(layer);expect(shell.tile?.wms).toMatchObject({layers:"0",version:"1.3.0"});
        const other=createXyzShell({...layer,source:{...layer.source,wms:{...layer.source.wms,layers:"1"}}});expect(arcGisTileDefinitionSignature(shell,"raster")).not.toBe(arcGisTileDefinitionSignature(other,"raster"));
        expect(resolveMapLayerCapabilities("xyz")).toMatchObject({selection:false,join:false,popup:false});
        expect(validateSchema({version:"2.0",components:[{type:"map",layers:[{...layer,source:{...layer.source,wms:{layers:"0",version:"evil",renderItem:"x"}}}]}]}).errors.length).toBeGreaterThan(0);
    });
    it("creates a pending raster source and configures service and layer names visually",()=>{
        const mounted=mountMapStudio(undefined,{webAccessAvailable:true});
        act(()=>button(mounted.host,"+ Add source").click());act(()=>button(mounted.host,"WMS raster service").click());
        change(mounted.host.querySelector('[aria-label="WMS service URL"]')!,"https://services.arcgisonline.com/example/WMSServer");
        change(mounted.host.querySelector('[aria-label="WMS layer names"]')!,"0,1");
        const layer=JSON.parse(mounted.json()).components[0].layers.at(-1);expect(layer.source).toMatchObject({type:"xyz",url:"https://services.arcgisonline.com/example/WMSServer",wms:{layers:"0,1"}});mounted.cleanup();
    });
});
