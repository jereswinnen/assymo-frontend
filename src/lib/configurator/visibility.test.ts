import { describe, it, expect } from "vitest";
import { isQuestionVisible } from "./visibility";
import type { VisibilityConfig } from "./types";

describe("isQuestionVisible", () => {
  // ==========================================================================
  // Null / empty rules
  // ==========================================================================

  it("returns true when rules are null", () => {
    expect(isQuestionVisible(null, {})).toBe(true);
  });

  it("returns true when rules are undefined", () => {
    expect(isQuestionVisible(undefined, {})).toBe(true);
  });

  it("returns true when rules array is empty", () => {
    const config: VisibilityConfig = { rules: [], logic: "all" };
    expect(isQuestionVisible(config, {})).toBe(true);
  });

  // ==========================================================================
  // equals / not_equals
  // ==========================================================================

  it("equals: matches when answer equals value", () => {
    const config: VisibilityConfig = {
      rules: [{ questionKey: "material", operator: "equals", value: "hout" }],
      logic: "all",
    };
    expect(isQuestionVisible(config, { material: "hout" })).toBe(true);
    expect(isQuestionVisible(config, { material: "metaal" })).toBe(false);
  });

  it("not_equals: matches when answer differs", () => {
    const config: VisibilityConfig = {
      rules: [{ questionKey: "material", operator: "not_equals", value: "hout" }],
      logic: "all",
    };
    expect(isQuestionVisible(config, { material: "metaal" })).toBe(true);
    expect(isQuestionVisible(config, { material: "hout" })).toBe(false);
  });

  it("equals: coerces number answer to string for comparison", () => {
    const config: VisibilityConfig = {
      rules: [{ questionKey: "count", operator: "equals", value: "5" }],
      logic: "all",
    };
    expect(isQuestionVisible(config, { count: 5 })).toBe(true);
  });

  // ==========================================================================
  // includes / not_includes (multi-select)
  // ==========================================================================

  it("includes: matches when array answer contains value", () => {
    const config: VisibilityConfig = {
      rules: [{ questionKey: "features", operator: "includes", value: "wifi" }],
      logic: "all",
    };
    expect(isQuestionVisible(config, { features: ["wifi", "bluetooth"] })).toBe(true);
    expect(isQuestionVisible(config, { features: ["bluetooth"] })).toBe(false);
  });

  it("includes: works with string answer as single value", () => {
    const config: VisibilityConfig = {
      rules: [{ questionKey: "color", operator: "includes", value: "red" }],
      logic: "all",
    };
    expect(isQuestionVisible(config, { color: "red" })).toBe(true);
    expect(isQuestionVisible(config, { color: "blue" })).toBe(false);
  });

  it("not_includes: matches when array answer does not contain value", () => {
    const config: VisibilityConfig = {
      rules: [{ questionKey: "features", operator: "not_includes", value: "wifi" }],
      logic: "all",
    };
    expect(isQuestionVisible(config, { features: ["bluetooth"] })).toBe(true);
    expect(isQuestionVisible(config, { features: ["wifi", "bluetooth"] })).toBe(false);
  });

  // ==========================================================================
  // is_empty / is_not_empty
  // ==========================================================================

  it("is_empty: matches undefined, empty string, and empty array", () => {
    const config: VisibilityConfig = {
      rules: [{ questionKey: "note", operator: "is_empty" }],
      logic: "all",
    };
    expect(isQuestionVisible(config, {})).toBe(true);
    expect(isQuestionVisible(config, { note: undefined })).toBe(true);
    expect(isQuestionVisible(config, { note: "" })).toBe(true);
    expect(isQuestionVisible(config, { note: [] as string[] })).toBe(true);
    expect(isQuestionVisible(config, { note: "filled" })).toBe(false);
  });

  it("is_not_empty: matches when answer has a value", () => {
    const config: VisibilityConfig = {
      rules: [{ questionKey: "note", operator: "is_not_empty" }],
      logic: "all",
    };
    expect(isQuestionVisible(config, { note: "hello" })).toBe(true);
    expect(isQuestionVisible(config, { note: 42 })).toBe(true);
    expect(isQuestionVisible(config, { note: ["a"] })).toBe(true);
    expect(isQuestionVisible(config, {})).toBe(false);
    expect(isQuestionVisible(config, { note: "" })).toBe(false);
  });

  // ==========================================================================
  // greater_than / less_than
  // ==========================================================================

  it("greater_than: matches when numeric answer exceeds value", () => {
    const config: VisibilityConfig = {
      rules: [{ questionKey: "width", operator: "greater_than", value: 3 }],
      logic: "all",
    };
    expect(isQuestionVisible(config, { width: 4 })).toBe(true);
    expect(isQuestionVisible(config, { width: 3 })).toBe(false);
    expect(isQuestionVisible(config, { width: 2 })).toBe(false);
  });

  it("less_than: matches when numeric answer is below value", () => {
    const config: VisibilityConfig = {
      rules: [{ questionKey: "height", operator: "less_than", value: 10 }],
      logic: "all",
    };
    expect(isQuestionVisible(config, { height: 9 })).toBe(true);
    expect(isQuestionVisible(config, { height: 10 })).toBe(false);
    expect(isQuestionVisible(config, { height: 11 })).toBe(false);
  });

  it("greater_than: returns false when answer is not a number", () => {
    const config: VisibilityConfig = {
      rules: [{ questionKey: "width", operator: "greater_than", value: 3 }],
      logic: "all",
    };
    expect(isQuestionVisible(config, { width: "wide" })).toBe(false);
    expect(isQuestionVisible(config, {})).toBe(false);
  });

  // ==========================================================================
  // Logic modes: all (AND) vs any (OR)
  // ==========================================================================

  it('logic "all": all rules must pass', () => {
    const config: VisibilityConfig = {
      rules: [
        { questionKey: "material", operator: "equals", value: "hout" },
        { questionKey: "width", operator: "greater_than", value: 2 },
      ],
      logic: "all",
    };
    expect(isQuestionVisible(config, { material: "hout", width: 3 })).toBe(true);
    expect(isQuestionVisible(config, { material: "hout", width: 1 })).toBe(false);
    expect(isQuestionVisible(config, { material: "metaal", width: 3 })).toBe(false);
  });

  it('logic "any": at least one rule must pass', () => {
    const config: VisibilityConfig = {
      rules: [
        { questionKey: "material", operator: "equals", value: "hout" },
        { questionKey: "width", operator: "greater_than", value: 2 },
      ],
      logic: "any",
    };
    expect(isQuestionVisible(config, { material: "hout", width: 1 })).toBe(true);
    expect(isQuestionVisible(config, { material: "metaal", width: 3 })).toBe(true);
    expect(isQuestionVisible(config, { material: "metaal", width: 1 })).toBe(false);
  });

  // ==========================================================================
  // Action: show (default) vs hide
  // ==========================================================================

  it('action "show" (default): visible when rules match', () => {
    const config: VisibilityConfig = {
      rules: [{ questionKey: "material", operator: "equals", value: "hout" }],
      logic: "all",
    };
    expect(isQuestionVisible(config, { material: "hout" })).toBe(true);
    expect(isQuestionVisible(config, { material: "metaal" })).toBe(false);
  });

  it('action "show" explicit: same as default', () => {
    const config: VisibilityConfig = {
      rules: [{ questionKey: "material", operator: "equals", value: "hout" }],
      logic: "all",
      action: "show",
    };
    expect(isQuestionVisible(config, { material: "hout" })).toBe(true);
    expect(isQuestionVisible(config, { material: "metaal" })).toBe(false);
  });

  it('action "hide": hidden when rules match, visible when they don\'t', () => {
    const config: VisibilityConfig = {
      rules: [{ questionKey: "material", operator: "equals", value: "hout" }],
      logic: "all",
      action: "hide",
    };
    // Rules match → hide → not visible
    expect(isQuestionVisible(config, { material: "hout" })).toBe(false);
    // Rules don't match → don't hide → visible
    expect(isQuestionVisible(config, { material: "metaal" })).toBe(true);
  });

  it('action "hide" with logic "any": hidden when any rule matches', () => {
    const config: VisibilityConfig = {
      rules: [
        { questionKey: "material", operator: "equals", value: "hout" },
        { questionKey: "material", operator: "equals", value: "metaal" },
      ],
      logic: "any",
      action: "hide",
    };
    expect(isQuestionVisible(config, { material: "hout" })).toBe(false);
    expect(isQuestionVisible(config, { material: "metaal" })).toBe(false);
    expect(isQuestionVisible(config, { material: "glas" })).toBe(true);
  });
});
