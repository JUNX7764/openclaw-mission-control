"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import {
  Shield,
  FileText,
  AlertCircle,
  Info,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter
} from "lucide-react"
import { Input } from "@/components/ui/input"

interface Log {
  id: string
  level: "INFO" | "WARN" | "ERROR"
  subsystem: string
  message: string
  timestamp: string
  source: string
}

interface Permissions {
  allowOutboundMessages: boolean
  allowApiPayments: boolean
  allowRiskyCommands: boolean
}

interface LogsData {
  logs: Log[]
  permissions: Permissions
  meta: {
    version: string
    lastUpdated: string
    totalLogs: number
    logRetentionDays: number
  }
}

const levelConfig = {
  INFO: { label: "INFO", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Info },
  WARN: { label: "WARN", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: AlertTriangle },
  ERROR: { label: "ERROR", color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle },
}

const subsystemColors: Record<string, string> = {
  Gateway: "bg-purple-100 text-purple-700",
  Feishu: "bg-blue-100 text-blue-700",
  AI: "bg-green-100 text-green-700",
  Memory: "bg-amber-100 text-amber-700",
  Skills: "bg-pink-100 text-pink-700",
  Cron: "bg-indigo-100 text-indigo-700",
  "Mission Control": "bg-emerald-100 text-emerald-700",
  Browser: "bg-orange-100 text-orange-700",
}

