"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
    FolderKanban,
    ArrowLeft,
    Clock,
    CheckCircle2,
    ListTodo,
    PlayCircle,
    Eye,
    Archive,
    Target,
    User,
    CalendarDays
} from "lucide-react"

interface Task {
    id: string
    title: string
    description?: string
    status: "todo" | "in-progress" | "reviewing" | "done" | "archived"
    agentId?: string
    agentName?: string
    agentEmoji?: string
    updatedAt: string
}

interface ProjectDetail {
    id: string
    name: string
    description: string
    ownerName: string
    ownerEmoji?: string
    status: "active" | "urgent" | "at-risk" | "archived"
    progress: number
    lastProgressCalcAt?: string
    createdAt: string
    updatedAt: string
    tags?: string[]
    taskDistribution?: {
        todo: number
        "in-progress": number
        reviewing: number
        done: number
        archived: number
    }
    tasks: Task[]
}

const statusConfig = {
    active: { label: "进行中", color: "bg-green-100 text-green-700 border-green-200", icon: "🟢" },
    urgent: { label: "用力推进", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: "🟡" },
    "at-risk": { label: "存在风险", color: "bg-red-100 text-red-700 border-red-200", icon: "🔴" },
    archived: { label: "已归档", color: "bg-gray-100 text-gray-700 border-gray-200", icon: "⚪" },
}

