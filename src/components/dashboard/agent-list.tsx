"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchAgents } from "@/lib/api"
import type { Agent } from "@/lib/api"

export function AgentList() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAgents() {
      try {
        const res = await fetchAgents()
        setAgents(res.data.agents)
        setIsLoading(false)
      } catch (err) {
        setError((err as Error).message)
        setIsLoading(false)
      }
    }

    loadAgents()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>智能体团队</CardTitle>
          <CardDescription>加载你的数字团队成员...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800">加载失败</CardTitle>
          <CardDescription className="text-red-600">{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (agents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>智能体团队</CardTitle>
          <CardDescription>暂无已注册的智能体</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>智能体团队</CardTitle>
        <CardDescription>你的数字团队成员 ({agents.length} 人)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{agent.emoji || "🤖"}</div>
                <div>
                  <p className="font-medium text-sm">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {agent.model || "默认模型"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {agent.isDefault && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    主 Agent
                  </span>
                )}
                {agent.allowAgents && agent.allowAgents.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    可调用：{agent.allowAgents.join(", ")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
