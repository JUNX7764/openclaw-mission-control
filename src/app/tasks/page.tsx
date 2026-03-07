"use client"

import { useState, useEffect } from "react"
import { DragDropContext, DropResult } from "@hello-pangea/dnd"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { TaskColumn } from "@/components/tasks/task-column"
import { Plus, RefreshCw } from "lucide-react"

interface Task {
  id: string
  title: string
  description?: string
  status: string
  agentId: string
  agentName: string
  agentEmoji?: string
  priority: "low" | "medium" | "high"
  createdAt: string
  updatedAt: string
  tags?: string[]
}

interface Column {
  id: string
  title: string
  color: string
}

interface TasksData {
  tasks: Task[]
  columns: Record<string, Column>
  meta: {
    version: string
    lastUpdated: string
  }
}

export default function TasksPage() {
  const [data, setData] = useState<TasksData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // 加载任务数据
  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    try {
      const res = await fetch("/api/tasks")
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch (error) {
      console.error("Failed to load tasks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 处理拖拽完成
  async function handleDragEnd(result: DropResult) {
    if (!data) return

    const { destination, source, draggableId } = result

    // 没有放置目标或位置未变化
    if (!destination) return
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    setIsSaving(true)

    // 找到被拖拽的任务
    const task = data.tasks.find((t) => t.id === draggableId)
    if (!task) return

    // 更新任务状态
    const updatedTask = {
      ...task,
      status: destination.droppableId,
      updatedAt: new Date().toISOString(),
    }

    // 乐观更新 UI
    const updatedTasks = data.tasks.map((t) =>
      t.id === draggableId ? updatedTask : t
    )

    setData({
      ...data,
      tasks: updatedTasks,
      meta: {
        ...data.meta,
        lastUpdated: new Date().toISOString(),
      },
    })

    // 同步到后端
    try {
      await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draggableId,
          status: destination.droppableId,
        }),
      })
    } catch (error) {
      console.error("Failed to save task:", error)
      // 失败时回滚
      loadTasks()
    } finally {
      setIsSaving(false)
    }
  }

  // 刷新数据
  function handleRefresh() {
    setIsLoading(true)
    loadTasks()
  }

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">加载任务看板...</p>
          </div>
        </main>
      </div>
    )
  }

  const columnOrder = ["todo", "in-progress", "reviewing", "done", "archived"]

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <header className="h-16 border-b flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">任务看板</h1>
            {isSaving && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                保存中...
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="刷新数据"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors">
              <Plus className="h-4 w-4" />
              新建任务
            </button>
          </div>
        </header>

        {/* 看板区域 */}
        <div className="flex-1 p-6 overflow-x-auto">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 min-w-max">
              {columnOrder.map((columnId) => {
                const column = data.columns[columnId]
                const tasks = data.tasks.filter((t) => t.status === columnId)

                return (
                  <TaskColumn
                    key={columnId}
                    column={column}
                    tasks={tasks}
                  />
                )
              })}
            </div>
          </DragDropContext>
        </div>

        {/* 底部状态栏 */}
        <footer className="h-10 border-t flex items-center justify-between px-6 text-xs text-gray-500">
          <span>共 {data.tasks.length} 个任务</span>
          <span>最后更新：{new Date(data.meta.lastUpdated).toLocaleString("zh-CN")}</span>
        </footer>
      </main>
    </div>
  )
}
