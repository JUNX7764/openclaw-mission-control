"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  FolderKanban,
  Plus,
  Search,
  FileText,
  Download,
  Eye,
  Clock,
  HardDrive,
  User,
  X
} from "lucide-react"

interface Document {
  id: string
  name: string
  description?: string
  category: string
  categoryName: string
  type: "markdown" | "pdf" | "doc" | "other"
  size: number
  sizeHuman: string
  updatedAt: string
  author?: string
  authorEmoji?: string
  tags?: string[]
}

interface Category {
  id: string
  name: string
  emoji: string
  description: string
}

interface DocumentsData {
  documents: Document[]
  categories: Category[]
  meta: {
    version: string
    lastUpdated: string
    rootPath: string
    totalDocuments: number
    totalSize: number
    totalSizeHuman: string
  }
}

const categoryIcons: Record<string, string> = {
  workflows: "⚙️",
  knowledge: "🧠",
  outputs: "📦",
  references: "📚",
}

const typeIcons: Record<string, string> = {
  markdown: "📄",
  pdf: "📕",
  doc: "📘",
  other: "📁",
}

export default function DocumentsPage() {
  const [data, setData] = useState<DocumentsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [previewContent, setPreviewContent] = useState<string>("")
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)

  // 加载文档数据
  useEffect(() => {
    loadDocuments()
  }, [])

  async function loadDocuments() {
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== "all") params.set("category", selectedCategory)
      if (searchQuery) params.set("search", searchQuery)

      const res = await fetch(`/api/documents?${params}`)
      const json = await res.json()

      if (json.success) {
        setData(json.data)
      }
    } catch (error) {
      console.error("Failed to load documents:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 导入新文档（Toast 预告）
  function handleImportDocument() {
    alert("🚀 文档导入系统即将上线！\n\n未来你将可以：\n- 上传 Markdown/PDF/Word 文档\n- 自动归类到对应分类\n- 支持拖拽上传\n- 文档版本管理")
  }

  // 预览文档
  async function handlePreview(doc: Document) {
    setPreviewDoc(doc)
    setIsPreviewLoading(true)
    setPreviewContent("")

    try {
      const res = await fetch(`/api/documents/${doc.id}`)
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          setPreviewContent(json.data.content || "该文档似乎是空的。")
        } else {
          setPreviewContent(`获取内容失败: ${json.error}`)
        }
      } else {
        setPreviewContent("接口请求失败，请稍后再试。")
      }
    } catch (error) {
      console.error("Failed to fetch document preview:", error)
      setPreviewContent("网络发生异常，无法加载内容。")
    } finally {
      setIsPreviewLoading(false)
    }
  }

  // 下载文档
  function handleDownload(doc: Document) {
    window.open(`/api/documents/${doc.id}/download`, "_blank")
  }

  // 筛选文档
  const filteredDocuments = data?.documents.filter(d => {
    if (selectedCategory !== "all" && d.category !== selectedCategory) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return d.name.toLowerCase().includes(query) ||
        d.description?.toLowerCase().includes(query) ||
        d.tags?.some(t => t.toLowerCase().includes(query))
    }
    return true
  }) || []

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FolderKanban className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">加载文档库...</p>
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
            <h1 className="text-lg font-semibold">文档中心</h1>
            <span className="text-sm text-gray-500">
              {data?.meta.totalDocuments || 0} 个文档 · {data?.meta.totalSizeHuman || "0 B"}
            </span>
          </div>
          <button
            onClick={handleImportDocument}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            导入新文档
          </button>
        </header>

        {/* 内容区 */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* 左侧：分类导航 */}
            <div className="lg:col-span-3 space-y-4">
              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索文档..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* 分类列表 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>文档分类</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedCategory("all")
                      loadDocuments()
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedCategory === "all"
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-gray-100 text-gray-700"
                      }`}
                  >
                    📂 全部分类
                  </button>

                  {data?.categories.map((category) => {
                    const count = data.documents.filter(d => d.category === category.id).length
                    return (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategory(category.id)
                          loadDocuments()
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedCategory === category.id
                          ? "bg-blue-100 text-blue-700"
                          : "hover:bg-gray-100 text-gray-700"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>
                            {category.emoji} {category.name}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {count}
                          </Badge>
                        </div>
                      </button>
                    )
                  })}
                </CardContent>
              </Card>

              {/* 统计信息 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>存储统计</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>总文档数</span>
                    <span className="font-medium">{data?.meta.totalDocuments || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span>总大小</span>
                    <span className="font-medium">{data?.meta.totalSizeHuman || "0 B"}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span>根目录</span>
                    <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">docs/</code>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 右侧：文档列表 */}
            <div className="lg:col-span-9">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">
                        {selectedCategory === "all" ? "全部文档" : data?.categories.find(c => c.id === selectedCategory)?.name}
                      </h2>
                      <CardDescription>
                        {filteredDocuments.length} 个文档
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>按更新时间排序</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredDocuments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredDocuments.map((doc) => (
                        <DocumentCard
                          key={doc.id}
                          doc={doc}
                          onPreview={handlePreview}
                          onDownload={handleDownload}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <FolderKanban className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">暂无文档</p>
                      <p className="text-sm text-gray-400 mt-2">点击"导入新文档"添加</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* 底部说明 */}
        <footer className="h-12 border-t bg-white flex items-center justify-center px-6 text-xs text-gray-500">
          <span>💡 提示：文档存储在 ~/.openclaw/workspace/mission-control/docs/</span>
        </footer>
        {/* 预览弹窗 (Preview Modal) */}
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-lg">
                    {typeIcons[previewDoc.type] || typeIcons.other}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{previewDoc.name}</h3>
                    <p className="text-xs text-gray-500">
                      {previewDoc.authorEmoji || "🤖"} {previewDoc.author} · {previewDoc.sizeHuman}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6 bg-white">
                {isPreviewLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <FolderKanban className="h-8 w-8 animate-spin text-gray-300 mb-4" />
                    <p className="text-gray-500 text-sm">正在加载文档内容...</p>
                  </div>
                ) : (
                  <div className="prose prose-sm md:prose-base max-w-none text-gray-800">
                    {/* For simplicity we dump the raw markdown/text into a pre formatted block 
                          Ideally we would use react-markdown here */}
                    <pre className="whitespace-pre-wrap font-sans bg-gray-50 p-6 rounded-lg border text-sm leading-relaxed overflow-x-auto">
                      {previewContent}
                    </pre>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
                <button
                  onClick={() => handleDownload(previewDoc)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  下载原文件
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

// 文档卡片组件
interface DocumentCardProps {
  doc: Document
  onPreview: (doc: Document) => void
  onDownload: (doc: Document) => void
}

function DocumentCard({ doc, onPreview, onDownload }: DocumentCardProps) {
  const typeIcon = typeIcons[doc.type] || typeIcons.other

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) return "刚刚"
    if (hours < 24) return `${hours}小时前`
    const days = Math.floor(hours / 24)
    return `${days}天前`
  }

  return (
    <Card className="group hover:shadow-md transition-all duration-200 hover:-translate-y-1 border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* 文件图标 */}
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl shrink-0">
            {typeIcon}
          </div>

          {/* 文件信息 */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {doc.name}
            </h3>
            <p className="text-xs text-gray-500 line-clamp-2 mt-1">
              {doc.description}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 作者 + 时间 */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{doc.authorEmoji || "🤖"} {doc.author}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatRelativeTime(doc.updatedAt)}</span>
          </div>
        </div>

        {/* Tags */}
        {doc.tags && doc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {doc.tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <HardDrive className="h-3 w-3" />
            <span>{doc.sizeHuman}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPreview(doc)}
              className="flex items-center gap-1 text-xs px-2 py-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <Eye className="h-3 w-3" />
              预览
            </button>
            <button
              onClick={() => onDownload(doc)}
              className="flex items-center gap-1 text-xs px-2 py-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
            >
              <Download className="h-3 w-3" />
              下载
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
