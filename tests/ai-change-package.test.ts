import { describe, expect, it } from "vitest";
import { applyChangePackage } from "../src/ai/applyChangePackage";
import { validateAiChangePackage } from "../src/ai/changePackageValidation";
import type { AiChangePackage } from "../src/ai/changePackage";
const current = {
  version: "2.0" as const,
  components: [
    {
      type: "section" as const,
      id: "one",
      children: [{ type: "text" as const, id: "child", text: "A" }],
    },
    { type: "text" as const, id: "two", text: "B" },
  ],
};
const pkg = (
  operation: AiChangePackage["operation"],
  extra: Record<string, unknown>,
) => ({ kind: "hyperpbi-change", version: "1.0", operation, ...extra });
describe("AI change packages", () => {
  it("strictly validates operation shapes and unknown properties", () => {
    expect(
      validateAiChangePackage(
        pkg("replace", {
          targetId: "one",
          component: { type: "section", id: "wrong" },
        }),
      ).errors,
    ).toContain("replace requires component.id to equal targetId.");
    expect(
      validateAiChangePackage(pkg("remove", { targetId: "one", component: {} }))
        .errors[0],
    ).toContain("Unknown change-package property");
    expect(
      validateAiChangePackage(
        pkg("replaceDashboard", { specification: current, targetId: "one" }),
      ).valid,
    ).toBe(false);
  });
  it("replaces, inserts, appends and removes without mutating the source", () => {
    const replace = applyChangePackage(
      current,
      pkg("replace", {
        targetId: "one",
        component: { type: "text", id: "one", text: "R" },
      }) as AiChangePackage,
    );
    expect(replace.schema?.components.map((item) => item.id)).toEqual([
      "one",
      "two",
    ]);
    expect((current.components[0] as any).type).toBe("section");
    expect(
      applyChangePackage(
        current,
        pkg("insertBefore", {
          targetId: "two",
          component: { type: "text", id: "before", text: "X" },
        }) as AiChangePackage,
      ).schema?.components.map((item) => item.id),
    ).toEqual(["one", "before", "two"]);
    expect(
      applyChangePackage(
        current,
        pkg("insertAfter", {
          targetId: "one",
          component: { type: "text", id: "after", text: "X" },
        }) as AiChangePackage,
      ).schema?.components.map((item) => item.id),
    ).toEqual(["one", "after", "two"]);
    expect(
      (
        applyChangePackage(
          current,
          pkg("appendChild", {
            targetId: "one",
            container: "children",
            component: { type: "text", id: "new", text: "X" },
          }) as AiChangePackage,
        ).schema?.components[0] as any
      ).children.map((item: any) => item.id),
    ).toEqual(["child", "new"]);
    expect(
      applyChangePackage(
        current,
        pkg("remove", { targetId: "two" }) as AiChangePackage,
      ).schema?.components.map((item) => item.id),
    ).toEqual(["one"]);
  });
  it("rejects invalid targets, incompatible containers and ID collisions", () => {
    expect(
      applyChangePackage(
        current,
        pkg("remove", { targetId: "missing" }) as AiChangePackage,
      ).errors[0],
    ).toContain("does not exist");
    expect(
      applyChangePackage(
        current,
        pkg("appendChild", {
          targetId: "one",
          container: "tabs",
          component: { type: "text", id: "new" },
        }) as AiChangePackage,
      ).errors[0],
    ).toContain("not compatible");
    expect(
      applyChangePackage(
        current,
        pkg("insertAfter", {
          targetId: "one",
          component: { type: "text", id: "two" },
        }) as AiChangePackage,
      ).errors[0],
    ).toContain("collide");
  });
  it("runs full-result validation and preserves the existing dashboard on failure", () => {
    const snapshot = JSON.stringify(current);
    const result = applyChangePackage(
      current,
      pkg("insertAfter", {
        targetId: "one",
        component: { type: "text", id: "new", text: "X" },
      }) as AiChangePackage,
      { validateResult: () => ({ errors: ["Resulting dashboard has an unknown field."] }) },
    );
    expect(result.schema).toBeUndefined();
    expect(result.errors).toEqual(["Resulting dashboard has an unknown field."]);
    expect(JSON.stringify(current)).toBe(snapshot);
  });
});
