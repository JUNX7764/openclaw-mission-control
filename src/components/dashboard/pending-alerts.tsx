"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export function PendingAlerts() {
  // TODO: 从 API 获取真实待办
  const alerts = [
    { id: 1, title: "阿里巴巴 - 作手 5.8 分析待确认", priority: "high", agent: "小作手" },
    { id: 2, title: "AI 新闻日报推送失败", priority: "medium", agent: "资讯员" },
  ]

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>✅ 无待办预警</CardTitle>
          <CardDescription>所有任务正常运行中</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          待办预警
        </CardTitle>
        <CardDescription>需要你关注的任务</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                alert.priority === "high"
                  ? "border-red-200 bg-red-50"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <div>
                <p className="font-medium text-sm">{alert.title}</p>
                <p className="text-xs text-muted-foreground">执行 Agent：{alert.agent}</p>
              </div>
              <button className="text-xs px-3 py-1 bg-white border rounded-md hover:bg-gray-50">
                处理
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
