'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTaskStore } from '@/stores/taskStore';
import { getAccomplish } from '@/lib/accomplish';
import { staggerContainer } from '@/lib/animations';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ConversationListItem from './ConversationListItem';
import SettingsDialog from './SettingsDialog';
import type { SettingsTabId } from './settings-tabs';
import WorkspaceSelector from './WorkspaceSelector';
import { Gear, ChatText, MagnifyingGlass } from '@phosphor-icons/react';
import { DaemonStatusDot } from '@/components/DaemonStatusDot';
import { BrandedLogo } from '@/components/layout/BrandedLogo';

export default function Sidebar() {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTabId>('providers');
  const { tasks, loadTasks, updateTaskStatus, addTaskUpdate, openLauncher } = useTaskStore();
  const accomplish = getAccomplish();
  const { t } = useTranslation('sidebar');

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Subscribe to task status changes (queued -> running) and task updates (complete/error)
  // This ensures sidebar always reflects current task status
  useEffect(() => {
    const unsubscribeStatusChange = accomplish.onTaskStatusChange?.((data) => {
      updateTaskStatus(data.taskId, data.status);
    });

    const unsubscribeTaskUpdate = accomplish.onTaskUpdate((event) => {
      addTaskUpdate(event);
    });

    return () => {
      unsubscribeStatusChange?.();
      unsubscribeTaskUpdate();
    };
  }, [updateTaskStatus, addTaskUpdate, accomplish]);

  const handleNewConversation = () => {
    navigate('/');
  };

  return (
    <>
      <div className="flex h-screen w-[280px] flex-col border-r border-sidebar-border bg-sidebar pt-12 text-sidebar-foreground shadow-[inset_-3px_0_0_0_hsl(var(--sidebar-primary)/0.14)]">
        {/* Workspace Selector */}
        <div className="px-3 pt-3 pb-1">
          <WorkspaceSelector
            onManageWorkspaces={() => {
              setSettingsInitialTab('workspaces');
              setShowSettings(true);
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="px-3 py-3 border-b border-sidebar-border flex gap-2">
          <Button
            data-testid="sidebar-new-task-button"
            onClick={handleNewConversation}
            variant="default"
            size="sm"
            className="flex-1 justify-center gap-2 shadow-sm shadow-primary/25"
            title={t('newTask')}
          >
            <ChatText className="h-4 w-4" />
            {t('newTask')}
          </Button>
          <Button
            onClick={openLauncher}
            variant="outline"
            size="sm"
            className="px-2 border-border bg-card text-foreground hover:bg-sidebar-accent hover:text-foreground"
            title={t('searchTasks')}
          >
            <MagnifyingGlass className="h-4 w-4" />
          </Button>
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            <AnimatePresence mode="wait">
              {tasks.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-3 py-8 text-center text-sm text-muted-foreground"
                >
                  {t('noConversations')}
                </motion.div>
              ) : (
                <motion.div
                  key="task-list"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="space-y-1"
                >
                  {tasks.map((task) => (
                    <ConversationListItem key={task.id} task={task} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Bottom Section - Logo and Settings */}
        <div className="px-3 py-4 border-t border-sidebar-border flex items-center justify-between gap-2">
          <BrandedLogo className="pl-1.5 flex-1" />

          {/* Settings Button + Daemon Status - Bottom Right */}
          <div className="flex items-center gap-2">
            <DaemonStatusDot />
            <Button
              data-testid="sidebar-settings-button"
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => {
                setSettingsInitialTab('providers');
                setShowSettings(true);
              }}
              title={t('settings')}
            >
              <Gear className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        initialTab={settingsInitialTab}
      />
    </>
  );
}
