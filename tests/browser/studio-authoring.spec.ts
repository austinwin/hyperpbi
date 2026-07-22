import {
  expect,
  test as base,
  type Page,
} from "@playwright/test";

interface StudioAuthoringHarness {
  candidate: string;
  invalidCandidate: string;
  draft: string;
  saved: string;
  externalSelections: number[][];
  layout: string;
  layoutChanges: string[];
  scenario: "default" | "empty" | "invalid";
}

declare global {
  interface Window {
    hpStudioAuthoringHarness: StudioAuthoringHarness;
  }
}

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await use(errors);
    },
    { auto: true },
  ],
});

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/browser/studio-authoring.html");
  await expect(page.locator(".hp-studio")).toBeVisible();
});

test.afterEach(async ({ browserErrors }) => {
  expect(browserErrors).toEqual([]);
});

async function validateCandidate(page: Page) {
  const candidate = await page.evaluate(
    () => window.hpStudioAuthoringHarness.candidate,
  );
  await page.locator(".hp-ai-import textarea").fill(candidate);
  await page
    .getByRole("button", { name: "Validate response & preview" })
    .click();
  await expect(page.locator(".hp-import-message")).toContainText(
    "synchronized with the working JSON",
  );
}

async function showDiagnostics(page: Page) {
  const tabs = page.getByRole("tablist", { name: "Diagnostics" });
  if (await tabs.isVisible()) return;
  await page.locator(".hp-studio-action-overflow > summary").click();
  await page.getByRole("button", { name: "Show diagnostics" }).click();
  await expect(tabs).toBeVisible();
}

async function selectWorkspace(
  page: Page,
  value: string,
  group: string,
  item: string,
) {
  const selector = page.locator(".hp-studio-workspace-select select");
  if (await selector.isVisible()) {
    await selector.selectOption(value);
  } else {
    const navigation = page.getByRole("navigation", {
      name: "Builder workspace",
    });
    await navigation
      .getByRole("button", { name: new RegExp(`^${group}(?::|$)`) })
      .click();
    await navigation
      .getByRole("menuitem", { name: new RegExp(`^${item}(?:$|\\s)`) })
      .click();
  }
  await expect(selector).toHaveValue(value);
}

async function currentLayout(page: Page) {
  return page.evaluate(() =>
    JSON.parse(window.hpStudioAuthoringHarness.layout) as {
      editorPercent: number;
      bottomHeight: number;
      bottomOpen: boolean;
      advanced: boolean;
    },
  );
}

test("validated AI map remains identical in preview, JSON, interactions, and save", async ({ page }) => {
  await validateCandidate(page);

  await expect.poll(async () => page.evaluate(() => {
    const layer = JSON.parse(window.hpStudioAuthoringHarness.draft).components[0].layers[0];
    return [layer.renderer.type, layer.tooltip.fields[0].field, layer.popup.title];
  })).toEqual(["uniqueValue", "asset_id", "{{asset_id}}"]);

  const features = page.locator(".hp-map-frame path.leaflet-interactive");
  await expect(features).toHaveCount(3);
  expect(await features.evaluateAll((items) => items.map((item) => item.getAttribute("fill")))).toEqual(
    expect.arrayContaining(["#2f855a", "#d97706", "#b91c1c"]),
  );

  await features.first().hover();
  await expect(page.locator(".hp-map-tooltip")).toContainText("Asset ID: AS-101");
  await features.first().click();
  await expect(page.locator(".hp-map-feature-details")).toContainText("AS-101");
  await expect(page.locator(".hp-map-feature-details")).not.toContainText("identityIndex");
  await expect(page.locator("tr.hp-row-selected")).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => window.hpStudioAuthoringHarness.externalSelections.length)).toBe(1);

  await features.first().click();
  await expect(page.locator(".hp-map-feature-details")).toBeVisible();
  await expect(page.locator("tr.hp-row-selected")).toHaveCount(1);

  await page.getByRole("button", { name: "Layers" }).click();
  await expect(page.locator(".hp-map-layer-name")).toHaveText("Municipal Assets");
  await expect(page.locator(".hp-map-layer-count")).toHaveCount(0);

  await selectWorkspace(page, "specification", "Advanced", "JSON editor");
  await expect(page.getByRole("button", { name: "Code" })).toHaveCount(0);
  await page
    .getByRole("navigation", { name: "Builder workspace" })
    .getByRole("button", { name: /^Learn(?::|$)/ })
    .click();
  await expect(
    page.getByRole("menuitem", { name: /^AI skill guide/ }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Save & return" }).click();
  await expect.poll(async () => page.evaluate(() => {
    const layer = JSON.parse(window.hpStudioAuthoringHarness.saved).components[0].layers[0];
    return [layer.renderer.type, layer.tooltip.fields[0].field, layer.popup.title];
  })).toEqual(["uniqueValue", "asset_id", "{{asset_id}}"]);
});

