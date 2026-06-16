import { useToast } from "@/hooks/use-toast";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Task } from "@/types";
import {
  calculateTaskCompletion,
  getTaskProgress,
  getPriorityColors,
} from "@/utils/taskUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSettings } from "@/hooks/useSettings";
import {
  isColorDark,
  adjustColor,
  complementaryColor,
  hslToHex,
} from "@/utils/color";
import {
  Edit,
  Trash2,
  Plus,
  FolderOpen,
  Settings,
  ChevronDown,
  ChevronRight,
  Star,
  StarOff,
  Calendar as CalendarIcon,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import { useTaskStore } from "@/hooks/useTaskStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onAddSubtask: (parentTask: Task) => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onViewDetails: (task: Task) => void;
  onReset: (taskId: string) => void;
  depth?: number;
  parentPathTitles?: string[];
  showSubtasks?: boolean;
  isGrid?: boolean;
  selectMode?: boolean;
  selected?: boolean;
  onSelectChange?: (checked: boolean) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onAddSubtask,
  onToggleComplete,
  onViewDetails,
  onReset,
  depth = 0,
  parentPathTitles = [],
  showSubtasks = true,
  isGrid = false,
  selectMode = false,
  selected = false,
  onSelectChange,
}) => {
  const isCompleted = calculateTaskCompletion(task);
  const progress = getTaskProgress(task);
  const progressPercentage =
    progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
  const priorityColors = getPriorityColors(task.priority);
  const { updateTask } = useTaskStore();
  const { t, i18n } = useTranslation();
  const { colorPalette, theme, collapseSubtasksByDefault } = useSettings();

  const [collapsed, setCollapsed] = useState(collapseSubtasksByDefault);
  const { toast } = useToast();

  React.useEffect(() => {
    setCollapsed(collapseSubtasksByDefault);
  }, [collapseSubtasksByDefault]);

  const baseColor = colorPalette[task.color] ?? colorPalette[0];
  const depthOffset = depth * 8;
  const displayColor =
    depth > 0
      ? adjustColor(
          baseColor,
          isColorDark(baseColor) ? depthOffset : -depthOffset,
        )
      : baseColor;
  const headerTextColor = complementaryColor(displayColor);
  const cardHex = hslToHex(theme.card);
  const progressBg = isColorDark(cardHex)
    ? adjustColor(cardHex, 50)
    : adjustColor(cardHex, -20);
  const progressColor = complementaryColor(cardHex);

  const isOverdue = React.useMemo(() => {
    if (!task.dueDate || task.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(task.dueDate) < today;
  }, [task.dueDate, task.completed]);

  const handleTogglePinned = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTask(task.id, { pinned: !task.pinned });
  };

  const handleToggleComplete = async () => {
    if (!task.subtasks || task.subtasks.length === 0) {
      const newStatus = !task.completed;
      await onToggleComplete(task.id, newStatus);

      toast({
        title: newStatus ? "任务已完成" : "任务已还原",
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={async () => {
              await onToggleComplete(task.id, !newStatus);
            }}
          >
            撤销
          </Button>
        ),
      });
    }
  };

  const [subtaskCollapse, setSubtaskCollapse] = useState<Record<string, boolean>>({});

  const toggleSubtaskCollapse = (id: string) =>
    setSubtaskCollapse((prev) => ({ ...prev, [id]: !prev[id] }));

  const renderSubtask = (st: Task, level: number) => {
    const done = calculateTaskCompletion(st);
    const subProgress = getTaskProgress(st);
    const subPercentage = subProgress.total > 0 ? (subProgress.completed / subProgress.total) * 100 : 0;

    return (
      <div key={st.id} className="pl-4 border-l space-y-1" style={{ marginLeft: level * 16 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {st.subtasks.length === 0 ? (
              /* 如果是模板，不显示勾选框 */
              !st.template && (
                <input
                  type="checkbox"
                  checked={st.completed}
                  onChange={() => onToggleComplete(st.id, !st.completed)}
                  className="h-4 w-4 rounded-full border-gray-300 text-primary"
                />
              )
            ) : (
              <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={() => toggleSubtaskCollapse(st.id)}>
                {subtaskCollapse[st.id] ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
            <span className={`text-sm break-words ${done ? "line-through text-muted-foreground" : ""}`}>
              {st.title}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5 p-0"><Settings className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background z-50">
              <DropdownMenuItem onClick={() => onViewDetails(st)}><FolderOpen className="h-4 w-4 mr-2" />{t("taskCard.viewDetails")}</DropdownMenuItem>
              
              {/* 【修复点 1】如果是子任务模板，隐藏添加子任务按钮 */}
              {!st.template && (
                <DropdownMenuItem onClick={() => onAddSubtask(st)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("taskCard.addSubtask")}
                </DropdownMenuItem>
              )}

              <DropdownMenuItem onClick={() => onEdit(st)}><Edit className="h-4 w-4 mr-2" />{t("common.edit")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onReset(st.id)}><RotateCcw className="h-4 w-4 mr-2" />{t("taskCard.reset")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(st.id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />{t("common.delete")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  return (
    <Card className={`${isGrid ? "h-full flex flex-col" : "mb-3 sm:mb-4"} rounded-xl ${depth > 0 ? "ml-3 sm:ml-6" : ""}`} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
      <div className="rounded-t-xl px-4 py-2 flex items-center justify-between" style={{ backgroundColor: displayColor, color: headerTextColor }}>
        <div className="flex items-center gap-2 min-w-0">
          {selectMode ? (
            <input type="checkbox" checked={selected} onChange={(e) => onSelectChange?.(e.target.checked)} className="h-4 w-4" />
          ) : (
            /* 【修复点 2】如果是主任务模板，隐藏左侧主勾选框 */
            !task.template && task.subtasks.length === 0 && (
              <input type="checkbox" checked={task.completed} onChange={handleToggleComplete} className="h-4 w-4 rounded-full border-gray-300 text-primary" />
            )
          )}
          <h3 className={`font-semibold cursor-pointer text-sm sm:text-base break-words ${isCompleted ? "line-through opacity-70" : ""}`} onClick={() => onViewDetails(task)}>
            {task.title}
          </h3>
        </div>
        {!selectMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Settings className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background z-50">
              <DropdownMenuItem onClick={handleTogglePinned}>
                {task.pinned ? <Star className="h-4 w-4 mr-2" /> : <StarOff className="h-4 w-4 mr-2" />}
                {task.pinned ? t("taskDetail.unpin") : t("taskDetail.pin")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewDetails(task)}><FolderOpen className="h-4 w-4 mr-2" />{t("taskCard.viewDetails")}</DropdownMenuItem>
              
              {/* 【修复点 3】主卡片菜单：如果是模板，隐藏“添加子任务” */}
              {!task.template && (
                <DropdownMenuItem onClick={() => onAddSubtask(task)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("taskCard.addSubtask")}
                </DropdownMenuItem>
              )}

              <DropdownMenuItem onClick={() => onEdit(task)}><Edit className="h-4 w-4 mr-2" />{t("common.edit")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onReset(task.id)}><RotateCcw className="h-4 w-4 mr-2" />{t("taskCard.reset")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />{t("common.delete")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {(task.description || (showSubtasks && task.subtasks.length > 0)) && (
        <CardContent className={`pt-3 ${isGrid ? "flex-1" : ""}`}>
          {task.description && <p className="text-sm text-muted-foreground mb-3 break-words">{task.description}</p>}
          {showSubtasks && task.subtasks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium">{t("taskCard.progress", { completed: progress.completed, total: progress.total })}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs sm:text-sm text-muted-foreground">{Math.round(progressPercentage)}%</span>
                  <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="h-6 w-6 p-0">
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Progress value={progressPercentage} className="h-2" backgroundColor={progressBg} indicatorColor={progressColor} />
              {!collapsed && <div className="space-y-2 mt-2">{task.subtasks.map((st) => renderSubtask(st, 1))}</div>}
            </div>
          )}
        </CardContent>
      )}

      <div className="border-t px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          {task.dueDate && (
            <>
              <CalendarIcon className="h-4 w-4" />
              <span style={{ color: isOverdue ? "hsl(var(--task-overdue))" : undefined }}>
                {new Date(task.dueDate).toLocaleDateString(i18n.language, { month: "short", day: "numeric" })}
              </span>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-2 py-0.5">{t(`kanban.${task.status}`)}</Badge>
          <Badge className="px-2 py-0.5" style={{ backgroundColor: priorityColors.bg, color: priorityColors.fg }}>
            {t(`taskModal.${task.priority}`)}
          </Badge>
        </div>
      </div>
    </Card>
  );
};

export default TaskCard;