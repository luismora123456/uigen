"use client";

import { Loader2 } from "lucide-react";
import type { ToolInvocation as ToolInvocationType } from "ai";

function getFileName(path?: string): string | null {
  if (!path) return null;
  const name = path.split("/").filter(Boolean).pop();
  return name || null;
}

export function getToolActionLabel(toolName: string, args: any): string {
  const fileName = getFileName(args?.path);

  if (toolName === "str_replace_editor") {
    if (args?.command === "create") {
      return fileName ? `Creating ${fileName}` : "Creating file";
    }
    return fileName ? `Editing ${fileName}` : "Editing file";
  }

  if (toolName === "file_manager") {
    if (args?.command === "delete") {
      return fileName ? `Deleting ${fileName}` : "Deleting file";
    }
    if (args?.command === "rename") {
      const newName = getFileName(args?.new_path);
      if (fileName && newName) return `Renaming ${fileName} to ${newName}`;
      return "Renaming file";
    }
  }

  return toolName;
}

export function ToolInvocation({
  toolInvocation,
}: {
  toolInvocation: ToolInvocationType;
}) {
  const { toolName, args, state } = toolInvocation;
  const isComplete = state === "result";
  const label = getToolActionLabel(toolName, args);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isComplete ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
