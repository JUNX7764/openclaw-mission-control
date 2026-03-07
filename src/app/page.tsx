import { AppSidebar } from "@/components/layout/app-sidebar"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"
import { AgentList } from "@/components/dashboard/agent-list"
import { MemoryPreview } from "@/components/dashboard/memory-preview"

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1">
        <header className="h-16 border-b flex items-center px-6">
          <h1 className="text-lg font-semibold">驾驶舱</h1>
        </header>

        <div className="p-6 space-y-6">
          {/* 核心数据概览 */}
          <section>
            <h2 className="text-sm font-medium text-gray-500 mb-4">
              核心数据
            </h2>
            <DashboardOverview />
          </section>

          {/* 智能体团队 + 核心记忆 */}
          <section className="grid gap-6 md:grid-cols-2">
            <AgentList />
            <MemoryPreview />
          </section>
        </div>
      </main>
    </div>
  )
}