const taskStatusConfig = {
    todo: { label: "待分配", color: "bg-gray-100 text-gray-700", icon: ListTodo },
    "in-progress": { label: "执行中", color: "bg-blue-100 text-blue-700", icon: PlayCircle },
    reviewing: { label: "待确认", color: "bg-yellow-100 text-yellow-700", icon: Eye },
    done: { label: "已完成", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
    archived: { label: "已归档", color: "bg-gray-100 text-gray-500", icon: Archive },
}

export default function ProjectDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [project, setProject] = useState<ProjectDetail | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function loadProject() {
            try {
                const res = await fetch(`/api/projects/${params.id}`)
                const json = await res.json()
                if (json.success) {
                    setProject(json.data)
                }
            } catch (error) {
                console.error("Failed to load project details:", error)
            } finally {
                setIsLoading(false)
            }
        }
        loadProject()
    }, [params.id])

    if (isLoading) {
        return (
            <div className="flex min-h-screen">
                <AppSidebar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <FolderKanban className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">加载项目详情...</p>
                    </div>
                </main>
            </div>
        )
    }

    if (!project) {
        return (
            <div className="flex min-h-screen">
                <AppSidebar />
                <main className="flex-1 flex flex-col items-center justify-center">
                    <FolderKanban className="h-12 w-12 text-gray-300 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">项目不存在</h2>
                    <button
                        onClick={() => router.back()}
                        className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                        <ArrowLeft className="h-4 w-4" /> 返回列表
                    </button>
                </main>
            </div>
        )
    }

    const projStatus = statusConfig[project.status] || statusConfig.active

    return (
        <div className="flex min-h-screen bg-gray-50">
            <AppSidebar />
            <main className="flex-1 flex flex-col h-screen overflow-hidden">

                {/* Header */}
                <header className="h-16 border-b bg-white flex items-center px-6 shrink-0 gap-4">
                    <button
                        onClick={() => router.push("/projects")}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-500" />
                    </button>
                    <div className="flex items-center gap-3">
                        <FolderKanban className="h-5 w-5 text-blue-500" />
                        <h1 className="text-lg font-semibold">{project.name}</h1>
                        <Badge variant="outline" className={projStatus.color}>
                            <span className="mr-1">{projStatus.icon}</span> {projStatus.label}
                        </Badge>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-5xl mx-auto space-y-6">

                        {/* Project Overview Card */}
                        <Card className="bg-white shadow-sm border-gray-200">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row gap-8">

                                    {/* Left Column: Info */}
                                    <div className="flex-1 space-y-6">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{project.name}</h2>
                                            <p className="text-gray-600">{project.description}</p>
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                <span>负责人：<span className="font-semibold text-gray-900">{project.ownerEmoji || "🤖"} {project.ownerName}</span></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4" />
                                                <span>创建于：{new Date(project.createdAt).toLocaleDateString("zh-CN")}</span>
                                            </div>
                                        </div>

                                        {project.tags && project.tags.length > 0 && (
                                            <div className="flex gap-2">
                                                {project.tags.map(tag => (
                                                    <Badge key={tag} variant="secondary">{tag}</Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Column: Progress */}
                                    <div className="w-full md:w-72 bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 font-medium text-gray-900">
                                                <Target className="h-4 w-4 text-blue-600" /> 总进度
                                            </div>
                                            <span className="text-2xl font-bold">{project.progress}%</span>
                                        </div>
                                        <Progress value={project.progress} className="h-3 bg-gray-200" />

                                        {project.lastProgressCalcAt && (
                                            <div className="flex items-center justify-end gap-1 text-xs text-gray-400 mt-2">
                                                <Clock className="h-3 w-3" />
                                                最近同步: {new Date(project.lastProgressCalcAt).toLocaleTimeString("zh-CN")}
                                            </div>
                                        )}

                                        {/* Task Distribution */}
                                        {project.taskDistribution && (
                                            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-200">
                                                {project.taskDistribution.done + project.taskDistribution.archived > 0 && (
                                                    <div className="text-xs flex items-center justify-between">
                                                        <span className="flex items-center gap-1 text-green-700"><CheckCircle2 className="h-3 w-3" /> 已完成</span>
                                                        <span className="font-semibold">{project.taskDistribution.done + project.taskDistribution.archived}</span>
                                                    </div>
                                                )}
                                                {project.taskDistribution["in-progress"] > 0 && (
                                                    <div className="text-xs flex items-center justify-between">
                                                        <span className="flex items-center gap-1 text-blue-700"><PlayCircle className="h-3 w-3" /> 执行中</span>
                                                        <span className="font-semibold">{project.taskDistribution["in-progress"]}</span>
                                                    </div>
                                                )}
                                                {project.taskDistribution.reviewing > 0 && (
                                                    <div className="text-xs flex items-center justify-between">
                                                        <span className="flex items-center gap-1 text-yellow-700"><Eye className="h-3 w-3" /> 待确认</span>
                                                        <span className="font-semibold">{project.taskDistribution.reviewing}</span>
                                                    </div>
                                                )}
                                                {project.taskDistribution.todo > 0 && (
                                                    <div className="text-xs flex items-center justify-between">
                                                        <span className="flex items-center gap-1 text-gray-600"><ListTodo className="h-3 w-3" /> 待分配</span>
                                                        <span className="font-semibold">{project.taskDistribution.todo}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </CardContent>
                        </Card>

                        {/* Task Timeline/List */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <ListTodo className="h-5 w-5 text-gray-500" />
                                    关联任务 ({project.tasks?.length || 0})
                                </h3>
                            </div>

                            <div className="space-y-3">
                                {project.tasks?.length > 0 ? (
                                    project.tasks.map(task => {
                                        const taskStatus = taskStatusConfig[task.status]
                                        const TaskIcon = taskStatus.icon
                                        return (
                                            <Card key={task.id} className="hover:shadow-md transition-shadow">
                                                <CardHeader className="p-4 pb-0">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <Badge variant="secondary" className={`${taskStatus.color} border-none`}>
                                                                <TaskIcon className="h-3 w-3 mr-1" /> {taskStatus.label}
                                                            </Badge>
                                                            <CardTitle className="text-base">{task.title}</CardTitle>
                                                        </div>
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(task.updatedAt).toLocaleDateString("zh-CN")} {new Date(task.updatedAt).toLocaleTimeString("zh-CN", { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-4 pt-3">
                                                    <p className="text-sm text-gray-600 line-clamp-2 whitespace-pre-wrap">{task.description}</p>
                                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                                                        <User className="h-3 w-3" />
                                                        <span>{task.agentEmoji || "🤖"} {task.agentName}</span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })
                                ) : (
                                    <Card className="bg-gray-50 border-dashed">
                                        <CardContent className="p-10 text-center text-gray-500">
                                            <ListTodo className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                                            <p>暂无关联任务</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

            </main>
        </div>
    )
}
