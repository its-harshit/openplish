import { useRef, useState } from 'react';
import { createLogger } from '@/lib/logger';
import { getOptionalWindowBridge } from '@/lib/somehow';

const logger = createLogger('AddSkillDropdown');

export interface UseAddSkillResult {
  isGitHubDialogOpen: boolean;
  isUploadErrorDialogOpen: boolean;
  isCreateModalOpen: boolean;
  gitHubUrl: string;
  isLoading: boolean;
  error: string | null;
  uploadError: string | null;
  setIsCreateModalOpen: (open: boolean) => void;
  setIsUploadErrorDialogOpen: (open: boolean) => void;
  setGitHubUrl: (url: string) => void;
  handleUploadSkill: (onSkillAdded?: () => void) => Promise<void>;
  handleImportFromGitHub: (onSkillAdded?: () => void) => Promise<void>;
  handleBuildWithAI: () => void;
  handleOpenGitHubDialog: () => void;
  handleCloseGitHubDialog: () => void;
}

export function useAddSkill(): UseAddSkillResult {
  const isLoadingRef = useRef(false);
  const [isGitHubDialogOpen, setIsGitHubDialogOpen] = useState(false);
  const [isUploadErrorDialogOpen, setIsUploadErrorDialogOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [gitHubUrl, setGitHubUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUploadSkill = async (onSkillAdded?: () => void) => {
    const w = getOptionalWindowBridge();
    if (isLoadingRef.current || !w) {
      return;
    }
    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      setUploadError(null);
      const folderPath = await w.pickSkillFolder();
      if (!folderPath) {
        setIsLoading(false);
        return;
      }
      await w.addSkillFromFolder(folderPath);
      onSkillAdded?.();
    } catch (err) {
      logger.error('Failed to upload skill:', err);
      let errorMessage = err instanceof Error ? err.message : 'Failed to upload skill';
      const errorMatch = errorMessage.match(/Error:\s*(.+)$/);
      if (errorMatch) {
        errorMessage = errorMatch[1];
      }
      setUploadError(errorMessage);
      setIsUploadErrorDialogOpen(true);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleImportFromGitHub = async (onSkillAdded?: () => void) => {
    const normalizedGitHubUrl = gitHubUrl.trim();
    const w = getOptionalWindowBridge();
    if (isLoadingRef.current || !normalizedGitHubUrl || !w) {
      return;
    }
    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);
      await w.addSkillFromGitHub(normalizedGitHubUrl);
      setGitHubUrl('');
      setIsGitHubDialogOpen(false);
      onSkillAdded?.();
    } catch (err) {
      logger.error('Failed to import from GitHub:', err);
      setError(err instanceof Error ? err.message : 'Failed to import skill');
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleBuildWithAI = () => {
    setIsCreateModalOpen(true);
  };

  const handleOpenGitHubDialog = () => {
    setGitHubUrl('');
    setError(null);
    setIsGitHubDialogOpen(true);
  };

  const handleCloseGitHubDialog = () => {
    if (!isLoadingRef.current) {
      setIsGitHubDialogOpen(false);
      setGitHubUrl('');
      setError(null);
    }
  };

  return {
    isGitHubDialogOpen,
    isUploadErrorDialogOpen,
    isCreateModalOpen,
    gitHubUrl,
    isLoading,
    error,
    uploadError,
    setIsCreateModalOpen,
    setIsUploadErrorDialogOpen,
    setGitHubUrl,
    handleUploadSkill,
    handleImportFromGitHub,
    handleBuildWithAI,
    handleOpenGitHubDialog,
    handleCloseGitHubDialog,
  };
}
