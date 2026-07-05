import { DataRow } from "../data/normalizeData";
import { ExpressionNode } from "./calculationTypes";
import { evaluateExpression } from "./expressionEvaluator";
export const evaluateCondition = (expression: ExpressionNode | undefined, row: DataRow): boolean => expression ? Boolean(evaluateExpression(expression, row)) : true;
