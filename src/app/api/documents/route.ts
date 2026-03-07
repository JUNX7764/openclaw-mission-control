import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

interface Document {
  id: string;
  name: string;
  description?: string;
  category: string;
  categoryName: string;
  type: "markdown" | "pdf" | "doc" | "other";
  size: number;
  sizeHuman: string;
  updatedAt: string;
  author?: string;
  authorEmoji?: string;
  tags?: string[];
}

interface DocumentsData {
  documents: Document[];
  categories: Array<{
    id: string;
    name: string;
    emoji: string;
    description: string;
  }>;
  meta: {
    version: string;
    lastUpdated: string;
    rootPath: string;
    totalDocuments: number;
    totalSize: number;
    totalSizeHuman: string;
  };
}

const DOCUMENTS_FILE_PATH = join(process.env.HOME || "~", ".openclaw/workspace/mission-control/data/documents.json");

async function readDocumentsFile(): Promise<DocumentsData> {
  try {
    const content = await readFile(DOCUMENTS_FILE_PATH, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      // 文件不存在，返回空数据结构
      return {
        documents: [],
        categories: [
          { id: "workflows", name: "核心工作流", emoji: "⚙️", description: "SOP、自动化流程、操作指南" },
          { id: "knowledge", name: "知识沉淀", emoji: "🧠", description: "策略、方法论、核心原则" },
          { id: "outputs", name: "项目产出", emoji: "📦", description: "报告、模板、交付物" },
          { id: "references", name: "参考资料", emoji: "📚", description: "外部文档、技术手册、最佳实践" },
        ],
        meta: {
          version: "1.0",
          lastUpdated: new Date().toISOString(),
          rootPath: "~/.openclaw/workspace/mission-control/docs",
          totalDocuments: 0,
          totalSize: 0,
          totalSizeHuman: "0 B",
        },
      };
    }
    throw error;
  }
}

// GET - 读取文档列表（支持分类筛选）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    
    const data = await readDocumentsFile();
    
    let documents = data.documents;
    
    // 分类筛选
    if (category && category !== "all") {
      documents = documents.filter(d => d.category === category);
    }
    
    // 类型筛选
    if (type && type !== "all") {
      documents = documents.filter(d => d.type === type);
    }
    
    // 搜索（按文件名或描述）
    if (search) {
      const searchLower = search.toLowerCase();
      documents = documents.filter(d => 
        d.name.toLowerCase().includes(searchLower) ||
        d.description?.toLowerCase().includes(searchLower) ||
        d.tags?.some(t => t.toLowerCase().includes(searchLower))
      );
    }
    
    // 按更新时间排序（最新的在前）
    documents.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    
    return NextResponse.json({
      success: true,
      data: {
        ...data,
        documents,
      },
    });
  } catch (error) {
    console.error("Failed to read documents:", error);
    return NextResponse.json(
      {
        success: false,
        error: "读取文档数据失败",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
