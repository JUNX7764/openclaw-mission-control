"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { 
  Users, 
  Bot, 
  Cpu, 
  FolderOpen, 
  CheckCircle2, 
  Plus,
  ArrowDownFromLine,
  Sparkles
} from "lucide-react"

interface Agent {
  id: string
  name: string
  emoji?: string
  workspace?: string
  model?: string
  isDefault: boolean
  allowAgents?: string[]
  agentDir?: string
}

interface AgentsData {
  agents: Agent[]
  total: number
}

export default function TeamPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [leader, setLeader] = useState<Agent | null>(null)
  const [operators, setOperators] = useState<Agent[]>([])
  const [unassigned, setUnassigned] = useState<Agent[]>([])

  // 加载团队数据
  useEffect(() => {
    loadTeam()
  }, [])

  async function loadTeam() {
    try {
      const res = await fetch("/api/openclaw/agents")
      const json = await res.json()
      
      if (json.success) {
        const allAgents = json.data.agents as Agent[]
        setAgents(allAgents)

        // 找到队长（default: true 的 Agent）
        const leaderAgent = allAgents.find(a => a.isDefault) || null
        setLeader(leaderAgent)

        if (leaderAgent && leaderAgent.allowAgents) {
          // 一线干员：在队长 allowAgents 列表中的
          const operatorAgents = allAgents.filter(
            a => a.id !== leaderAgent.id && leaderAgent.allowAgents?.includes(a.id)
          )
          setOperators(operatorAgents)

          // 独立干员：不在 allowAgents 列表中的
          const unassignedAgents = allAgents.filter(
            a => a.id !== leaderAgent.id && !leaderAgent.allowAgents?.includes(a.id)
          )
          setUnassigned(unassignedAgents)
        } else {
          // 没有队长或没有 allowAgents，所有非队长 Agent 都算独立干员
          const otherAgents = allAgents.filter(a => !a.isDefault)
          setUnassigned(otherAgents)
        }
      }
    } catch (error) {
      console.error("Failed to load team:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 招募新干员（Toast 提示）
  function handleRecruit() {
    alert("🚀 招募系统即将上线！\n\n未来你将可以：\n- 创建新的子 Agent\n- 配置专属 workspace\n- 分配任务和职责")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Users className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">加载团队架构...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AppSidebar />
      <main className="flex-1 flex flex-col">
        {/* 顶部栏 */}
        <header className="h-16 border-b bg-white flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">团队管理</h1>
            <span className="text-sm text-gray-500">
              {agents.length} 名成员 · {operators.length} 名一线干员 · {unassigned.length} 名独立干员
            </span>
          </div>
          <button
            onClick={handleRecruit}
            className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            招募新干员
          </button>
        </header>

        {/* 团队架构 */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-8">
            
            {/* 主控 Agent（队长） */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h2 className="text-sm font-semibold text-gray-700">主控 Agent（队长）</h2>
              </div>
              
              {leader ? (
                <div className="flex justify-center">
                  <AgentCard agent={leader} variant="leader" />
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  未找到主控 Agent
                </div>
              )}
            </section>

            {/* 连接线 */}
            {operators.length > 0 && (
              <div className="flex justify-center">
                <ArrowDownFromLine className="h-8 w-8 text-gray-300" />
              </div>
            )}

            {/* 一线干员 */}
            {operators.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  <h2 className="text-sm font-semibold text-gray-700">一线干员（Operators）</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {operators.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} variant="operator" />
                  ))}
                </div>
              </section>
            )}

            {/* 独立干员 */}
            {unassigned.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Bot className="h-5 w-5 text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-700">独立干员（Unassigned）</h2>
                  <span className="text-xs text-gray-400">未分配给队长管理</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unassigned.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} variant="unassigned" />
                  ))}
                </div>
              </section>
            )}

            {/* 空状态 */}
            {agents.length === 0 && (
              <div className="text-center py-16">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">暂无团队成员</p>
                <p className="text-sm text-gray-400 mt-2">在 openclaw.json 中配置 agents.list</p>
              </div>
            )}
          </div>
        </div>

        {/* 底部说明 */}
        <footer className="h-12 border-t bg-white flex items-center justify-center px-6 text-xs text-gray-500">
          <span>💡 提示：团队成员来自 ~/.openclaw/openclaw.json 配置</span>
        </footer>
      </main>
    </div>
  )
}

// Agent 卡片组件
interface AgentCardProps {
  agent: Agent
  variant: "leader" | "operator" | "unassigned"
}

function AgentCard({ agent, variant }: AgentCardProps) {
  const [showFullWorkspace, setShowFullWorkspace] = useState(false)

  const variantStyles = {
    leader: "border-amber-300 bg-amber-50 shadow-md hover:shadow-lg",
    operator: "border-blue-200 bg-white shadow-sm hover:shadow-md",
    unassigned: "border-gray-200 bg-gray-50 shadow-sm hover:shadow-md",
  }

  const variantGlow = {
    leader: "ring-2 ring-amber-400 ring-opacity-50",
    operator: "ring-1 ring-blue-200 ring-opacity-30",
    unassigned: "",
  }

  return (
    <Card 
      className={`relative transition-all duration-200 hover:-translate-y-1 ${
        variantStyles[variant]
      } ${variantGlow[variant]}`}
      onMouseEnter={() => setShowFullWorkspace(true)}
      onMouseLeave={() => setShowFullWorkspace(false)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          {/* 头像 + 名称 */}
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
              variant === "leader" ? "bg-amber-100" : "bg-gray-100"
            }`}>
              {agent.emoji || "🤖"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                {variant === "leader" && (
                  <span className="text-xs px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full">
                    队长
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-mono">{agent.id}</p>
            </div>
          </div>

          {/* 状态圆点 */}
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs">可差遣</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 模型信息 */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Cpu className="h-4 w-4" />
          <span className="font-mono text-xs">{agent.model || "默认模型"}</span>
        </div>

        {/* 工作区路径 */}
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <FolderOpen className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            {showFullWorkspace && agent.workspace ? (
              <p className="font-mono text-xs break-all">{agent.workspace}</p>
            ) : (
              <p className="font-mono text-xs truncate">
                {agent.workspace || "默认工作区"}
              </p>
            )}
          </div>
        </div>

        {/* 可调用 Agent（仅队长显示） */}
        {variant === "leader" && agent.allowAgents && agent.allowAgents.length > 0 && (
          <div className="pt-2 border-t border-amber-200">
            <p className="text-xs text-gray-500 mb-1">可调用：</p>
            <div className="flex flex-wrap gap-1">
              {agent.allowAgents.map((id) => (
                <span
                  key={id}
                  className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full"
                >
                  {id}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
