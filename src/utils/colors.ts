const palette = ["#206bc4", "#2fb344", "#f59f00", "#d63939", "#6f42c1", "#0ca678", "#e8590c", "#4263eb"];
export function categoricalColor(value: unknown): string {
    const text = String(value ?? "");
    let hash = 0;
    for (let index = 0; index < text.length; index += 1) hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
    return palette[Math.abs(hash) % palette.length];
}
