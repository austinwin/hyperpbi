export function LayerControl({ layers, visible, onChange }: { layers: string[]; visible: Set<string>; onChange: (name: string, enabled: boolean) => void }) {
    return <fieldset class="hp-map-layer-control"><legend>Layers</legend>{layers.map(name => <label><input type="checkbox" checked={visible.has(name)} onChange={event => onChange(name, event.currentTarget.checked)} /><span>{name}</span></label>)}</fieldset>;
}