test("rectangle selection synchronizes map, table, and Power BI lineage", async ({ page }) => {
  await validateCandidate(page);

  const firstFeature = page.locator(".hp-map-frame path.leaflet-interactive").first();
  await expect(firstFeature).toBeVisible();
  const box = await firstFeature.boundingBox();
  expect(box).not.toBeNull();
  await page.getByRole("button", { name: "Select features by rectangle" }).click();
  await expect(page.getByRole("button", { name: "Select features by rectangle" })).toHaveAttribute("aria-pressed", "true");

  await page.mouse.move(box!.x - 12, box!.y - 12);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width + 12, box!.y + box!.height + 12, { steps: 5 });
  await page.mouse.up();

  await expect(page.locator(".hp-map-selection-status")).toContainText("1 feature selected across 1 Power BI row");
  await expect(page.locator("tr.hp-row-selected")).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => window.hpStudioAuthoringHarness.externalSelections.at(-1))).toEqual([0]);
  await page.getByRole("button", { name: "Clear selection" }).click();
  await expect(page.locator("tr.hp-row-selected")).toHaveCount(0);
  await expect(page.locator(".hp-map-selection-status")).toHaveCount(0);
});

test("Edit Mode fits desktop, tablet, phone, and short-height viewports", async ({ page }) => {
  const viewports = [
    { width: 1440, height: 900, stacked: false },
    { width: 1024, height: 768, stacked: false },
    { width: 819, height: 900, stacked: true },
    { width: 390, height: 844, stacked: true },
    { width: 320, height: 568, stacked: true },
    { width: 1024, height: 520, stacked: false },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    const studio = page.locator(".hp-studio");
    await expect(studio).toBeVisible();
    const geometry = await studio.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return {
        left: box.left,
        top: box.top,
        right: box.right,
        bottom: box.bottom,
        width: box.width,
        height: box.height,
        documentWidth: Math.max(
          document.documentElement.scrollWidth,
          document.body.scrollWidth,
        ),
        shellOverflow: [
          ".hp-studio-header",
          ".hp-studio-actions",
          ".hp-studio-navigation-row",
        ].map((selector) => {
          const container = document.querySelector<HTMLElement>(selector);
          return container
            ? container.scrollWidth - container.clientWidth
            : 0;
        }),
      };
    });
    expect(geometry.left).toBeGreaterThanOrEqual(0);
    expect(geometry.top).toBeGreaterThanOrEqual(0);
    expect(geometry.right).toBeLessThanOrEqual(viewport.width + 1);
    expect(geometry.bottom).toBeLessThanOrEqual(viewport.height + 1);
    expect(geometry.width).toBeCloseTo(viewport.width, 0);
    expect(geometry.height).toBeCloseTo(viewport.height, 0);
    expect(geometry.documentWidth).toBeLessThanOrEqual(viewport.width + 1);
    expect(geometry.shellOverflow.every((overflow) => overflow <= 1)).toBe(
      true,
    );

    const groupedNavigation = page.locator(".hp-studio-workspace-groups");
    const workspaceSelector = page.locator(".hp-studio-workspace-select");
    if (viewport.stacked) {
      await expect(groupedNavigation).toBeHidden();
      await expect(workspaceSelector).toBeVisible();
    } else {
      await expect(groupedNavigation).toBeVisible();
      await expect(workspaceSelector).toBeHidden();
    }

    const editor = await page.locator(".hp-studio-editor-pane").boundingBox();
    const preview = await page.locator(".hp-studio-preview").boundingBox();
    expect(editor).not.toBeNull();
    expect(preview).not.toBeNull();
    if (viewport.stacked) {
      expect(preview!.y).toBeGreaterThan(editor!.y);
      expect(Math.abs(preview!.width - editor!.width)).toBeLessThanOrEqual(2);
    } else {
      expect(preview!.x).toBeGreaterThan(editor!.x);
      expect(Math.abs(preview!.height - editor!.height)).toBeLessThanOrEqual(2);
    }

    const save = page.getByRole("button", { name: "Save & return" });
    await save.scrollIntoViewIfNeeded();
    await expect(save).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Workbench view" }),
    ).toBeVisible();
  }

  await page.setViewportSize({ width: 1024, height: 320 });
  await page.goto(
    "/tests/browser/studio-authoring.html?diagnostics=open",
  );
  const diagnosticsHandle = page.getByRole("separator", {
    name: "Resize diagnostics panel",
  });
  const currentHeight = Number(
    await diagnosticsHandle.getAttribute("aria-valuenow"),
  );
  const maximumHeight = Number(
    await diagnosticsHandle.getAttribute("aria-valuemax"),
  );
  expect(currentHeight).toBeLessThanOrEqual(maximumHeight);
  const shortStudio = await page.locator(".hp-studio").boundingBox();
  expect(shortStudio).not.toBeNull();
  expect((shortStudio?.y ?? 0) + (shortStudio?.height ?? 0)).toBeLessThanOrEqual(
    321,
  );
});

