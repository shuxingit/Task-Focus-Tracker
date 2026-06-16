import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Task, TaskFormData, Category } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getPriorityColor } from "@/utils/taskUtils";
import { useSettings } from "@/hooks/useSettings";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: TaskFormData) => void;
  task?: Task;
  categories: Category[];
  parentId?: string; // 统一参数名

  defaultCategoryId?: string;
  defaultDueDate?: Date;
  defaultIsRecurring?: boolean;
  allowRecurring?: boolean;
  defaultStartTime?: string;
  defaultEndTime?: string;
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  task,
  categories,
  parentId, // 接收统一的 parentId
  defaultCategoryId,
  defaultDueDate,
  defaultIsRecurring = false,
  allowRecurring = true,
  defaultStartTime,
  defaultEndTime,
}) => {
  const { t } = useTranslation();
  const { defaultTaskPriority, defaultTaskColor, colorPalette } = useSettings();
  
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    priority: defaultTaskPriority,
    color: defaultTaskColor,
    categoryId: "",
    parentId: parentId, // 初始化父 ID
    dueDate: undefined,
    isRecurring: allowRecurring ? defaultIsRecurring : false,
    recurrencePattern: undefined,
    customIntervalDays: undefined,
    dueOption: undefined,
    dueAfterDays: undefined,
    startOption: "today",
    startWeekday: undefined,
    startDate: undefined,
    startTime: undefined,
    endTime: undefined,
    visible: true,
    titleTemplate: undefined,
    template: false,
  });

  const defaultCategory = React.useMemo(
    () => defaultCategoryId || categories[0]?.id || "",
    [defaultCategoryId, categories],
  );

  useEffect(() => {
    if (!isOpen) return;

    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        priority: task.priority,
        color: task.color,
        categoryId: task.categoryId,
        parentId: task.parentId,
        dueDate: task.dueDate,
        isRecurring: allowRecurring ? task.isRecurring : false,
        recurrencePattern: task.recurrencePattern,
        customIntervalDays: task.customIntervalDays,
        dueOption: task.dueOption,
        dueAfterDays: task.dueAfterDays,
        startOption: task.startOption || "today",
        startWeekday: task.startWeekday,
        startDate: task.startDate,
        startTime: task.startTime,
        endTime: task.endTime,
        titleTemplate: task.titleTemplate,
        template: task.template,
        visible: task.visible !== false,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        priority: defaultTaskPriority,
        color: defaultTaskColor,
        categoryId: defaultCategory,
        parentId: parentId, // 确保新建子任务时 parentId 被填入
        dueDate: defaultDueDate,
        isRecurring: allowRecurring ? defaultIsRecurring : false,
        recurrencePattern: undefined,
        customIntervalDays: undefined,
        dueOption: undefined,
        dueAfterDays: undefined,
        startOption: "today",
        startWeekday: undefined,
        startDate: undefined,
        startTime: defaultStartTime,
        endTime: defaultEndTime,
        titleTemplate: undefined,
        template: false,
        visible: true,
      });
    }
  }, [
    isOpen,
    task,
    parentId, // 监听 parentId 变化
    defaultCategory,
    defaultDueDate,
    defaultTaskPriority,
    defaultTaskColor,
    defaultIsRecurring,
    allowRecurring,
    defaultStartTime,
    defaultEndTime,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim() && formData.categoryId) {
      onSave(formData);
      onClose();
    }
  };

  const handleChange = <K extends keyof TaskFormData>(field: K, value: TaskFormData[K]) => {
    setFormData((prev) => {
      const updated: TaskFormData = { ...prev, [field]: value };
      if (field === "recurrencePattern" && value) updated.customIntervalDays = undefined;
      if (field === "customIntervalDays" && value) updated.recurrencePattern = undefined;
      if (field === "isRecurring") {
        if (value) updated.dueDate = undefined;
        else {
          updated.dueOption = undefined;
          updated.dueAfterDays = undefined;
          updated.startOption = "today";
          updated.startWeekday = undefined;
          updated.startDate = undefined;
        }
      }
      return updated;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle>
            {task
              ? t("taskModal.editTitle")
              : parentId 
                ? "新建子任务" // 逻辑正确识别 parentId
                : t("taskModal.newTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">{t("taskModal.title")}</Label>
            <Input id="title" value={formData.title} onChange={(e) => handleChange("title", e.target.value)} required autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">{t("taskModal.priority")}</Label>
              <Select value={formData.priority} onValueChange={(v) => handleChange("priority", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 {t("taskModal.low")}</SelectItem>
                  <SelectItem value="medium">🟡 {t("taskModal.medium")}</SelectItem>
                  <SelectItem value="high">🔴 {t("taskModal.high")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">{t("taskModal.category")}</Label>
              <Select value={formData.categoryId} onValueChange={(v) => handleChange("categoryId", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 这里保留了原本丢失的周期选项 */}
          {allowRecurring && (
            <div className="space-y-3 border-t pt-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="recurring">{t("taskModal.recurring")}</Label>
                <Switch id="recurring" checked={formData.isRecurring} onCheckedChange={(v) => handleChange("isRecurring", v)} />
              </div>
              {formData.isRecurring && (
                 <div className="p-2 bg-muted/50 rounded-md space-y-2">
                   <Label>重复模式</Label>
                   <Select value={formData.recurrencePattern} onValueChange={(v) => handleChange("recurrencePattern", v as any)}>
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="daily">{t("taskModal.daily")}</SelectItem>
                       <SelectItem value="weekly">{t("taskModal.weekly")}</SelectItem>
                       <SelectItem value="monthly">{t("taskModal.monthly")}</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
            <Button type="submit">{task ? t("common.save") : t("common.create")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskModal;