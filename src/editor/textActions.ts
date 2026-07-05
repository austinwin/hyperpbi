export async function copyText(text: string): Promise<boolean> {
    try { await navigator.clipboard.writeText(text); return true; }
    catch {
        try { const input = document.createElement("textarea"); input.value = text; input.style.position = "absolute"; input.style.left = "-9999px"; document.body.appendChild(input); input.select(); const copied = document.execCommand("copy"); input.remove(); return copied; }
        catch { return false; }
    }
}

export function downloadText(text: string, fileName: string, type = "text/plain"): void {
    const url = URL.createObjectURL(new Blob([text], { type })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = fileName; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 0);
}
