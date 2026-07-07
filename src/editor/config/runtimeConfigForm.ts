import { defaultConfig, HyperPbiConfig, parseConfig } from "../../config/hyperpbiConfig";
import { MapBindingKeys } from "../../data/normalizeData";
import { BasemapProviderId, GeocoderProviderId } from "../../providers/providerTypes";

export interface RuntimeConfigForm {
    showHeader:boolean; showRowCount:boolean; showStudioButton:boolean;
    crossFilter:boolean; multiSelect:boolean; externalMode:"auto"|"filter"|"selection";
    cssMode:"scoped"|"trusted"; htmlMode:"sanitized"|"trusted"; showSanitizerWarnings:boolean;
    packageMode:"core"|"maps"; basemapProvider:BasemapProviderId; basemapEnabled:boolean; tileUrl:string; attribution:string; maxZoom:number;
    geocoderProvider:GeocoderProviderId; geocoderEnabled:boolean; endpoint:string; rateLimitPerSecond:number; resultLimit:number; cache:boolean; privacyAcknowledged:boolean; minScore:number; token:string; countryCode:string; category:string;
    map:Partial<MapBindingKeys>;
}

export type RuntimeConfigPatch = Partial<Omit<HyperPbiConfig,"renderer"|"interactions"|"security"|"bindings"|"providers">> & {
    renderer?:Partial<NonNullable<HyperPbiConfig["renderer"]>>;
    interactions?:Partial<NonNullable<HyperPbiConfig["interactions"]>>;
    security?:Partial<NonNullable<HyperPbiConfig["security"]>>;
    bindings?:{map?:Partial<MapBindingKeys>};
    providers?:Partial<NonNullable<HyperPbiConfig["providers"]>> & {basemap?:Partial<NonNullable<NonNullable<HyperPbiConfig["providers"]>["basemap"]>>;geocoder?:Partial<NonNullable<NonNullable<HyperPbiConfig["providers"]>["geocoder"]>>};
};

export function normalizeRuntimeConfig(candidate:unknown):{config?:HyperPbiConfig;errors:string[]}{
    if(typeof candidate==="string")return parseConfig(candidate);
    try{return parseConfig(JSON.stringify(candidate));}catch(error){return{errors:[`Configuration JSON: ${error instanceof Error?error.message:String(error)}`]};}
}

export function updateRuntimeConfigPatch(config:HyperPbiConfig,patch:RuntimeConfigPatch):HyperPbiConfig{
    return {...config,...patch,version:"1.0",renderer:{...config.renderer,...patch.renderer},interactions:{...config.interactions,...patch.interactions},security:{...config.security,...patch.security},bindings:{...config.bindings,...patch.bindings,map:{...config.bindings?.map,...patch.bindings?.map}},providers:{...config.providers,...patch.providers,basemap:{provider:patch.providers?.basemap?.provider??config.providers?.basemap?.provider??"none",enabled:patch.providers?.basemap?.enabled??config.providers?.basemap?.enabled??false,...config.providers?.basemap,...patch.providers?.basemap},geocoder:{provider:patch.providers?.geocoder?.provider??config.providers?.geocoder?.provider??"none",enabled:patch.providers?.geocoder?.enabled??config.providers?.geocoder?.enabled??false,...config.providers?.geocoder,...patch.providers?.geocoder}}};
}

export function runtimeConfigToForm(config:HyperPbiConfig):RuntimeConfigForm{
    const normalized=normalizeRuntimeConfig(config).config??defaultConfig;const basemap=normalized.providers?.basemap;const geocoder=normalized.providers?.geocoder;
    return{showHeader:normalized.renderer?.showHeader===true,showRowCount:normalized.renderer?.showRowCount===true,showStudioButton:normalized.renderer?.showStudioButton!==false,crossFilter:normalized.interactions?.crossFilter!==false,multiSelect:normalized.interactions?.multiSelect!==false,externalMode:normalized.interactions?.externalMode??"filter",cssMode:normalized.security?.cssMode??"scoped",htmlMode:normalized.security?.htmlMode??"sanitized",showSanitizerWarnings:normalized.security?.showSanitizerWarnings===true,packageMode:normalized.providers?.mode??"core",basemapProvider:basemap?.provider??"none",basemapEnabled:basemap?.enabled===true,tileUrl:basemap?.tileUrl??"",attribution:basemap?.attribution??"",maxZoom:basemap?.maxZoom??19,geocoderProvider:geocoder?.provider??"none",geocoderEnabled:geocoder?.enabled===true,endpoint:geocoder?.endpoint??"",rateLimitPerSecond:geocoder?.rateLimitPerSecond??1,resultLimit:geocoder?.resultLimit??1,cache:geocoder?.cache!==false,privacyAcknowledged:normalized.providers?.privacyAcknowledged===true,minScore:geocoder?.minScore??80,token:geocoder?.token??"",countryCode:geocoder?.countryCode??"",category:geocoder?.category??"",map:{...normalized.bindings?.map}};
}

export function formToRuntimeConfig(form:RuntimeConfigForm,current:HyperPbiConfig=defaultConfig):HyperPbiConfig{
    const externalEnabled=form.packageMode==="maps";
    return updateRuntimeConfigPatch(current,{renderer:{showHeader:form.showHeader,showRowCount:form.showRowCount,showStudioButton:form.showStudioButton},interactions:{crossFilter:form.crossFilter,multiSelect:form.multiSelect,externalMode:form.externalMode},security:{cssMode:form.cssMode,htmlMode:form.htmlMode,showSanitizerWarnings:form.showSanitizerWarnings},bindings:{map:form.map},providers:{mode:form.packageMode,privacyAcknowledged:form.privacyAcknowledged,basemap:{provider:form.basemapProvider,enabled:externalEnabled&&form.basemapEnabled,tileUrl:form.tileUrl||undefined,attribution:form.attribution||undefined,maxZoom:form.maxZoom},geocoder:{provider:form.geocoderProvider,enabled:externalEnabled&&form.geocoderEnabled,endpoint:form.endpoint||undefined,rateLimitPerSecond:form.rateLimitPerSecond,resultLimit:form.resultLimit,cache:form.cache,autocomplete:false,userTriggeredOnly:true,minScore:form.minScore,token:form.token||undefined,countryCode:form.countryCode||undefined,category:form.category||undefined}}});
}
