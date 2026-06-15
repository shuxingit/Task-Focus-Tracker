import InterruptionAnalysis from "@/components/InterruptionAnalysis";
import React, { useState } from "react";
import { usePomodoroHistory } from "@/hooks/usePomodoroHistory.tsx";
import Navbar from "@/components/Navbar";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PomodoroSession } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

const toLocalISOString = (timestamp: number) => {
  const d = new Date(timestamp);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
};

const fromLocalISOString = (s: string) => {
  const d = new Date(s);
  return d.getTime();
};

const PomodoroHistoryPage: React.FC = () => {
  const { sessions, updateSession, deleteSession, addSession } =
    usePomodoroHistory();
  const { t } = useTranslation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSession, setNewSession] = useState<{
    start: string;
    end: string;
    type: "work" | "break";
    reason: string;
  }>({
    start: toLocalISOString(Date.now()),
    end: toLocalISOString(Date.now() + 25 * 60000),
    type: "work",
    reason: "",
  });

  const handleChange = (
    index: number,
    field: keyof PomodoroSession,
    value: string | number,
  ) => {
    let val = value;
    if (field === "start" || field === "end") {
      if (typeof value === "string") val = fromLocalISOString(value);
    }
    updateSession(index, { [field]: val } as Partial<PomodoroSession>);
  };

  const handleCreate = () => {
    addSession(
      fromLocalISOString(newSession.start),
      fromLocalISOString(newSession.end),
      newSession.type,
      newSession.reason.trim() || undefined
    );
    setNewSession({
      ...newSession,
      reason: "",
    });
    setIsAddOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar title={t("pomodoroSessions.title")} />
      
      <div className="flex-grow p-4 md:p-8 flex flex-col items-center">
        {/* 顶部：数据分析可视化模块 (方案三) */}
        <div className="w-full max-w-4xl mb-8">
          <InterruptionAnalysis />
        </div>

        {/* 中间：功能操作区 */}
        <div className="w-full max-w-4xl mb-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{t("pomodoroSessions.historyLabel", "详细记录")}</h2>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("pomodoroSessions.add", "添加记录")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {t("pomodoroSessions.addTitle", "添加新专注记录")}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("pomodoroSessions.type")}</label>
                  <Select
                    value={newSession.type}
                    onValueChange={(v) =>
                      setNewSession({ ...newSession, type: v as "work" | "break" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="work">{t("pomodoroTimer.workLabel")}</SelectItem>
                      <SelectItem value="break">{t("pomodoroTimer.breakLabel")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("pomodoroSessions.start")}</label>
                  <Input
                    type="datetime-local"
                    value={newSession.start}
                    onChange={(e) => setNewSession({ ...newSession, start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("pomodoroSessions.end")}</label>
                  <Input
                    type="datetime-local"
                    value={newSession.end}
                    onChange={(e) => setNewSession({ ...newSession, end: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("pomodoroTimer.quitReasonLabel")}</label>
                  <Input
                    placeholder={t("pomodoroTimer.quitReasonPlaceholder")}
                    value={newSession.reason}
                    onChange={(e) => setNewSession({ ...newSession, reason: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreate} className="w-full">
                  {t("common.save")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 底部：详细记录列表表格 */}
        {sessions.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">{t("pomodoroSessions.none")}</p>
          </div>
        ) : (
          <div className="w-full max-w-4xl bg-card rounded-xl border shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-semibold w-24">{t("pomodoroSessions.type")}</th>
                  <th className="text-left p-4 font-semibold w-48">{t("pomodoroSessions.start")}</th>
                  <th className="text-left p-4 font-semibold w-48">{t("pomodoroSessions.end")}</th>
                  <th className="text-left p-4 font-semibold">{t("pomodoroTimer.quitReasonLabel")}</th>
                  <th className="p-4 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sessions.slice().reverse().map((s, i) => {
                  // 因为用了 reverse()，原始索引需要转换
                  const originalIndex = sessions.length - 1 - i;
                  return (
                    <tr key={originalIndex} className="hover:bg-muted/5 transition-colors">
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          s.type === 'work' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {s.type === 'work' ? t("pomodoroTimer.workLabel") : t("pomodoroTimer.breakLabel")}
                        </span>
                      </td>
                      <td className="p-3">
                        <Input
                          type="datetime-local"
                          className="h-8 text-xs border-transparent hover:border-input focus:border-input"
                          value={toLocalISOString(s.start)}
                          onChange={(e) => handleChange(originalIndex, "start", e.target.value)}
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="datetime-local"
                          className="h-8 text-xs border-transparent hover:border-input focus:border-input"
                          value={toLocalISOString(s.end)}
                          onChange={(e) => handleChange(originalIndex, "end", e.target.value)}
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          placeholder="-"
                          className={`h-8 text-xs border-transparent hover:border-input focus:border-input ${s.reason ? 'text-red-500 font-medium' : ''}`}
                          value={s.reason || ""}
                          onChange={(e) => handleChange(originalIndex, "reason", e.target.value)}
                        />
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteSession(originalIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PomodoroHistoryPage;