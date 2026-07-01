import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocation, getToolActionLabel } from "../ToolInvocation";
import type { ToolInvocation as ToolInvocationType } from "ai";

afterEach(() => {
  cleanup();
});

function makeInvocation(
  overrides: Partial<ToolInvocationType> = {}
): ToolInvocationType {
  return {
    toolCallId: "call_1",
    toolName: "str_replace_editor",
    args: {},
    state: "result",
    result: "ok",
    ...overrides,
  } as ToolInvocationType;
}

test("getToolActionLabel: create shows 'Creating <file>'", () => {
  const label = getToolActionLabel("str_replace_editor", {
    command: "create",
    path: "/components/Card.jsx",
  });
  expect(label).toBe("Creating Card.jsx");
});

test("getToolActionLabel: str_replace shows 'Editing <file>'", () => {
  const label = getToolActionLabel("str_replace_editor", {
    command: "str_replace",
    path: "/components/Card.jsx",
  });
  expect(label).toBe("Editing Card.jsx");
});

test("getToolActionLabel: insert shows 'Editing <file>'", () => {
  const label = getToolActionLabel("str_replace_editor", {
    command: "insert",
    path: "/App.jsx",
  });
  expect(label).toBe("Editing App.jsx");
});

test("getToolActionLabel: delete shows 'Deleting <file>'", () => {
  const label = getToolActionLabel("file_manager", {
    command: "delete",
    path: "/components/Old.jsx",
  });
  expect(label).toBe("Deleting Old.jsx");
});

test("getToolActionLabel: rename shows both file names", () => {
  const label = getToolActionLabel("file_manager", {
    command: "rename",
    path: "/components/Old.jsx",
    new_path: "/components/New.jsx",
  });
  expect(label).toBe("Renaming Old.jsx to New.jsx");
});

test("getToolActionLabel: strips directory, keeps base name", () => {
  const label = getToolActionLabel("str_replace_editor", {
    command: "create",
    path: "/a/b/c/deep/Widget.tsx",
  });
  expect(label).toBe("Creating Widget.tsx");
});

test("getToolActionLabel: falls back gracefully without a path", () => {
  expect(getToolActionLabel("str_replace_editor", { command: "create" })).toBe(
    "Creating file"
  );
  expect(getToolActionLabel("str_replace_editor", {})).toBe("Editing file");
  expect(getToolActionLabel("file_manager", { command: "delete" })).toBe(
    "Deleting file"
  );
});

test("getToolActionLabel: unknown tool falls back to the tool name", () => {
  expect(getToolActionLabel("some_other_tool", {})).toBe("some_other_tool");
});

test("ToolInvocation does not render the raw tool name", () => {
  render(
    <ToolInvocation
      toolInvocation={makeInvocation({
        args: { command: "create", path: "/components/Card.jsx" },
      })}
    />
  );

  expect(screen.getByText("Creating Card.jsx")).toBeDefined();
  expect(screen.queryByText("str_replace_editor")).toBeNull();
});

test("ToolInvocation shows a completion dot when state is result", () => {
  const { container } = render(
    <ToolInvocation
      toolInvocation={makeInvocation({
        state: "result",
        args: { command: "create", path: "/App.jsx" },
      })}
    />
  );

  expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("ToolInvocation shows a spinner while the call is in progress", () => {
  const { container } = render(
    <ToolInvocation
      toolInvocation={makeInvocation({
        state: "call",
        result: undefined,
        args: { command: "create", path: "/App.jsx" },
      })}
    />
  );

  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});
