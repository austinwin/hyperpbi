export {};

declare global {
    interface Window {
        remoteDemo: {
            chartId: () => string | undefined;
            zoom: () => unknown;
            setZoom: () => void;
            saved: string;
            selections: number;
            assetPoint: () => number[] | undefined;
        };
    }
}
