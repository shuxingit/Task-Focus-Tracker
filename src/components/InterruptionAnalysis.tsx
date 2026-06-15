import React from 'react';
import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { usePomodoroHistory } from "@/hooks/usePomodoroHistory";

const COLORS = ['#FF8042', '#0088FE', '#00C49F', '#FFBB28', '#8884d8', '#82ca9d'];

const InterruptionAnalysis: React.FC = () => {
  const { t } = useTranslation();
  const { sessions } = usePomodoroHistory();

  // 1. 提取并统计理由
  const stats = sessions.reduce((acc: Record<string, number>, session) => {
    // 只有带有 reason 的工作时段才计入中断统计
    if (session.type === 'work' && session.reason) {
      acc[session.reason] = (acc[session.reason] || 0) + 1;
    }
    return acc;
  }, {});

  // 2. 转换成 Recharts 需要的格式
  const data = Object.keys(stats).map((reason) => ({
    name: reason,
    value: stats[reason],
  })).sort((a, b) => b.value - a.value); // 按次数排序

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">{t("pomodoroTimer.noInterruptionData", "暂无中断复盘数据")}</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-card shadow-sm">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        🚫 {t("pomodoroTimer.interruptionTitle", "专注力杀手排行榜 (中断原因分析)")}
      </h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
               contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
            />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground mt-4 text-center">
        💡 {t("pomodoroTimer.interruptionTip", "复盘：减少上述干扰，能有效提升单次专注时长。")}
      </p>
    </div>
  );
};

export default InterruptionAnalysis;