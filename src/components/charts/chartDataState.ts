import type { RemoteDataSourceStatus } from "../../data/remoteDataSources";
/** Follow logical dataset aliases to an existing source status without issuing requests. */
export function chartDataState(name:string|undefined, definitions:Record<string,{source?:string}>|undefined, statuses:Readonly<Record<string,RemoteDataSourceStatus>>|undefined):RemoteDataSourceStatus|undefined {
    const visited=new Set<string>();let current=name;
    while(current&&!visited.has(current)){visited.add(current);if(statuses?.[current])return statuses[current];current=definitions?.[current]?.source;}
    return undefined;
}
