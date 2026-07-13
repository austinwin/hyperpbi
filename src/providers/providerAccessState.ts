import type { ProviderAccessState } from "./providerTypes";
let current:ProviderAccessState={tiles:{allowed:false,reason:"Provider access has not been checked."},geocoder:{allowed:false,reason:"Provider access has not been checked."}};
export const getProviderAccessState=():ProviderAccessState=>current;
export const setProviderAccessState=(next:ProviderAccessState):void=>{current=next;};
