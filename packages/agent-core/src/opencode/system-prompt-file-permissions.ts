/**
 * File permission blocks for the agent system prompt.
 * Default is create_copy_only (read + create/copy only; no modify/move/delete).
 * Set ACCOMPLISH_FILE_OPERATION_POLICY=standard (or full) for full file operations with approval prompts.
 */

import { getFileOperationPolicyMode } from '../storage/repositories/appSettings.js';

export type FileOperationPolicy = 'standard' | 'create_copy_only';

export function resolveFileOperationPolicyFromEnv(): FileOperationPolicy {
  const raw = process.env.ACCOMPLISH_FILE_OPERATION_POLICY?.trim().toLowerCase();
  if (raw === 'standard' || raw === 'full') {
    return 'standard';
  }
  return 'create_copy_only';
}

/** Combines SQLite app_settings (when inherit) with env; explicit modes override env. */
export function resolveEffectiveFileOperationPolicy(): FileOperationPolicy {
  try {
    const mode = getFileOperationPolicyMode();
    if (mode === 'standard') {
      return 'standard';
    }
    if (mode === 'create_copy_only') {
      return 'create_copy_only';
    }
    return resolveFileOperationPolicyFromEnv();
  } catch {
    return resolveFileOperationPolicyFromEnv();
  }
}

export function getFilePermissionSection(): string {
  return resolveEffectiveFileOperationPolicy() === 'create_copy_only'
    ? FILE_PERMISSION_SECTION_CREATE_COPY_ONLY
    : FILE_PERMISSION_SECTION_STANDARD;
}

export const FILE_PERMISSION_SECTION_STANDARD = `<important name="filesystem-rules">
##############################################################################
# CRITICAL: FILE PERMISSION WORKFLOW - NEVER SKIP
##############################################################################

BEFORE using Write, Edit, Bash (with file ops), or ANY tool that touches files:
1. FIRST: Call request_file_permission tool and wait for response
2. ONLY IF response is "allowed": Proceed with the file operation
3. IF "denied": Stop and inform the user

WRONG (never do this):
  Write({ path: "/tmp/file.txt", content: "..." })  ← NO! Permission not requested!

CORRECT (always do this):
  request_file_permission({ operation: "create", filePath: "/tmp/file.txt" })
  → Wait for "allowed"
  Write({ path: "/tmp/file.txt", content: "..." })  ← OK after permission granted

This applies to ALL file operations:
- Creating files (Write tool, bash echo/cat, scripts that output files)
- Renaming files (bash mv, rename commands)
- Deleting files (bash rm, delete commands)
- Modifying files (Edit tool, bash sed/awk, any content changes)
##############################################################################
</important>

<tool name="request_file_permission">
Use this MCP tool to request user permission before performing file operations.

<parameters>
Input:
{
  "operation": "create" | "delete" | "rename" | "move" | "modify" | "overwrite",
  "filePath": "/absolute/path/to/file",
  "filePaths": ["/absolute/path/to/file"],
  "targetPath": "/new/path",
  "contentPreview": "file content"
}

Operations:
- create: Creating a new file
- delete: Deleting an existing file or folder
- rename: Renaming a file (provide targetPath)
- move: Moving a file to different location (provide targetPath)
- modify: Modifying existing file content
- overwrite: Replacing entire file content

Returns: "allowed" or "denied" - proceed only if allowed
</parameters>

<example>
request_file_permission({
  operation: "create",
  filePath: "/Users/john/Desktop/report.txt"
})
// Wait for response, then proceed only if "allowed"
</example>
</tool>`;

export const FILE_PERMISSION_SECTION_CREATE_COPY_ONLY = `<important name="filesystem-rules">
##############################################################################
# CRITICAL: FILE PERMISSION WORKFLOW - NEVER SKIP
##############################################################################

This build is running in a restricted filesystem mode:
- Allowed: reading files; creating NEW files; copying files to NEW destination paths
- Not allowed: modifying existing files; overwriting; moving; renaming; deleting

BEFORE using Write, Edit, Bash (with file ops), or ANY tool that touches files:
1. FIRST: Call request_file_permission tool and wait for response
2. ONLY IF response is "allowed": Proceed with the file operation
3. IF "denied": Stop and inform the user

WRONG (never do this):
  Write({ path: "/tmp/file.txt", content: "..." })  ← NO! Permission not requested!

CORRECT (always do this):
  request_file_permission({ operation: "create", filePath: "/tmp/file.txt" })
  → Wait for "allowed"
  Write({ path: "/tmp/file.txt", content: "..." })  ← OK after permission granted

Copy example (always request permission first; destination must be NEW):
  request_file_permission({
    operation: "create",
    filePaths: ["/tmp/source.txt"],
    targetPath: "/tmp/copied.txt"
  })
  → Wait for "allowed"
  // then run the copy operation

This applies to ALL file operations:
- Creating files (Write tool, bash echo/cat, scripts that output files)
- Renaming files (bash mv, rename commands)
- Deleting files (bash rm, delete commands)
- Modifying files (Edit tool, bash sed/awk, any content changes)
##############################################################################
</important>

<tool name="request_file_permission">
Use this MCP tool to request user permission before performing file operations.

<parameters>
Input:
{
  "operation": "create" | "delete" | "rename" | "move" | "modify" | "overwrite",
  "filePath": "/absolute/path/to/file",
  "filePaths": ["/absolute/path/to/file"],
  "targetPath": "/new/path",
  "contentPreview": "file content"
}

Operations:
- create: Creating a new file
- create (copy): Copy one or more source files (filePaths) to a NEW destination (targetPath)
- delete: Deleting an existing file or folder
- rename: Renaming a file (provide targetPath)
- move: Moving a file to different location (provide targetPath)
- modify: Modifying existing file content
- overwrite: Replacing entire file content

Returns: "allowed" or "denied" - proceed only if allowed
</parameters>

<example>
request_file_permission({
  operation: "create",
  filePath: "/Users/john/Desktop/report.txt"
})
// Wait for response, then proceed only if "allowed"
</example>
</tool>`;
