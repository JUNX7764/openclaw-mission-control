"use client"

import { Droppable } from "@hello-pangea/dnd"
import { TaskCard } from "./task-card"

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

interface TaskColumnProps {
  column: Column
  tasks: Task[]
}

const columnColorClasses: Record<string, string> = {
  gray: "bg-gray-100 border-gray-200",
  blue: "bg-blue-50 border-blue-200",
  amber: "bg-amber-50 border-amber-200",
  green: "bg-green-50 border-green-200",
  slate: "bg-slate-100 border-slate-200",
}

const columnHeaderColors: Record<string, string> = {
  gray: "text-gray-700",
  blue: "text-blue-700",
  amber: "text-amber-700",
  green: "text-green-700",
  slate: "text-slate-700",
}

export function TaskColumn({ column, tasks }: TaskColumnProps) {
  return (
    <div className="flex-1 min-w-[280px] max-w-[350px]">
      {/* 列标题 */}
      <div className={`flex items-center justify-between mb-3 px-1 ${
        columnHeaderColors[column.color]
      }`}>
        <h2 className="font-semibold text-sm">{column.title}</h2>
        <span className="text-xs px-2 py-0.5 bg-white/50 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* 可放置区域 */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`rounded-lg p-2 min-h-[500px] transition-colors ${
              columnColorClasses[column.color]
            } ${
              snapshot.isDraggingOver ? "ring-2 ring-blue-400 ring-opacity-50" : ""
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
            
            {/* 空状态提示 */}
            {tasks.length === 0 && (
              <div className="h-32 flex items-center justify-center text-gray-400 text-xs">
                暂无任务
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  )
}
