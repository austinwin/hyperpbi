export class CalculationError extends Error { constructor(message: string, public readonly path = "calculations") { super(message); this.name = "CalculationError"; } }