test("Split, Editor, and Preview modes expose one clear pressed state", async ({ page }) => {
  const group = page.getByRole("group", { name: "Workbench view" });
  const split = group.getByRole("button", { name: "Split", exact: true });
  const editorMode = group.getByRole("button", { name: "Editor", exact: true });
  const previewMode = group.getByRole("button", { name: "Preview", exact: true });
  const editor = page.locator(".hp-studio-editor-pane");
  const preview = page.locator(".hp-studio-preview");
  const divider = page.getByRole("separator", {
    name: "Resize builder and preview",
  });

  await expect(split).toHaveAttribute("aria-pressed", "true");
  await expect(editor).toBeVisible();
  await expect(preview).toBeVisible();

  await editorMode.click();
  await expect(editorMode).toHaveAttribute("aria-pressed", "true");
  await expect(preview).toBeHidden();
  await expect(divider).toBeHidden();

  await split.click();
  await expect(split).toHaveAttribute("aria-pressed", "true");
  await expect(editor).toBeVisible();
  await expect(preview).toBeVisible();

  await previewMode.click();
  await expect(previewMode).toHaveAttribute("aria-pressed", "true");
  await expect(editor).toBeHidden();
  await expect(divider).toBeHidden();

  await split.click();
  await expect(page.locator(".hp-studio-workspace-select select")).toHaveValue("ai");
});

test("keyboard splitters clamp, persist, and expose diagnostics tab semantics", async ({ page }) => {
  const main = page.getByRole("separator", {
    name: "Resize builder and preview",
  });
  await expect(main).toHaveAttribute("tabindex", "0");
  await expect(main).toHaveAttribute("aria-orientation", "vertical");
  await expect(main).toHaveAttribute("aria-valuemin", "25");
  await expect(main).toHaveAttribute("aria-valuemax", "75");
  await expect(main).toHaveAttribute("aria-valuenow", "42");

  await main.focus();
  await main.press("ArrowRight");
  await expect.poll(async () => (await currentLayout(page)).editorPercent).toBe(44);
  await expect(main).toBeFocused();
  await main.press("Home");
  await expect.poll(async () => (await currentLayout(page)).editorPercent).toBe(25);
  await main.press("End");
  await expect.poll(async () => (await currentLayout(page)).editorPercent).toBe(75);

  await showDiagnostics(page);
  const diagnostics = page.getByRole("tablist", { name: "Diagnostics" });
  await expect(diagnostics).toBeVisible();
  const dataTab = diagnostics.getByRole("tab", { name: "Data", exact: true });
  const fieldsTab = diagnostics.getByRole("tab", { name: "Fields", exact: true });
  await expect(dataTab).toHaveAttribute("aria-selected", "true");
  await expect(dataTab).toHaveAttribute("tabindex", "0");
  await expect(fieldsTab).toHaveAttribute("tabindex", "-1");
  const dataPanelId = await dataTab.getAttribute("aria-controls");
  expect(dataPanelId).toBeTruthy();
  await expect(page.locator(`#${dataPanelId}`)).toHaveAttribute(
    "role",
    "tabpanel",
  );

  await dataTab.focus();
  await dataTab.press("ArrowRight");
  await expect(fieldsTab).toBeFocused();
  await expect(fieldsTab).toHaveAttribute("aria-selected", "true");
  const fieldsPanelId = await fieldsTab.getAttribute("aria-controls");
  await expect(page.locator(`#${fieldsPanelId}`)).toBeVisible();

  const bottom = page.locator(".hp-bottom-resize-handle");
  await expect(bottom).toHaveAttribute("role", "separator");
  await expect(bottom).toHaveAttribute("tabindex", "0");
  await expect(bottom).toHaveAttribute("aria-orientation", "horizontal");
  await expect(bottom).toHaveAttribute("aria-valuemin", "120");
  await expect(bottom).toHaveAttribute("aria-valuenow", "180");
  await bottom.focus();
  await bottom.press("ArrowUp");
  await expect.poll(async () => (await currentLayout(page)).bottomHeight).toBe(196);
  await bottom.press("Home");
  await expect.poll(async () => (await currentLayout(page)).bottomHeight).toBe(120);
  await bottom.press("End");
  await expect.poll(async () => (await currentLayout(page)).bottomHeight).toBeGreaterThan(120);
  expect((await currentLayout(page)).bottomHeight).toBeLessThanOrEqual(520);
  await expect(bottom).toBeFocused();
  expect(
    await page.evaluate(() => window.hpStudioAuthoringHarness.layoutChanges.length),
  ).toBeGreaterThanOrEqual(6);
});

