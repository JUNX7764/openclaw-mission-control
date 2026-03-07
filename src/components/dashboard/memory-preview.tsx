"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchMemoryCore } from "@/lib/api"

export function MemoryPreview() {
  const [memory, setMemory] = useState<{
    preview: string
    userName: string
    lastUpdated: string
    totalLines: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadMemory() {
      try {
        const res = await fetchMemoryCore()
        
        if (res.data.exists && res.data.content?.preview) {
          setMemory({
            preview: res.data.content.preview,
            userName: res.data.metadata?.userName || "未知用户",
            lastUpdated: res.data.metadata?.lastUpdated || "未知",
            totalLines: res.data.stats?.totalLines || 0,
          })
        }
        setIsLoading(false)
      } catch (err) {
        setError((err as Error).message)
        setIsLoading(false)
      }
    }

    loadMemory()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>核心记忆</CardTitle>
          <CardDescription>加载 MEMORY.md...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800">加载失败</CardTitle>
          <CardDescription className="text-red-600">{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!memory) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>核心记忆</CardTitle>
          <CardDescription>MEMORY.md 不存在或为空</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>核心记忆 (MEMORY.md)</CardTitle>
        <CardDescription>
          用户：{memory.userName} · 共 {memory.totalLines} 行 · 最后更新：{memory.lastUpdated}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono">
          {memory.preview}
        </pre>
      </CardContent>
    </Card>
  )
}
