import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactDOM from "react-dom/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePomodoroStore } from "@/stores/pomodoro";
import { useSettings, SettingsProvider } from "@/hooks/useSettings";
import { hslToHex, hexToHsl, complementaryColor } from "@/utils/color";
import { playSound } from "@/utils/sounds";
import {
  usePomodoroHistory,
  PomodoroHistoryProvider,
} from "@/hooks/usePomodoroHistory.tsx";
import { useToast } from "@/components/ui/use-toast";
import { Maximize2, Coffee, Target, Timer } from "lucide-react"; 
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// 格式化时间：确保始终是 00:00 格式
const formatTime = (sec: number) => {
  const m = Math.floor(Math.max(0, sec) / 60).toString().padStart(2, "0");
  const s = Math.floor(Math.max(0, sec) % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

// 格式化输入框数字：确保显示为 01, 05 等
const formatInputValue = (val: number) => {
  return val.toString().padStart(2, "0");
};

interface PomodoroTimerProps {
  compact?: boolean;
  size?: number;
  floating?: boolean; 
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  compact,
  size = 80,
  floating = false, 
}) => {
  const {
    isRunning,
    isPaused,
    remainingTime: storeRemainingTime,
    mode,
    start,
    pause,
    resume,
    reset,
    startBreak,
    skipBreak,
    workDuration,
    breakDuration,
    setDurations,
    setStartTime,
    startTime: storeStartTime,
    endTime,
  } = usePomodoroStore();

  const { pomodoro, updatePomodoro, theme } = useSettings();
  const { addSession } = usePomodoroHistory();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [quitReason, setQuitReason] = useState("");
  const [smoothRemaining, setSmoothRemaining] = useState(storeRemainingTime);
  const [smoothProgress, setSmoothProgress] = useState(0);

  const isPiPContext = typeof window !== 'undefined' && window.innerHeight < 400;

  // 【修复 1】：同步时长设置，强制 Number 转换防止字符串拼接
  useEffect(() => {
    const wMin = Number(pomodoro.workMinutes) || 1;
    const bMin = Number(pomodoro.breakMinutes) || 1;
    
    setDurations(wMin * 60, bMin * 60);

    if (!isRunning) {
      reset(); // 计时器没跑时，数字立即随输入框变动
    }
  }, [pomodoro.workMinutes, pomodoro.breakMinutes, isRunning, setDurations, reset]);

  // 动画逻辑
  useEffect(() => {
    if (!isRunning || isPaused || !endTime) {
      setSmoothRemaining(storeRemainingTime);
      const total = mode === "work" ? workDuration : breakDuration;
      setSmoothProgress(total > 0 ? storeRemainingTime / total : 0);
      return;
    }
    let animationFrameId: number;
    const animate = () => {
      const msRemaining = Math.max(0, endTime - Date.now());
      const total = mode === "work" ? workDuration : breakDuration;
      setSmoothRemaining(Math.ceil(msRemaining / 1000));
      setSmoothProgress(msRemaining / (total * 1000));
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning, isPaused, endTime, mode, workDuration, breakDuration, storeRemainingTime]);

  const justResetData = (reason?: string) => {
    if (storeStartTime) addSession(storeStartTime, Date.now(), mode, reason);
    setStartTime(undefined);
    reset();
    setIsReasonModalOpen(false);
    setQuitReason("");
  };

  const handleStopClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === "work" && smoothRemaining > 0) setIsReasonModalOpen(true);
    else justResetData();
  };

  const openFloatingWindow = async () => {
    try {
      const w = window as any;
      if (!w.documentPictureInPicture) return;
      const pip = await w.documentPictureInPicture.requestWindow({ width: 250, height: 250 });
      pip.document.title = "日程专注系统";
      Array.from(document.styleSheets).forEach((s) => {
        try {
          const style = pip.document.createElement("style");
          style.textContent = Array.from(s.cssRules).map(r => (r as CSSRule).cssText).join("");
          pip.document.head.appendChild(style);
        } catch {}
      });
      const container = pip.document.createElement("div");
      pip.document.body.appendChild(container);
      pip.document.body.className = document.documentElement.className;
      ReactDOM.createRoot(container).render(
        <SettingsProvider><PomodoroHistoryProvider><PomodoroTimer size={70} floating={true} /></PomodoroHistoryProvider></SettingsProvider>
      );
    } catch (err) { console.error(err); }
  };

  const radius = size;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - smoothProgress * circumference;

  return (
    <div
      onDoubleClick={() => floating && window.close()}
      className={floating ? "flex flex-col items-center justify-center h-screen bg-background relative select-none p-4" : "flex flex-col items-center space-y-4"}
    >
      {/* 状态文字 */}
      {isRunning && (
        <div className={`flex items-center gap-2 font-bold mb-1 ${mode === 'work' ? 'text-red-500' : 'text-green-500'}`}>
           {mode === 'work' ? <Target size={18}/> : <Coffee size={18}/>}
           <span>{mode === 'work' ? t("pomodoroTimer.workLabel") : t("pomodoroTimer.breakLabel")}</span>
        </div>
      )}
      {!isRunning && !floating && (
        <div className="text-muted-foreground text-sm flex items-center gap-1 mb-1">
          <Timer size={14}/> 准备开始
        </div>
      )}

      {/* 理由弹窗 */}
      {!floating && (
        <Dialog open={isReasonModalOpen} onOpenChange={setIsReasonModalOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("pomodoroTimer.quitReasonTitle")}</DialogTitle></DialogHeader>
            <div className="py-4">
              <Input value={quitReason} autoFocus onChange={(e) => setQuitReason(e.target.value)} placeholder={t("pomodoroTimer.quitReasonPlaceholder")} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReasonModalOpen(false)}>{t("common.cancel")}</Button>
              <Button variant="destructive" disabled={!quitReason.trim()} onClick={() => justResetData(quitReason)}>{t("pomodoroTimer.reset")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 圆环 */}
      <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
        <svg width={radius * 2} height={radius * 2} className="transform -rotate-90">
          <circle stroke="hsl(var(--muted))" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
          <circle
            stroke={mode === "work" ? "hsl(var(--pomodoro-work-ring))" : "hsl(var(--pomodoro-break-ring))"}
            fill="transparent" strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset, transition: "stroke-dashoffset 0s linear" }}
            r={normalizedRadius} cx={radius} cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={floating ? "text-3xl font-bold" : "text-4xl font-bold"}>
            {formatTime(smoothRemaining)}
          </div>
        </div>
      </div>

      {/* 按钮 */}
      <div className="flex space-x-2">
        {!isRunning ? (
          <Button size="sm" className="bg-red-500 hover:bg-red-600" onClick={() => start()}>开始专注</Button>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); isPaused ? resume() : pause(); }}>
              {isPaused ? t("pomodoroTimer.resume") : t("pomodoroTimer.pause")}
            </Button>
            {!floating && mode === 'work' && (
              <Button size="sm" variant="destructive" onClick={handleStopClick}>放弃</Button>
            )}
            {!floating && mode === 'break' && (
               <Button size="sm" variant="ghost" onClick={() => skipBreak()}>跳过休息</Button>
            )}
          </>
        )}
        {!floating && isRunning && (
          <Button size="sm" variant="ghost" onClick={openFloatingWindow}>
             <Maximize2 size={14} className="mr-1"/> {t("pomodoroTimer.float")}
          </Button>
        )}
      </div>

      {/* 【核心修复 2】：底部调节面板补零显示 */}
      {!isRunning && !floating && (
        <div className="flex items-center gap-4 mt-2 p-3 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase text-muted-foreground font-bold mb-1">专注</span>
            <div className="flex items-center gap-1">
              {/* 使用 formatInputValue 进行显示层面的补零 */}
              <Input 
                type="text" 
                className="w-12 h-7 text-center text-xs font-mono" 
                value={formatInputValue(pomodoro.workMinutes)} 
                onChange={(e) => {
                    const val = parseInt(e.target.value.replace(/\D/g, '')) || 1;
                    updatePomodoro("workMinutes", val);
                }} 
              />
              <span className="text-[10px]">分</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase text-muted-foreground font-bold mb-1">休息</span>
            <div className="flex items-center gap-1">
              <Input 
                type="text" 
                className="w-12 h-7 text-center text-xs font-mono" 
                value={formatInputValue(pomodoro.breakMinutes)} 
                onChange={(e) => {
                    const val = parseInt(e.target.value.replace(/\D/g, '')) || 1;
                    updatePomodoro("breakMinutes", val);
                }} 
              />
              <span className="text-[10px]">分</span>
            </div>
          </div>
        </div>
      )}

      {floating && (
        <p className="text-[10px] text-muted-foreground mt-2 opacity-50 font-medium">双击关闭</p>
      )}
    </div>
  );
};

export default PomodoroTimer;