import { DataRow } from "../data/normalizeData";
import { EvaluationContext, ExpressionNode } from "./calculationTypes";
import { evaluateExpression } from "./expressionEvaluator";
export const evaluateCondition = (expression: ExpressionNode | undefined, row: DataRow, context?: EvaluationContext): boolean => expression ? Boolean(evaluateExpression(expression, row, context)) : true;
