"use client"

import {
  LayoutDashboard,
  KanbanSquare,
  Calendar,
  FolderKanban,
  Brain,
  FileText,
  Users,
  ShieldCheck,
} from "lucide-react"

const menuItems = [
  { title: "驾驶舱", icon: LayoutDashboard, href: "/" },
  { title: "任务看板", icon: KanbanSquare, href: "/tasks" },
  { title: "日程日历", icon: Calendar, href: "/calendar" },
  { title: "项目管理", icon: FolderKanban, href: "/projects" },
  { title: "记忆管理", icon: Brain, href: "/memory" },
  { title: "文档中心", icon: FileText, href: "/documents" },
  { title: "团队管理", icon: Users, href: "/team" },
  { title: "日志与权限", icon: ShieldCheck, href: "/logs" },
]

export function AppSidebar() {
  return (
    <aside className="w-64 shrink-0 border-r bg-gray-50 min-h-screen p-4">
      <div className="mb-6">
        <h1 className="text-lg font-bold">Mission Control</h1>
        <p className="text-xs text-gray-500">OpenClaw 任务控制中心</p>
      </div>

      <nav className="space-y-1">
        {menuItems.map((item) => (
          <a
            key={item.title}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </a>
        ))}
      </nav>
    </aside>
  )
}
