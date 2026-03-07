"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Activity, CheckCircle, Clock, AlertCircle, Users, Brain, GitBranch } from "lucide-react"
import { fetchAgents, fetchSystem, fetchMemoryCore } from "@/lib/api"

interface DashboardData {
  agentsTotal: number
  feishuAccounts: number
  memorySections: number
  memoryLastUpdated: string | null
  gatewayMode: string
  isLoading: boolean
  error: string | null
}

export function DashboardOverview() {
  const [data, setData] = useState<DashboardData>({
    agentsTotal: 0,
    feishuAccounts: 0,
    memorySections: 0,
    memoryLastUpdated: null,
    gatewayMode: "unknown",
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    async function loadData() {
      try {
        const [agentsRes, systemRes, memoryRes] = await Promise.all([
          fetchAgents(),
          fetchSystem(),
          fetchMemoryCore(),
        ])

        setData({
          agentsTotal: agentsRes.data.total,
          feishuAccounts: systemRes.data.channels.feishu.accounts.length,
          memorySections: memoryRes.data.stats?.sections || 0,
          memoryLastUpdated: memoryRes.data.metadata?.lastUpdated,
          gatewayMode: systemRes.data.gateway.mode,
          isLoading: false,
          error: null,
        })
      } catch (error) {
        setData((prev) => ({
          ...prev,
          isLoading: false,
          error: (error as Error).message,
        }))
      }
    }

    loadData()
  }, [])

  if (data.isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (data.error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800">数据加载失败</CardTitle>
          <CardDescription className="text-red-600">{data.error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">智能体数量</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.agentsTotal}</div>
          <p className="text-xs text-muted-foreground">已注册的 Agent</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">飞书账号</CardTitle>
          <GitBranch className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.feishuAccounts}</div>
          <p className="text-xs text-muted-foreground">已绑定渠道</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">记忆分区</CardTitle>
          <Brain className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.memorySections}</div>
          <p className="text-xs text-muted-foreground">
            {data.memoryLastUpdated ? `更新于 ${data.memoryLastUpdated}` : "记忆系统"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">网关模式</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold capitalize">{data.gatewayMode}</div>
          <p className="text-xs text-muted-foreground">本地运行中</p>
        </CardContent>
      </Card>
    </div>
  )
}
