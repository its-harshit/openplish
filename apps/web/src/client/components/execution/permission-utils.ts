export function getOperationBadgeClasses(operation?: string): string {
  switch (operation) {
    case 'delete':
      return 'bg-red-500/10 text-red-600';
    case 'overwrite':
      return 'bg-orange-500/10 text-orange-600';
    case 'modify':
      return 'bg-yellow-500/10 text-yellow-600';
    case 'create':
      return 'bg-green-500/10 text-green-600';
    case 'rename':
    case 'move':
      return 'bg-blue-500/10 text-blue-600';
    default:
      return 'bg-gray-500/10 text-gray-600';
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
