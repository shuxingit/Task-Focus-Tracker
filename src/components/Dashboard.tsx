import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Task, Category, TaskFormData, CategoryFormData } from "@/types";
import { useTaskStore } from "@/hooks/useTaskStore";
import { useCurrentCategory } from "@/hooks/useCurrentCategory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/hooks/useSettings";
import { calculateTaskCompletion } from "@/utils/taskUtils";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  ArrowLeft,
  SlidersHorizontal,
} from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import CategoryCard from "./CategoryCard";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";
import CategoryModal from "./CategoryModal";
import TaskFilterSheet from "./TaskFilterSheet";
import CategoryFilterSheet from "./CategoryFilterSheet";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import ConfirmDialog from "./ConfirmDialog";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Navbar from "./Navbar";
import { usePomodoroStore } from "@/stores/pomodoro";

// --- Sortable 包装组件 ---
const SortableCategory: React.FC<{ category: Category; children: React.ReactNode }> = ({ category, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return <div ref={setNodeRef} style={style} {...attributes} {...listeners}>{children}</div>;
};

const SortableTask: React.FC<{ task: Task; children: React.ReactNode }> = ({ task, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return <div ref={setNodeRef} style={style} {...attributes} {...listeners}>{children}</div>;
};

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    tasks, categories, addTask, updateTask, deleteTask, addCategory,
    updateCategory, deleteCategory, getTasksByCategory, findTaskById,
    reorderCategories, reorderTasks, undoDeleteCategory, resetTask, resetCategoryTasks,
  } = useTaskStore();

  const { setCurrentCategoryId } = useCurrentCategory();
  const { colorPalette, defaultTaskLayout, showCompletedByDefault, enableBatchTasks } = useSettings();

  // 状态管理
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [viewMode, setViewMode] = useState<"categories" | "tasks">("categories");
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortCriteria, setSortCriteria] = useState<string>(searchParams.get("sort") || "order");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterColor, setFilterColor] = useState<string>("all");
  const [categoryFilterColor, setCategoryFilterColor] = useState<string>("all");
  const [taskLayout, setTaskLayout] = useState<"list" | "grid">(defaultTaskLayout);
  const [showCompleted, setShowCompleted] = useState<boolean>(showCompletedByDefault);
  const [showHidden, setShowHidden] = useState<boolean>(false);

  // Modal/Dialog 状态
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isCategoryFilterSheetOpen, setIsCategoryFilterSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [batchDeleteIds, setBatchDeleteIds] = useState<string[] | null>(null);

  // --- 初始化逻辑 ---
  useEffect(() => {
    const catId = searchParams.get("categoryId");
    if (catId) {
      const cat = categories.find((c) => c.id === catId);
      if (cat) { setSelectedCategory(cat); setCurrentCategoryId(cat.id); setViewMode("tasks"); }
    }
  }, [searchParams, categories]);

  const sortedCategories = useMemo(() => {
    return categories.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (categoryFilterColor === "all" || c.color === Number(categoryFilterColor))
    ).sort((a, b) => a.order - b.order);
  }, [categories, searchTerm, categoryFilterColor]);

  const filteredTasks = useMemo(() => {
    if (!selectedCategory) return [];
    return getTasksByCategory(selectedCategory.id).filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = filterPriority === "all" || t.priority === filterPriority;
      const matchesCompleted = showCompleted || !calculateTaskCompletion(t);
      return matchesSearch && matchesPriority && matchesCompleted;
    });
  }, [selectedCategory, tasks, searchTerm, filterPriority, showCompleted]);

  // --- 事件处理器 (Handlers) ---
  const handleCreateTask = (taskData: TaskFormData) => {
    addTask({ ...taskData, completed: false, status: "todo", order: tasks.length, visible: true });
    toast({ title: t("task.created"), description: t("dashboard.taskCreatedDesc", { title: taskData.title }) });
    setIsTaskModalOpen(false);
  };

  const handleUpdateTask = (taskData: TaskFormData) => {
    if (editingTask) {
      updateTask(editingTask.id, { ...taskData });
      setEditingTask(null);
      setIsTaskModalOpen(false);
    }
  };

  const handleToggleTaskComplete = (taskId: string, completed: boolean) => {
    updateTask(taskId, { completed, status: completed ? "done" : "todo", visible: !completed });
  };

  const handleCreateCategory = (categoryData: CategoryFormData) => {
    addCategory({ ...categoryData, pinned: false, order: categories.length, description: categoryData.description || "" });
    setIsCategoryModalOpen(false);
  };

  const handleViewTaskDetails = (task: Task) => {
    navigate(`/tasks/${task.id}?categoryId=${selectedCategory?.id || task.categoryId}`);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setCurrentCategoryId(null);
    setViewMode("categories");
    setSearchParams({});
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        category={selectedCategory ? { name: selectedCategory.name, color: String(selectedCategory.color) } : undefined}
        onHomeClick={handleBackToCategories}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 工具栏 */}
        <div className="flex items-center gap-2 mb-6">
          <Input placeholder={t("dashboard.search")} className="max-w-xs" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <Button onClick={() => viewMode === "categories" ? setIsCategoryModalOpen(true) : setIsTaskModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {viewMode === "categories" ? t("taskModal.category") : t("taskModal.newTitle")}
          </Button>
        </div>

        {viewMode === "categories" ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({active, over}) => {
            if (over && active.id !== over.id) {
              reorderCategories(categories.findIndex(c => c.id === active.id), categories.findIndex(c => c.id === over.id));
            }
          }}>
            <SortableContext items={sortedCategories.map(c => c.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedCategories.map((category) => (
                  <SortableCategory key={category.id} category={category}>
                    <CategoryCard
                      category={category}
                      tasks={getTasksByCategory(category.id)}
                      onViewTasks={(cat) => { setSelectedCategory(cat); setViewMode("tasks"); }}
                      onEdit={(cat) => { setEditingCategory(cat); setIsCategoryModalOpen(true); }}
                      onDelete={(id) => setDeleteCategoryId(id)}
                      onTogglePinned={(id, pinned) => updateCategory(id, { pinned })}
                      onReset={(id) => resetCategoryTasks(id)}
                    />
                  </SortableCategory>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div>
            <Button variant="ghost" onClick={handleBackToCategories} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> {t("common.back")}
            </Button>
            <div className={taskLayout === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
              {filteredTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  // 补全 TaskCard 缺失的所有 props
                  onEdit={(t) => { setEditingTask(t); setIsTaskModalOpen(true); }}
                  onDelete={(id) => setDeleteTaskId(id)}
                  onToggleComplete={handleToggleTaskComplete}
                  onAddSubtask={(t) => { setParentTask(t); setIsTaskModalOpen(true); }}
                  onViewDetails={handleViewTaskDetails}
                  onReset={(id) => resetTask(id)}
                  isGrid={taskLayout === "grid"}
                  selectMode={selectionMode}
                  selected={selectedTaskIds.includes(task.id)}
                  onSelectChange={(checked) => setSelectedTaskIds(prev => checked ? [...prev, task.id] : prev.filter(id => id !== task.id))}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); setParentTask(null); }}
        onSave={editingTask ? handleUpdateTask : handleCreateTask}
        task={editingTask || undefined}
        categories={categories}
        parentId={parentTask?.id}
        defaultCategoryId={selectedCategory?.id}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }}
        onSave={editingCategory ? (data) => updateCategory(editingCategory.id, data) : handleCreateCategory}
        category={editingCategory || undefined}
      />

      {/* 修复 ConfirmDialog 缺失 confirmText/cancelText 的报错 */}
      <ConfirmDialog
        open={!!deleteTaskId}
        onOpenChange={(open) => !open && setDeleteTaskId(null)}
        title={t("task.deleteConfirmTitle")}
        onConfirm={() => { if (deleteTaskId) { deleteTask(deleteTaskId); setDeleteTaskId(null); } }}
        confirmText={t("common.delete")}  // 必须传
        cancelText={t("common.cancel")}    // 必须传
      />

      <ConfirmDialog
        open={!!deleteCategoryId}
        onOpenChange={(open) => !open && setDeleteCategoryId(null)}
        title={t("category.deleteConfirmTitle")}
        onConfirm={() => { if (deleteCategoryId) { deleteCategory(deleteCategoryId); setDeleteCategoryId(null); } }}
        confirmText={t("common.delete")}  // 必须传
        cancelText={t("common.cancel")}    // 必须传
      />
    </div>
  );
};

export default Dashboard;