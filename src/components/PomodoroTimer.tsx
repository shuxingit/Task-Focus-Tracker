import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactDOM from "react-dom/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // 确保导入 Input
import { usePomodoroStore } from "@/stores/pomodoro";
import { useSettings, SettingsProvider } from "@/hooks/useSettings";
import { hslToHex, hexToHsl, complementaryColor } from "@/utils/color";
import { playSound } from "@/utils/sounds";
import {
  usePomodoroHistory,
  PomodoroHistoryProvider,
} from "@/hooks/usePomodoroHistory.tsx";
import { useToast } from "@/components/ui/use-toast";
// 导入弹窗组件
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

interface PomodoroTimerProps {
  compact?: boolean;
  size?: number;
  floating?: boolean;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  compact,
  size = 80,
  floating,
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
    pauseStart,
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
  
  // --- 新增状态：控制理由弹窗 ---
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [quitReason, setQuitReason] = useState("");
  // ---------------------------

  const pipWindowRef = useRef<Window | null>(null);
  const [now, setNow] = useState(Date.now());
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window === "undefined") return { x: 0, y: 0 };
    try {
      const stored = localStorage.getItem("pomodoroFloatPos");
      if (stored) return JSON.parse(stored);
    } catch {}
    const sizePx = size * 2 + 24;
    return {
      x: window.innerWidth - sizePx - 16,
      y: window.innerHeight - sizePx - 16,
    };
  });
  const offsetRef = useRef({ x: 0, y: 0 });

  const [smoothRemaining, setSmoothRemaining] = useState(storeRemainingTime);
  const [smoothProgress, setSmoothProgress] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem("pomodoroFloatPos", JSON.stringify(position));
    } catch {}
  }, [position]);

  const handlePointerMove = (e: PointerEvent) => {
    const sizePx = size * 2 + 24;
    setPosition({
      x: Math.min(Math.max(0, e.clientX - offsetRef.current.x), window.innerWidth - sizePx),
      y: Math.min(Math.max(0, e.clientY - offsetRef.current.y), window.innerHeight - sizePx),
    });
  };

  const stopDrag = () => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", stopDrag);
  };

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    offsetRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDrag);
  };

  useEffect(() => {
    if (!isRunning || isPaused || !endTime) {
      setSmoothRemaining(storeRemainingTime);
      const duration = mode === "work" ? workDuration : breakDuration;
      setSmoothProgress(storeRemainingTime / duration);
      return;
    }
    let animationFrameId: number;
    const animate = () => {
      const now = Date.now();
      const msRemaining = Math.max(0, endTime - now);
      const secondsRemaining = Math.ceil(msRemaining / 1000);
      const duration = mode === "work" ? workDuration : breakDuration;
      const durationMs = duration * 1000;
      const exactProgress = Math.min(1, Math.max(0, msRemaining / durationMs));
      setSmoothRemaining(secondsRemaining);
      setSmoothProgress(exactProgress);
      if (msRemaining > 0) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning, isPaused, endTime, mode, workDuration, breakDuration, storeRemainingTime]);

  useEffect(() => {
    if (!isPaused) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [isPaused]);

  const pauseDuration = pauseStart ? Math.floor((now - pauseStart) / 1000) : 0;

  // --- 修改重置逻辑：拦截并弹出理由框 ---
  const handleResetClick = () => {
    // 只有在工作中且计时未结束时，才要求输入理由
    if (mode === "work" && smoothRemaining > 0) {
      setIsReasonModalOpen(true);
    } else {
      performReset();
    }
  };

  const performReset = (reason?: string) => {
    if (storeStartTime) {
      // 如果有理由，可以考虑存入 session（此处演示先通过 toast 显示）
      if (reason) {
        console.log("放弃理由:", reason);
        toast({
          title: t("common.undo"),
          description: `${t("pomodoroTimer.quitReasonLabel")}: ${reason}`,
        });
      }
      addSession(storeStartTime, Date.now(), mode, reason);
    }
    setStartTime(undefined);
    reset();
    setIsReasonModalOpen(false);
    setQuitReason("");
  };
  // ------------------------------------

  const handlePause = () => {
    if (storeStartTime) {
      addSession(storeStartTime, Date.now(), mode);
      setStartTime(undefined);
    }
    pause();
  };

  const handleResume = () => {
    if (pauseStart) addSession(pauseStart, Date.now(), "break");
    resume();
  };

  const handleStartBreak = () => {
    if (mode === "work" && storeStartTime) addSession(storeStartTime, Date.now(), "work");
    else if (pauseStart) addSession(pauseStart, Date.now(), "break");
    startBreak();
  };

  const handleSkipBreak = () => {
    if (mode === "break" && storeStartTime) addSession(storeStartTime, Date.now(), "break");
    else if (pauseStart) addSession(pauseStart, Date.now(), "break");
    skipBreak();
  };

  useEffect(() => {
    setDurations(pomodoro.workMinutes * 60, pomodoro.breakMinutes * 60);
  }, [pomodoro, setDurations]);

  const prevMode = useRef(mode);
  useEffect(() => {
    if (prevMode.current !== mode) {
      if (mode === "break") playSound(pomodoro.workSound);
      else playSound(pomodoro.breakSound);
      prevMode.current = mode;
    }
    const breakColor = theme["pomodoro-break-ring"];
    const updateStyles = (doc: Document) => {
      if (mode === "break") {
        const comp = hexToHsl(complementaryColor(hslToHex(breakColor)));
        doc.documentElement.style.setProperty("--background", breakColor);
        doc.documentElement.style.setProperty("--pomodoro-break-ring", comp);
      } else {
        doc.documentElement.style.setProperty("--background", theme.background);
        doc.documentElement.style.setProperty("--pomodoro-break-ring", breakColor);
      }
    };
    updateStyles(document);
    return () => {
      document.documentElement.style.setProperty("--background", theme.background);
      document.documentElement.style.setProperty("--pomodoro-break-ring", breakColor);
    };
  }, [mode, pomodoro.workSound, pomodoro.breakSound, theme]);

  const radius = size;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - smoothProgress * circumference;

  return (
    <div
      onPointerDown={compact ? startDrag : undefined}
      className={compact ? "fixed bg-background shadow-lg rounded p-3 z-50 cursor-move" : "flex flex-col items-center space-y-4"}
      style={compact ? { left: position.x, top: position.y } : undefined}
    >
      {/* --- 新增：放弃理由对话框 --- */}
      <Dialog open={isReasonModalOpen} onOpenChange={setIsReasonModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("pomodoroTimer.quitReasonTitle")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">
              {t("pomodoroTimer.quitReasonDesc")}
            </p>
            <Input 
              value={quitReason} 
              onChange={(e) => setQuitReason(e.target.value)}
              placeholder={t("pomodoroTimer.quitReasonPlaceholder")}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsReasonModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" disabled={!quitReason.trim()} onClick={() => performReset(quitReason)}>
              {t("pomodoroTimer.reset")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
        <svg width={radius * 2} height={radius * 2} className="transform -rotate-90">
          <circle stroke="hsl(var(--muted))" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
          <circle
            stroke={mode === "work" ? "hsl(var(--pomodoro-work-ring))" : "hsl(var(--pomodoro-break-ring))"}
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset, transition: "stroke-dashoffset 0s linear" }}
            r={normalizedRadius} cx={radius} cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={size > 100 ? "text-4xl font-bold" : "text-2xl font-bold"}>
            {isPaused ? `${t("pomodoroTimer.pauseLabel")} ${formatTime(pauseDuration)}` : formatTime(smoothRemaining)}
          </div>
        </div>
      </div>

      <div className="flex space-x-2 mt-4">
        {!isRunning && <Button onClick={() => start()}>{t("pomodoroTimer.start")}</Button>}
        {isRunning && !isPaused && <Button onClick={handlePause} variant="outline">{t("pomodoroTimer.pause")}</Button>}
        {isRunning && isPaused && <Button onClick={handleResume} variant="outline">{t("pomodoroTimer.resume")}</Button>}
        
        {/* 将原来的 reset 换成 handleResetClick */}
        {isRunning && !compact && (
          <Button onClick={handleResetClick} variant="outline">{t("pomodoroTimer.reset")}</Button>
        )}
      </div>
    </div>
  );
};

export default PomodoroTimer;