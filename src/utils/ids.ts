let sequence = 0;
export function createInstanceId(): string { sequence += 1; return `hp-${Date.now().toString(36)}-${sequence.toString(36)}`; }
