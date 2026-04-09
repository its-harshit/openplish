export function getOperationBadgeClasses(operation?: string): string {
  switch (operation) {
    case 'delete':
      return 'bg-destructive/10 text-destructive';
    case 'overwrite':
      return 'bg-warning/10 text-warning';
    case 'modify':
      return 'bg-warning/10 text-warning';
    case 'create':
      return 'bg-success/10 text-success';
    case 'rename':
    case 'move':
      return 'bg-primary/10 text-primary';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function isDeleteOperation(request: { type: string; fileOperation?: string }): boolean {
  return request.type === 'file' && request.fileOperation === 'delete';
}

const FILE_OPS_BLOCKED_IN_CREATE_COPY_ONLY = [
  'delete',
  'move',
  'rename',
  'modify',
  'overwrite',
] as const;

export function isFileOperationBlockedByPolicy(
  request: { type: string; fileOperation?: string },
  policy: 'standard' | 'create_copy_only',
): boolean {
  if (policy !== 'create_copy_only' || request.type !== 'file') {
    return false;
  }
  const op = request.fileOperation;
  if (!op) {
    return false;
  }
  return (FILE_OPS_BLOCKED_IN_CREATE_COPY_ONLY as readonly string[]).includes(op);
}

export function getDisplayFilePaths(request: {
  filePath?: string;
  filePaths?: string[];
}): string[] {
  if (request.filePaths && request.filePaths.length > 0) {
    return request.filePaths;
  }
  if (request.filePath) {
    return [request.filePath];
  }
  return [];
}
