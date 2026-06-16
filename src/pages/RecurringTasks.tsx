import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import TaskModal from "@/components/TaskModal";
import TaskCard from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { useTaskStore } from "@/hooks/useTaskStore";
import { Task, TaskFormData } from "@/types";

const RecurringTasksPage = () => {
  const {
    recurring,
    categories,
    addRecurringTask,
    updateRecurringTask,
    deleteRecurringTask,
  } = useTaskStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useTranslation();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);

  // 【核心修复】：只筛选出没有父 ID 的任务作为顶层显示，防止子任务变同级
  const rootRecurring = recurring.filter(t => !t.parentId);

  const handleSave = (data: TaskFormData) => {
    if (editingTask) {
      updateRecurringTask(editingTask.id, data);
    } else {
      addRecurringTask({ 
        ...data, 
        isRecurring: true, 
        template: true,
        parentId: parentTask?.id || undefined,
        completed: false,
        status: "todo",
        order: 0
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setParentTask(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar title={t("navbar.recurring")} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex justify-end mb-4">
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> {t("recurring.template")}
          </Button>
        </div>
        
        {rootRecurring.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("recurring.none")}</p>
        ) : (
          <div className="space-y-2">
            {rootRecurring.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                parentPathTitles={[]}
                showSubtasks={true} // 开启嵌套显示
                onEdit={() => {
                  setEditingTask(t);
                  setIsModalOpen(true);
                }}
                onDelete={() => deleteRecurringTask(t.id)}
                onAddSubtask={(p) => {
                  setParentTask(p);
                  setIsModalOpen(true);
                }}
                onToggleComplete={() => {}}
                onViewDetails={() => {}}
                onReset={() => {}}
              />
            ))}
          </div>
        )}
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        task={editingTask || undefined}
        parentId={parentTask?.id} // 统一使用 parentId
        categories={categories}
        defaultIsRecurring
      />
    </div>
  );
};

export default RecurringTasksPage;