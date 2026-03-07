"use client"

import { useState, useEffect, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Save, RotateCcw, Clock, CheckCircle, AlertCircle } from "lucide-react"

interface MemoryData {
  path: string
  exists: boolean
  content: {
    full: string | null
    preview: string | null
  } | null
  stats: {
    totalLines: number
    totalChars: number
    sections: number
  } | null
  metadata: {
    lastUpdated: string | null
    userName: string | null
  } | null
  message?: string
}

export default function MemoryPage() {
  const [content, setContent] = useState("")
  const [originalContent, setOriginalContent] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // 加载记忆内容
  useEffect(() => {
    loadMemory()
  }, [])

  async function loadMemory() {
    try {
      const res = await fetch("/api/memory/core")
      const json = await res.json()
      
      if (json.success && json.data.exists) {
        const fullContent = json.data.content?.full || ""
        setContent(fullContent)
        setOriginalContent(fullContent)
        setLastSaved(json.data.metadata?.lastUpdated)
      }
    } catch (error) {
      console.error("Failed to load memory:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 检测内容变化
  useEffect(() => {
    setHasChanges(content !== originalContent)
  }, [content, originalContent])

  // 保存记忆
  async function handleSave() {
    setIsSaving(true)
    setSaveStatus("idle")

    try {
      const res = await fetch("/api/memory/core", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })

      const json = await res.json()

      if (json.success) {
        setSaveStatus("success")
        setOriginalContent(content)
        setLastSaved(new Date().toISOString().split("T")[0])
        
        // 3 秒后重置状态
        setTimeout(() => {
          setSaveStatus("idle")
        }, 3000)
      } else {
        setSaveStatus("error")
      }
    } catch (error) {
      console.error("Failed to save memory:", error)
      setSaveStatus("error")
    } finally {
      setIsSaving(false)
    }
  }

  // 撤销更改
  function handleReset() {
    if (confirm("确定要放弃所有未保存的更改吗？")) {
      setContent(originalContent)
    }
  }

  // 键盘快捷键（Ctrl/Cmd + S 保存）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        if (hasChanges) {
          handleSave()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [hasChanges, content])

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RotateCcw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">加载记忆内容...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 flex flex-col">
        {/* 顶部操作栏 */}
        <header className="h-16 border-b flex items-center justify-between px-6 bg-white">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">记忆管理</h1>
            {lastSaved && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>上次同步：{lastSaved}</span>
              </div>
            )}
            {hasChanges && (
              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                未保存的更改
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                disabled={isSaving}
              >
                <RotateCcw className="h-4 w-4" />
                撤销更改
              </button>
            )}
            
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={`flex items-center gap-2 px-4 py-1.5 text-sm rounded-md transition-colors ${
                !hasChanges || isSaving
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isSaving ? (
                <RotateCcw className="h-4 w-4 animate-spin" />
              ) : saveStatus === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : saveStatus === "error" ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? "保存中..." : saveStatus === "success" ? "已保存" : "保存到 OpenClaw 大脑"}
            </button>
          </div>
        </header>

        {/* 双栏布局：编辑器 + 预览 */}
        <div className="flex-1 grid grid-cols-2 divide-x overflow-hidden">
          {/* 左侧：Markdown 编辑器 */}
          <div className="flex flex-col">
            <div className="h-10 border-b bg-gray-50 px-4 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Markdown 编辑器</span>
              <span className="text-xs text-gray-400">
                {content.split("\n").length} 行 · {content.length} 字符
              </span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 p-4 resize-none focus:outline-none font-mono text-sm leading-relaxed"
              placeholder="在此编辑 MEMORY.md 内容..."
              spellCheck={false}
            />
          </div>

          {/* 右侧：实时预览 */}
          <div className="flex flex-col overflow-hidden">
            <div className="h-10 border-b bg-gray-50 px-4 flex items-center">
              <span className="text-xs font-medium text-gray-600">实时预览</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <article className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </article>
            </div>
          </div>
        </div>

        {/* 底部状态栏 */}
        <footer className="h-10 border-t flex items-center justify-between px-6 text-xs text-gray-500 bg-white">
          <div className="flex items-center gap-4">
            {saveStatus === "success" && (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                记忆同步成功
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                保存失败，请重试
              </span>
            )}
          </div>
          <span>快捷键：Ctrl/Cmd + S 保存</span>
        </footer>
      </main>
    </div>
  )
}
