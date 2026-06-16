import React from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorklog } from "@/hooks/useWorklog";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 颜色池：为动态生成的分类自动分配颜色
const COLOR_PALETTE = [
  "hsl(var(--stat-bar-primary))",
  "hsl(var(--stat-bar-secondary))",
  "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444"
];

const WorklogStatsPage: React.FC = () => {
  const { trips, workDays, commutes } = useWorklog();
  const { t } = useTranslation();
  const [range, setRange] = React.useState<"week" | "month">("week");

  // 辅助函数：获取本地 YYYY-MM-DD 字符串，解决时区 Bug
  const getLocalDateStr = (dateInput: string | Date) => {
    const d = new Date(dateInput);
    return d.getFullYear() + '-' + 
           String(d.getMonth() + 1).padStart(2, '0') + '-' + 
           String(d.getDate()).padStart(2, '0');
  };

  // 1. 计算图表数据
  const { chartData, allCategories } = React.useMemo(() => {
    const data: any[] = [];
    const cats = new Set<string>();
    const now = new Date();
    const daysToLookBack = range === "week" ? 6 : 29;
    
    // 生成日期范围
    for (let i = daysToLookBack; i >= 0; i--) {
      const cur = new Date();
      cur.setDate(now.getDate() - i);
      const dateStr = getLocalDateStr(cur);
      
      // 初始化当天数据
      const dayData: any = { 
        date: range === "week" ? dateStr.slice(5) : dateStr,
        fullDate: dateStr
      };

      // 过滤出当天的记录
      const dayEntries = workDays.filter(d => getLocalDateStr(d.start) === dateStr);

      // 按分类统计时长
      dayEntries.forEach(entry => {
        const cat = entry.category || "uncategorized";
        cats.add(cat);
        const duration = (new Date(entry.end).getTime() - new Date(entry.start).getTime()) / 3600000; // 转为小时
        dayData[cat] = (dayData[cat] || 0) + duration;
      });

      data.push(dayData);
    }

    return { chartData: data, allCategories: Array.from(cats) };
  }, [workDays, range]);

  // 2. 动态生成图表配置
  const chartConfig = React.useMemo(() => {
    const config: any = {};
    allCategories.forEach((cat, index) => {
      config[cat] = {
        label: t(`worklog.category.${cat}`, { defaultValue: cat }),
        color: COLOR_PALETTE[index % COLOR_PALETTE.length],
      };
    });
    return config;
  }, [allCategories, t]);

  // 计算总时长
  const totalMinutes = workDays.reduce(
    (sum, d) => sum + (new Date(d.end).getTime() - new Date(d.start).getTime()) / 60000,
    0
  );
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = Math.round(totalMinutes % 60);

  return (
    <div className="min-h-screen bg-background">
      <Navbar title={t("navbar.worklogStats")} />
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex justify-between">
              <span>{t("worklogStats.totalTime", { hours: totalHours, minutes: totalMins })}</span>
              <span className="text-sm font-normal text-muted-foreground italic">累计数据统计</span>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t("worklogStats.perTrip")}</CardTitle>
            <Select value={range} onValueChange={(v) => setRange(v as "week" | "month")}>
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">最近7天</SelectItem>
                <SelectItem value="month">最近30天</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ left: 0, right: 20, top: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="date" fontSize={10} tickMargin={10} />
                  <YAxis fontSize={10} label={{ value: '小时', angle: -90, position: 'insideLeft', offset: 10 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [value.toFixed(2) + " h"]}
                  />
                  <Legend />
                  {allCategories.map((cat, index) => (
                    <Line
                      key={cat}
                      type="monotone"
                      dataKey={cat}
                      name={t(`worklog.category.${cat}`, { defaultValue: cat })}
                      stroke={COLOR_PALETTE[index % COLOR_PALETTE.length]}
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 底部保留原有的上周统计作为对比 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">每日时长分布 (柱状图)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.slice(-7)}>
                  <XAxis dataKey="date" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip formatter={(v: any) => v.toFixed(2) + " h"} />
                  <Bar dataKey={(d) => allCategories.reduce((sum, c) => sum + (d[c] || 0), 0)} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="总时长" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorklogStatsPage;