"use client"

import { Draggable } from "@hello-pangea/dnd"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Clock, Tag } from "lucide-react"

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

interface TaskCardProps {
  task: Task
  index: number
}

const priorityColors = {
  low: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  high: "bg-red-100 text-red-700 border-red-200",
}

const priorityLabels = {
  low: "低",
  medium: "中",
  high: "高",
}

export function TaskCard({ task, index }: TaskCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (hours < 1) return "刚刚"
    if (hours < 24) return `${hours}小时前`
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" })
  }

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-2 ${snapshot.isDragging ? "rotate-2 shadow-xl" : ""}`}
        >
          <Card className={`hover:shadow-md transition-shadow ${
            snapshot.isDragging ? "shadow-xl border-blue-300" : ""
          }`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-sm leading-tight flex-1">
                  {task.title}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${
                  priorityColors[task.priority]
                }`}>
                  {priorityLabels[task.priority]}
                </span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {task.description && (
                <p className="text-xs text-gray-500 line-clamp-2">
                  {task.description}
                </p>
              )}
              
              {/* Agent 标签 */}
              <div className="flex items-center gap-2">
                <span className="text-lg">{task.agentEmoji || "🤖"}</span>
                <span className="text-xs text-gray-600">{task.agentName}</span>
              </div>
              
              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {task.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded flex items-center gap-0.5"
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              {/* 时间戳 */}
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                <span>更新于 {formatDate(task.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  )
}
