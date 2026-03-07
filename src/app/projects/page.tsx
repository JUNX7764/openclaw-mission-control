"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FolderKanban, 
  Plus, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Target,
  User
} from "lucide-react"

interface Project {
  id: string
  name: string
  description: string
  owner: string
  ownerName: string
  ownerEmoji?: string
  status: "active" | "urgent" | "at-risk" | "archived"
  progress: number
  taskIds: string[]
  createdAt: string
  updatedAt: string
  tags?: string[]
}

interface ProjectsData {
  projects: Project[]
  meta: {
    version: string
    lastUpdated: string
  }
}

export default function ProjectsPage() {
  const [data, setData] = useState<ProjectsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "active" | "archived">("all")

  // 加载项目数据
  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    try {
      const params = filter !== "all" ? `?status=${filter}` : ""
      const res = await fetch(`/api/projects${params}`)
      const json = await res.json()
      
      if (json.success) {
        setData(json.data)
      }
    } catch (error) {
      console.error("Failed to load projects:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 创建新项目（Toast 预告）
  function handleCreateProject() {
    alert("🚀 项目创建系统即将上线！\n\n未来你将可以：\n- 创建新项目并设定目标\n- 分配负责人（Agent）\n- 关联任务看板中的任务\n- 追踪项目进度")
  }

  // 点击项目卡片
  function handleProjectClick(project: Project) {
    const statusLabels = {
      active: "🟢 进行中",
      urgent: "🟡 用力推进",
      "at-risk": "🔴 存在风险",
      archived: "⚪ 已归档",
    }

    alert(`📁 ${project.name}\n\n${project.description}\n\n👤 负责人：${project.ownerEmoji || "🤖"} ${project.ownerName}\n📊 进度：${project.progress}%\n️ 状态：${statusLabels[project.status]}\n📅 创建：${new Date(project.createdAt).toLocaleDateString("zh-CN")}\n🔗 关联任务：${project.taskIds.length} 个`)
  }

  // 刷新数据
  function handleRefresh() {
    setIsLoading(true)
    loadProjects()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FolderKanban className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">加载项目列表...</p>
          </div>
        </main>
      </div>
    )
  }

  const statusConfig = {
    active: { label: "进行中", color: "bg-green-100 text-green-700 border-green-200", icon: "🟢" },
    urgent: { label: "用力推进", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: "🟡" },
    "at-risk": { label: "存在风险", color: "bg-red-100 text-red-700 border-red-200", icon: "🔴" },
    archived: { label: "已归档", color: "bg-gray-100 text-gray-700 border-gray-200", icon: "⚪" },
  }

  const filteredProjects = data?.projects.filter(p => {
    if (filter === "all") return true
    if (filter === "active") return p.status !== "archived"
    if (filter === "archived") return p.status === "archived"
    return true
  }) || []

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AppSidebar />
      <main className="flex-1 flex flex-col">
        {/* 顶部操作区 */}
        <header className="h-16 border-b bg-white flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">项目管理</h1>
            <span className="text-sm text-gray-500">
              {data?.projects.length || 0} 个项目 · {filteredProjects.length} 个显示
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="刷新数据"
            >
              <Clock className="h-4 w-4" />
            </button>
            <button
              onClick={handleCreateProject}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              创建新项目
            </button>
          </div>
        </header>

        {/* 内容区 */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* 状态筛选器 */}
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="all">全部</TabsTrigger>
                <TabsTrigger value="active">进行中</TabsTrigger>
                <TabsTrigger value="archived">已归档</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* 项目卡片列表 */}
            {filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    statusConfig={statusConfig}
                    onClick={handleProjectClick}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <FolderKanban className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">暂无项目</p>
                <p className="text-sm text-gray-400 mt-2">点击"创建新项目"开始</p>
              </div>
            )}
          </div>
        </div>

        {/* 底部说明 */}
        <footer className="h-12 border-t bg-white flex items-center justify-center px-6 text-xs text-gray-500">
          <span>💡 提示：项目数据存储在 ~/.openclaw/workspace/mission-control/data/projects.json</span>
        </footer>
      </main>
    </div>
  )
}

// 项目卡片组件
interface ProjectCardProps {
  project: Project
  statusConfig: Record<string, { label: string; color: string; icon: string }>
  onClick: (project: Project) => void
}

function ProjectCard({ project, statusConfig, onClick }: ProjectCardProps) {
  const status = statusConfig[project.status] || statusConfig.active

  return (
    <Card 
      className="group cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg border-gray-200 bg-white"
      onClick={() => onClick(project)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* 项目名称 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FolderKanban className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
              <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
            </div>
            <CardDescription className="line-clamp-2 text-xs">
              {project.description}
            </CardDescription>
          </div>

          {/* 状态标签 */}
          <Badge variant="outline" className={`shrink-0 ${status.color}`}>
            <span className="mr-1">{status.icon}</span>
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 负责人 */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="h-4 w-4" />
          <span className="text-lg">{project.ownerEmoji || "🤖"}</span>
          <span>{project.ownerName}</span>
        </div>

        {/* 进度条 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-gray-600">
              <Target className="h-3 w-3" />
              <span>进度</span>
            </div>
            <span className="font-medium text-gray-900">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2 border-t">
            {project.tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* 关联任务数 */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>关联 {project.taskIds.length} 个任务</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>更新于 {new Date(project.updatedAt).toLocaleDateString("zh-CN")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
