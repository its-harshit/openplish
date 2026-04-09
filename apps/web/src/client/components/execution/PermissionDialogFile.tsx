import type { PermissionRequest } from '@accomplish_ai/agent-core/common';
import { cn } from '@/lib/utils';
import {
  getDisplayFilePaths,
  getOperationBadgeClasses,
  isDeleteOperation,
} from './permission-utils';

interface PermissionDialogFileProps {
  permissionRequest: PermissionRequest;
  /** When true, show notice that only create/copy-to-new-path can be approved. */
  restrictedFilePolicy?: boolean;
}

export function PermissionDialogFile({
  permissionRequest,
  restrictedFilePolicy = false,
}: PermissionDialogFileProps) {
  const paths = getDisplayFilePaths(permissionRequest);
  const isDelete = isDeleteOperation(permissionRequest);
  const hasPaths = paths.length > 0;

  return (
    <>
      {restrictedFilePolicy && (
        <div className="mb-4 p-3 rounded-lg bg-muted border border-border">
          <p className="text-sm text-muted-foreground">
            Restricted file mode is on: you can approve creating new files or copying to paths that
            do not exist yet. Modify, overwrite, move, rename, and delete are blocked by policy
            before they reach approval.
          </p>
        </div>
      )}
      {isDelete && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">
            {hasPaths && paths.length > 1
              ? `${paths.length} files will be permanently deleted:`
              : hasPaths
                ? 'This file will be permanently deleted:'
                : 'No file paths were provided for deletion.'}
          </p>
        </div>
      )}

      {!isDelete && (
        <div className="mb-3">
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
              getOperationBadgeClasses(permissionRequest.fileOperation),
            )}
          >
            {permissionRequest.fileOperation?.toUpperCase()}
          </span>
        </div>
      )}

      <div
        className={cn(
          'mb-4 p-3 rounded-lg',
          isDelete ? 'bg-destructive/5 border border-destructive/20' : 'bg-muted',
        )}
      >
        {!hasPaths ? (
          <p className="text-sm text-muted-foreground">No file path provided.</p>
        ) : paths.length > 1 ? (
          <ul className="space-y-1">
            {paths.map((path, idx) => (
              <li
                key={idx}
                className={cn(
                  'text-sm font-mono break-all',
                  isDelete ? 'text-destructive' : 'text-foreground',
                )}
              >
                • {path}
              </li>
            ))}
          </ul>
        ) : (
          <p
            className={cn(
              'text-sm font-mono break-all',
              isDelete ? 'text-destructive' : 'text-foreground',
            )}
          >
            {paths[0]}
          </p>
        )}
        {permissionRequest.targetPath && (
          <p className="text-sm font-mono text-muted-foreground mt-1">
            → {permissionRequest.targetPath}
          </p>
        )}
      </div>

      {isDelete && (
        <p className="text-sm text-destructive/80 mb-4">This action cannot be undone.</p>
      )}

      {permissionRequest.contentPreview && (
        <details className="mb-4">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            Preview content
          </summary>
          <pre className="mt-2 p-2 rounded bg-muted text-xs overflow-x-auto max-h-32 overflow-y-auto">
            {permissionRequest.contentPreview}
          </pre>
        </details>
      )}
    </>
  );
}
