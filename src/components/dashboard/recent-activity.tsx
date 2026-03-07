"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function RecentActivity() {
  // TODO: 从 API 获取真实活动记录
  const activities = [
    { id: 1, action: "完成分析", target: "小米集团 - 作手 5.8 评估", agent: "小作手", time: "10 分钟前" },
    { id: 2, action: "推送新闻", target: "AI 科技日报 2026-03-07", agent: "资讯员", time: "2 小时前" },
    { id: 3, action: "更新记忆", target: "MEMORY.md", agent: "二毛", time: "3 小时前" },
    { id: 4, action: "技能更新", target: "daily-trending v1.2.0", agent: "auto-updater", time: "今天 04:00" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>最近活动</CardTitle>
        <CardDescription>你的数字团队正在工作</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{activity.action}</p>
                <p className="text-sm text-muted-foreground">{activity.target}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{activity.agent}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