export default function LogsPage() {
  const [data, setData] = useState<LogsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filterLevel, setFilterLevel] = useState<string>("all")
  const [filterSubsystem, setFilterSubsystem] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // 加载日志数据
  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    try {
      const params = new URLSearchParams()
      if (filterLevel !== "all") params.set("level", filterLevel)
      if (filterSubsystem !== "all") params.set("subsystem", filterSubsystem)
      params.set("limit", "100")
      
      const res = await fetch(`/api/logs?${params}`)
      const json = await res.json()
      
      if (json.success) {
        setData(json.data)
      }
    } catch (error) {
      console.error("Failed to load logs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 更新权限
  async function updatePermission(key: keyof Permissions, value: boolean) {
    try {
      const res = await fetch("/api/logs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permissions: {
            [key]: value,
          },
        }),
      })

      const json = await res.json()

      if (json.success && data) {
        setData({
          ...data,
          permissions: json.data.permissions,
        })

        const permissionLabels: Record<keyof Permissions, string> = {
          allowOutboundMessages: "对外发布消息",
          allowApiPayments: "API 付费行为",
          allowRiskyCommands: "高风险终端命令",
        }

        toast.success("权限修改已同步", {
          description: `${permissionLabels[key]} 已${value ? "开启" : "关闭"}`,
        })
      }
    } catch (error) {
      console.error("Failed to update permission:", error)
      toast.error("权限修改失败", {
        description: "请稍后重试",
      })
    }
  }

  // 刷新日志
  function handleRefresh() {
    setIsLoading(true)
    loadLogs()
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const filteredLogs = data?.logs.filter(log => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return log.message.toLowerCase().includes(query) ||
        log.subsystem.toLowerCase().includes(query) ||
        log.source.toLowerCase().includes(query)
    }
    return true
  }) || []

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FileText className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">加载系统日志...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <AppSidebar />
      <main className="flex-1 flex flex-col">
        {/* 顶部操作区 */}
        <header className="h-16 border-b bg-white flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">日志与权限</h1>
            <span className="text-sm text-gray-500">
              {data?.logs.length || 0} 条日志 · 保留 {data?.meta.logRetentionDays || 30} 天
            </span>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            刷新
          </button>
        </header>

        {/* 内容区 */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          
          {/* 上半部分：权限开关 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-gray-600" />
              <h2 className="text-sm font-semibold text-gray-700">权限与红线网关</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PermissionCard
                title="允许对外发布消息"
                description="发送邮件、推文、公开消息等"
                enabled={data?.permissions.allowOutboundMessages || false}
                onToggle={(value) => updatePermission("allowOutboundMessages", value)}
                icon="📤"
                defaultEnabled={false}
              />
              
              <PermissionCard
                title="允许产生 API 付费行为"
                description="调用付费 API、产生费用等"
                enabled={data?.permissions.allowApiPayments || true}
                onToggle={(value) => updatePermission("allowApiPayments", value)}
                icon="💰"
                defaultEnabled={true}
              />
              
              <PermissionCard
                title="允许执行高风险终端命令"
                description="rm、git push --force 等危险操作"
                enabled={data?.permissions.allowRiskyCommands || true}
                onToggle={(value) => updatePermission("allowRiskyCommands", value)}
                icon="⚡"
                defaultEnabled={true}
              />
            </div>
          </section>

          {/* 下半部分：系统日志 */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-600" />
                <h2 className="text-sm font-semibold text-gray-700">系统运行日志</h2>
              </div>
              
              <div className="flex items-center gap-2">
                {/* 搜索框 */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索日志..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-64 text-sm"
                  />
                </div>
                
                {/* 级别筛选 */}
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="text-sm border rounded-md px-2 py-1.5 bg-white"
                >
                  <option value="all">全部级别</option>
                  <option value="INFO">INFO</option>
                  <option value="WARN">WARN</option>
                  <option value="ERROR">ERROR</option>
                </select>
                
                {/* 子系统筛选 */}
                <select
                  value={filterSubsystem}
                  onChange={(e) => setFilterSubsystem(e.target.value)}
                  className="text-sm border rounded-md px-2 py-1.5 bg-white"
                >
                  <option value="all">全部子系统</option>
                  {Array.from(new Set(data?.logs.map(l => l.subsystem))).map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>

            <Card className="border-gray-200">
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-gray-50 sticky top-0">
                      <TableRow>
                        <TableHead className="w-20">级别</TableHead>
                        <TableHead className="w-32">子系统</TableHead>
                        <TableHead className="w-40">时间</TableHead>
                        <TableHead>日志内容</TableHead>
                        <TableHead className="w-32">来源</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.length > 0 ? (
                        filteredLogs.map((log) => {
                          const config = levelConfig[log.level]
                          const Icon = config.icon
                          
                          return (
                            <TableRow key={log.id} className="hover:bg-gray-50">
                              <TableCell>
                                <Badge variant="outline" className={`${config.color} font-mono text-xs`}>
                                  <Icon className="h-3 w-3 mr-1" />
                                  {config.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  subsystemColors[log.subsystem] || "bg-gray-100 text-gray-700"
                                }`}>
                                  {log.subsystem}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs text-gray-500 font-mono">
                                {formatTime(log.timestamp)}
                              </TableCell>
                              <TableCell className="text-sm text-gray-700">
                                {log.message}
                              </TableCell>
                              <TableCell className="text-xs text-gray-500 font-mono">
                                {log.source}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-16 text-gray-500">
                            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                            <p>暂无日志</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* 底部说明 */}
        <footer className="h-12 border-t bg-white flex items-center justify-center px-6 text-xs text-gray-500">
          <span>💡 提示：日志数据存储在 ~/.openclaw/workspace/mission-control/data/logs.json</span>
        </footer>
      </main>
    </div>
  )
}

// 权限卡片组件
interface PermissionCardProps {
  title: string
  description: string
  enabled: boolean
  onToggle: (value: boolean) => void
  icon: string
  defaultEnabled: boolean
}

function PermissionCard({ title, description, enabled, onToggle, icon, defaultEnabled }: PermissionCardProps) {
  return (
    <Card className={`${
      enabled 
        ? "border-green-200 bg-green-50" 
        : defaultEnabled 
          ? "border-amber-200 bg-amber-50"
          : "border-gray-200 bg-white"
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <div>
              <h3 className="font-semibold text-sm text-gray-900">{title}</h3>
              <CardDescription className="text-xs">{description}</CardDescription>
            </div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={onToggle}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-xs">
          {enabled ? (
            <span className="text-green-700 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              已开启
            </span>
          ) : (
            <span className="text-gray-500 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              已关闭
            </span>
          )}
          {!enabled && defaultEnabled && (
            <span className="text-amber-600 text-xs">（默认开启）</span>
          )}
          {!enabled && !defaultEnabled && (
            <span className="text-gray-400 text-xs">（默认关闭）</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
