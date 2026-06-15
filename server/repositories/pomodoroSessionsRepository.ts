import type { PomodoroSession } from "../../src/types/index.js";
import db from "../lib/db.js";

export function loadPomodoroSessions(): PomodoroSession[] {
  try {
    // 1. 修改 SQL 语句，增加 reason 字段
    const rows = db
      .prepare("SELECT start, end, breakEnd, type, reason FROM pomodoro_sessions")
      .all() as {
      start: number;
      end: number;
      breakEnd?: number;
      type?: string;
      reason?: string; // 接收数据库里的 reason
    }[];

    const normalized: PomodoroSession[] = [];
    for (const r of rows) {
      if (r.breakEnd) {
        normalized.push({
          start: r.start,
          end: r.end,
          type: "work",
        });
        normalized.push({
          start: r.end,
          end: r.breakEnd,
          type: "break",
        });
      } else {
        normalized.push({
          start: r.start,
          end: r.end,
          type: (r.type as "work" | "break") || "work",
          reason: r.reason, // 2. 将数据库中的理由映射到对象中
        });
      }
    }
    return normalized.sort((a, b) => a.start - b.start);
  } catch {
    return [];
  }
}

export function savePomodoroSessions(sessions: PomodoroSession[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM pomodoro_sessions");
    // 3. 修改插入语句，增加 reason 占位符
    const stmt = db.prepare(
      "INSERT INTO pomodoro_sessions (start, end, type, reason) VALUES (?, ?, ?, ?)",
    );
    for (const s of sessions || []) {
      const type = s.type === "break" ? "break" : "work";
      // 4. 将理由存入数据库 (如果没有理由则存为 null)
      stmt.run(s.start, s.end, type, s.reason || null);
    }
  });
  tx();
}