test("empty and invalid authoring states remain understandable and contained", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tests/browser/studio-authoring.html?scenario=empty");
  const empty = page.locator(".hp-preview-empty");
  await expect(empty).toBeVisible();
  await expect(empty.getByRole("heading")).toContainText(/preview/i);
  await expect(
    empty.getByRole("button", { name: "Preview changes" }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("status").filter({ hasText: "No fields are available" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);

  await page.goto(
    "/tests/browser/studio-authoring.html?scenario=invalid&diagnostics=open",
  );
  await expect(
    page.getByRole("status").filter({ hasText: "Invalid" }).first(),
  ).toBeVisible();
  const diagnostics = page.getByRole("tablist", { name: "Diagnostics" });
  const issues = diagnostics.getByRole("tab", { name: /^Issues/ });
  await issues.click();
  const issuePanelId = await issues.getAttribute("aria-controls");
  const issuePanel = page.locator(`#${issuePanelId}`);
  await expect(issuePanel).toBeVisible();
  await expect(issuePanel.locator(".hp-errors-panel")).toHaveAttribute(
    "role",
    "alert",
  );
  await expect(issuePanel.getByRole("heading", { name: /^Errors/ })).toBeVisible();
  await expect(issuePanel).toContainText("0 warnings");
  await expect(issuePanel).toContainText("span");
});

test("an invalid AI response keeps the last valid draft and preview", async ({ page }) => {
  await validateCandidate(page);
  const validDraft = await page.evaluate(
    () => window.hpStudioAuthoringHarness.draft,
  );
  const invalidCandidate = await page.evaluate(
    () => window.hpStudioAuthoringHarness.invalidCandidate,
  );
  await page.locator(".hp-ai-import textarea").fill(invalidCandidate);
  await page
    .getByRole("button", { name: "Validate response & preview" })
    .click();

  await expect(page.locator(".hp-import-message.is-error")).toContainText(
    "No changes were applied",
  );
  await expect(page.locator(".hp-repair-panel")).toBeVisible();
  expect(
    await page.evaluate(() => window.hpStudioAuthoringHarness.draft),
  ).toBe(validDraft);
  await expect(page.locator(".hp-map-frame path.leaflet-interactive")).toHaveCount(3);
});

test("mobile Inspector keeps selection, form edits, pane semantics, and keyboard focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await validateCandidate(page);
  await selectWorkspace(page, "inspector", "Create", "Visual Inspector");

  const inspector = page.locator(".hp-spec-inspector");
  await expect(inspector).toBeVisible();
  const panes = page.getByRole("tablist", { name: "Inspector pane" });
  const treeTab = panes.getByRole("tab", { name: "Tree", exact: true });
  const propertiesTab = panes.getByRole("tab", {
    name: "Properties",
    exact: true,
  });
  await expect(treeTab).toHaveAttribute("aria-selected", "true");
  const treePanelId = await treeTab.getAttribute("aria-controls");
  await expect(page.locator(`#${treePanelId}`)).toHaveAttribute(
    "role",
    "tabpanel",
  );

  const mapItem = inspector.locator(
    '.hp-inspector-tree [role="treeitem"][data-tree-id="municipal-map"]',
  );
  await expect(mapItem).toHaveAttribute("tabindex", "0");
  await expect(mapItem).toHaveAttribute("aria-level", "1");
  await mapItem.click();
  await expect(propertiesTab).toHaveAttribute("aria-selected", "true");
  const propertiesPanelId = await propertiesTab.getAttribute("aria-controls");
  const propertiesPanel = page.locator(`#${propertiesPanelId}`);
  await expect(propertiesPanel).toBeVisible();
  const componentSummary = propertiesPanel.locator(
    ".hp-inspector-component-summary",
  );
  const componentActions = componentSummary.locator(
    ".hp-inspector-component-actions",
  );
  await expect(componentActions).toBeVisible();
  await expect(componentActions.getByRole("button")).toHaveCount(4);
  await expect(inspector.locator(".hp-inspector-node-actions")).toHaveCount(0);
  expect(await propertiesPanel.evaluate((panel) => ({
    summaryPosition: getComputedStyle(panel.querySelector(".hp-inspector-component-summary")!).position,
    backPosition: getComputedStyle(panel.querySelector(".hp-inspector-mobile-back")!).position,
    actionsPosition: getComputedStyle(panel.querySelector(".hp-inspector-component-actions")!).position,
    paddingBottom: getComputedStyle(panel).paddingBottom,
  }))).toEqual({
    summaryPosition: "static",
    backPosition: "static",
    actionsPosition: "static",
    paddingBottom: "0px",
  });

  const title = page.getByRole("textbox", { name: "title", exact: true });
  await title.fill("Mobile asset map");
  await title.press("Tab");
  await expect.poll(async () => page.evaluate(() =>
    JSON.parse(window.hpStudioAuthoringHarness.draft).components[0].title,
  )).toBe("Mobile asset map");

  await propertiesPanel.evaluate((panel) => {
    panel.scrollTop = panel.scrollHeight;
  });
  const scrolledLayout = await propertiesPanel.evaluate((panel) => {
    const panelRect = panel.getBoundingClientRect();
    const actionsRect = panel.querySelector(".hp-inspector-component-actions")!.getBoundingClientRect();
    return {
      scrollTop: panel.scrollTop,
      panelTop: panelRect.top,
      actionsBottom: actionsRect.bottom,
    };
  });
  expect(scrolledLayout.scrollTop).toBeGreaterThan(0);
  expect(scrolledLayout.actionsBottom).toBeLessThanOrEqual(scrolledLayout.panelTop);

  await treeTab.click();
  await expect(mapItem).toHaveAttribute("aria-selected", "true");
  await mapItem.focus();
  await mapItem.press("ArrowDown");
  const tableItem = inspector.locator(
    '.hp-inspector-tree [role="treeitem"][data-tree-id="asset-list"]',
  );
  await expect(tableItem).toHaveAttribute("aria-selected", "true");
  await expect(tableItem).toBeFocused();

  const search = page.getByRole("searchbox", { name: "Search components" });
  await search.fill("does-not-exist");
  await expect(inspector.locator(".hp-inspector-search-empty")).toBeVisible();
  const geometry = await inspector.evaluate((element) => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
});

test("workspace menus provide complete keyboard focus management", async ({ page }) => {
  const navigation = page.getByRole("navigation", { name: "Builder workspace" });
  const create = navigation.locator('[data-workspace-trigger="Create"]');
  await create.focus();
  await create.press("ArrowDown");
  const menu = navigation.getByRole("menu");
  await expect(menu).toBeVisible();
  const items = menu.getByRole("menuitem");
  await expect(items.first()).toBeFocused();
  await page.keyboard.press("End");
  await expect(items.last()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(create).toBeFocused();

  const duplicateIds = await page.locator("[id]").evaluateAll((elements) => {
    const counts = new Map<string, number>();
    for (const element of elements) {
      counts.set(element.id, (counts.get(element.id) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([id]) => id);
  });
  expect(duplicateIds).toEqual([]);
});
