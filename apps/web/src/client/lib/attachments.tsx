import { FileCode, Image, FileText, FilePdf, File } from '@phosphor-icons/react';

export function getAttachmentIcon(type: string) {
  switch (type) {
    case 'code':
      return <FileCode className="h-4 w-4 text-info-icon" />;
    case 'image':
      return <Image className="h-4 w-4 text-purple-500" />;
    case 'text':
      return <FileText className="h-4 w-4 text-success" />;
    case 'pdf':
      return <FilePdf className="h-4 w-4 text-destructive" />;
    default:
      return <File className="h-4 w-4 text-muted-foreground" />;
  }
}
