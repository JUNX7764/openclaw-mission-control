"use client"

import { useState, useEffect } from "react"
import { format, parseISO, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { zhCN } from "date-fns/locale"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Timer,
  Target,
  User,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

interface CalendarEvent {
  id: string
  title: string
  description?: string
  agentId?: string
  agentName?: string
  agentEmoji?: string
  type: "cron" | "milestone" | "personal"
  startTime: string
  endTime: string
  cronExpression?: string
  cronHuman?: string
  color: "purple" | "blue" | "green"
  recurring: boolean
}

interface CalendarData {
  events: CalendarEvent[]
  meta: {
    version: string
    lastUpdated: string
    timezone: string
  }
}

const typeConfig = {
  cron: { label: "AI 定时任务", color: "bg-purple-100 text-purple-700 border-purple-200", icon: Timer },
  milestone: { label: "项目里程碑", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Target },
  personal: { label: "个人日程", color: "bg-green-100 text-green-700 border-green-200", icon: User },
}

export default function CalendarPage() {
  const [data, setData] = useState<CalendarData | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(true)

  // 加载日程数据
  useEffect(() => {
    loadCalendar()
  }, [])

  async function loadCalendar() {
    try {
      const res = await fetch("/api/calendar")
      const json = await res.json()
      
      if (json.success) {
        setData(json.data)
      }
    } catch (error) {
      console.error("Failed to load calendar:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 创建新日程（Toast 预告）
  function handleCreateEvent() {
    alert("🚀 日程创建系统即将上线！\n\n未来你将可以：\n- 创建 AI 定时任务（Cron Job）\n- 设置项目里程碑\n- 添加个人日程提醒")
  }

  // 获取选中日期的事件
  const selectedEvents = data?.events.filter(e => 
    isSameDay(parseISO(e.startTime), selectedDate)
  ) || []

  // 按时间排序
  selectedEvents.sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

  // 获取有事件的日期（用于日历标记）
  const eventDates = data?.events.map(e => parseISO(e.startTime)) || []

  // 月份导航
  function handlePreviousMonth() {
    setCurrentMonth(prev => subMonths(prev, 1))
  }

  function handleNextMonth() {
    setCurrentMonth(prev => addMonths(prev, 1))
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <CalendarIcon className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">加载日程日历...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AppSidebar />
      <main className="flex-1 flex flex-col">
        {/* 顶部操作区 */}
        <header className="h-16 border-b bg-white flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">日程日历</h1>
            <span className="text-sm text-gray-500">
              {data?.events.length || 0} 个日程 · {selectedEvents.length} 个选中
            </span>
          </div>
          <button
            onClick={handleCreateEvent}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            新建日程
          </button>
        </header>

        {/* 内容区 */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 左侧：日历组件 */}
            <div className="lg:col-span-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="font-medium">
                      {format(currentMonth, "yyyy 年 M 月", { locale: zhCN })}
                    </CardDescription>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handlePreviousMonth}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleNextMonth}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    locale={zhCN}
                    className="rounded-md border"
                    modifiers={{
                      event: eventDates
                    }}
                    modifiersStyles={{
                      event: { 
                        fontWeight: 'bold',
                        textDecoration: 'underline',
                        textDecorationColor: '#3b82f6'
                      }
                    }}
                  />
                </CardContent>
              </Card>

              {/* 图例说明 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>事件类型</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(typeConfig).map(([key, config]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className={config.color}>
                        <config.icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* 右侧：日程列表 */}
            <div className="lg:col-span-8">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">
                        {format(selectedDate, "M 月 d 日", { locale: zhCN })}
                      </h2>
                      <CardDescription>
                        {selectedEvents.length} 个日程
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>Asia/Shanghai (UTC+8)</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedEvents.length > 0 ? (
                    <div className="space-y-3">
                      {selectedEvents.map((event) => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">这天暂无日程</p>
                      <p className="text-sm text-gray-400 mt-2">点击"新建日程"添加</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* 底部说明 */}
        <footer className="h-12 border-t bg-white flex items-center justify-center px-6 text-xs text-gray-500">
          <span>💡 提示：日程数据存储在 ~/.openclaw/workspace/mission-control/data/calendar.json</span>
        </footer>
      </main>
    </div>
  )
}

// 日程卡片组件
interface EventCardProps {
  event: CalendarEvent
}

function EventCard({ event }: EventCardProps) {
  const config = typeConfig[event.type]
  const Icon = config.icon

  const formatTime = (dateString: string) => {
    return format(parseISO(dateString), "HH:mm", { locale: zhCN })
  }

  return (
    <Card className="group hover:shadow-md transition-shadow border-l-4" style={{
      borderLeftColor: event.color === "purple" ? "#a855f7" : event.color === "blue" ? "#3b82f6" : "#22c55e"
    }}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Badge variant="outline" className={`${config.color} shrink-0`}>
              <Icon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
            {event.recurring && (
              <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600">
                <RefreshCw className="h-3 w-3 mr-1" />
                周期性
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 标题 */}
        <h3 className="font-semibold text-gray-900">{event.title}</h3>

        {/* 描述 */}
        {event.description && (
          <p className="text-sm text-gray-600">{event.description}</p>
        )}

        {/* 负责人 + Cron 表达式 */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-lg">{event.agentEmoji || "🤖"}</span>
            <span>{event.agentName}</span>
          </div>
          
          {event.cronExpression && (
            <div className="flex items-center gap-2 text-gray-500">
              <Timer className="h-3 w-3" />
              <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{event.cronExpression}</code>
              <span className="text-xs">（{event.cronHuman}）</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
