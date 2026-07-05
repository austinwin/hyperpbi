export interface SafeUrlOptions { allowImages?: boolean; allowExternal?: boolean; allowDataImages?: boolean; }

export function safeUrl(raw: string, options: SafeUrlOptions = {}): string | null {
    const value = raw.trim();
    if (!value) return null;
    if (/^(javascript|vbscript|file):/i.test(value)) return null;
    if (/^data:/i.test(value)) return options.allowImages && options.allowDataImages && /^data:image\/(png|gif|jpeg|webp);base64,/i.test(value) ? value : null;
    if (/^(https?):/i.test(value)) return options.allowExternal ? value : null;
    if (/^(#|\/|\.\/|\.\.\/)/.test(value)) return value;
    return null;
}
