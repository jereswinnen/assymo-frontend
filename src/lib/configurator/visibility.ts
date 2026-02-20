import type { VisibilityConfig } from "./types";

type AnswerValue = string | string[] | number | undefined;
type Answers = Record<string, AnswerValue>;

/**
 * Evaluate whether a question should be visible based on its visibility rules
 * and the current answers.
 *
 * Returns true (visible) when:
 * - rules is null/undefined (no rules = always visible)
 * - rules.rules is empty
 * - The rules evaluate to true based on the logic mode (all/any)
 */
export function isQuestionVisible(
  visibilityRules: VisibilityConfig | null | undefined,
  answers: Answers,
): boolean {
  if (!visibilityRules || visibilityRules.rules.length === 0) {
    return true;
  }

  const { rules, logic } = visibilityRules;

  const evaluateRule = (rule: typeof rules[number]): boolean => {
    const answer = answers[rule.questionKey];

    switch (rule.operator) {
      case "is_empty":
        return answer === undefined || answer === "" || (Array.isArray(answer) && answer.length === 0);

      case "is_not_empty":
        return answer !== undefined && answer !== "" && !(Array.isArray(answer) && answer.length === 0);

      case "equals":
        return String(answer) === String(rule.value);

      case "not_equals":
        return String(answer) !== String(rule.value);

      case "includes":
        if (Array.isArray(answer)) {
          return answer.includes(String(rule.value));
        }
        return String(answer) === String(rule.value);

      case "not_includes":
        if (Array.isArray(answer)) {
          return !answer.includes(String(rule.value));
        }
        return String(answer) !== String(rule.value);

      case "greater_than":
        return typeof answer === "number" && typeof rule.value === "number" && answer > rule.value;

      case "less_than":
        return typeof answer === "number" && typeof rule.value === "number" && answer < rule.value;

      default:
        return true;
    }
  };

  const match = logic === "any" ? rules.some(evaluateRule) : rules.every(evaluateRule);

  // "hide" action inverts: visible when rules DON'T match
  return visibilityRules.action === "hide" ? !match : match;
}
