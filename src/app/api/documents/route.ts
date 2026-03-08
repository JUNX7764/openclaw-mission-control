import { NextRequest, NextResponse } from "next/server";
import { stat } from "fs/promises";
import { basename, extname } from "path";
import { exec } from "child_process";
import { promisify } from "util";

export const dynamic = "force-dynamic";

const execAsync = promisify(exec);
const HOME_DIR = process.env.HOME || "~";
const SCAN_ROOT = `${HOME_DIR}/.openclaw`;

const CATEGORIES = [
  { id: "workflows", name: "核心工作流", emoji: "⚙️", description: "SOP、自动化流程、操作指南" },
  { id: "knowledge", name: "知识沉淀", emoji: "🧠", description: "策略、方法论、核心原则、记忆" },
  { id: "outputs", name: "项目产出", emoji: "📦", description: "报告、每日简报、交付物" },
  { id: "references", name: "参考资料", emoji: "📚", description: "外部文档、技术手册、最佳实践" },
];

const EXCLUDED_DIRS = [
  "node_modules", ".git", ".next", ".yarn",
  "extensions", "delivery-queue", "cron/runs", "media",
];

function buildFindCommand(): string {
  const excludePrunes = EXCLUDED_DIRS
    .map(d => `-path "*/${d}/*" -prune`)
    .join(" -o ");
  return `find "${SCAN_ROOT}" \\( ${excludePrunes} \\) -o -type f \\( -name "*.md" -o -name "*.pdf" \\) -print 2>/dev/null`;
}

function inferCategory(filePath: string): string {
  const p = filePath.toLowerCase();
  if (p.includes("/skills/") || p.includes("/hooks/") || p.includes("/cron/")) return "workflows";
  if (p.includes("/memory/") || p.includes("identity.md") || p.includes("heartbeat.md") || p.includes("/bootstrap")) return "knowledge";
  if (p.includes("/output/") || p.includes("/daily-report") || p.includes("/delivery") || p.includes("/news")) return "outputs";
  return "references";
}

function inferAuthor(filePath: string): { author: string; authorEmoji: string } {
  if (filePath.includes("/workspace-xiaozuoshou/") || filePath.includes("/agents/xiaozuoshou/"))
    return { author: "小作手", authorEmoji: "📈" };
  if (filePath.includes("/workspace/资讯员/") || filePath.includes("/agents/zixunyuan/"))
    return { author: "资讯员", authorEmoji: "📰" };
  if (filePath.includes("/workspace/") || filePath.includes("/agents/main/"))
    return { author: "二毛", authorEmoji: "🐱" };
  return { author: "System", authorEmoji: "🖥️" };
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function encodeId(filePath: string): string {
  return Buffer.from(filePath).toString("base64url");
}

export function decodeId(id: string): string {
  return Buffer.from(id, "base64url").toString("utf-8");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    // 1. Discover files via native find
    const { stdout } = await execAsync(buildFindCommand(), { maxBuffer: 10 * 1024 * 1024 });
    const filePaths = stdout.trim().split("\n").filter(Boolean);

    // 2. Stat each file and build document objects
    const docResults = await Promise.allSettled(
      filePaths.map(async (fp) => {
        const s = await stat(fp);
        const ext = extname(fp).toLowerCase().slice(1);
        const type = (ext === "md" ? "markdown" : ext === "pdf" ? "pdf" : "other") as "markdown" | "pdf" | "other";
        const catId = inferCategory(fp);
        const cat = CATEGORIES.find(c => c.id === catId)!;
        const { author, authorEmoji } = inferAuthor(fp);
        return {
          id: encodeId(fp),
          name: basename(fp),
          description: fp.replace(SCAN_ROOT, "~/.openclaw"),
          category: catId,
          categoryName: cat.name,
          type,
          size: s.size,
          sizeHuman: formatSize(s.size),
          updatedAt: s.mtime.toISOString(),
          author,
          authorEmoji,
          tags: [],
        };
      })
    );

    let documents = docResults
      .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
      .map(r => r.value);

    // 3. Filter
    if (category && category !== "all") {
      documents = documents.filter(d => d.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      documents = documents.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
      );
    }

    // 4. Sort by most recently modified
    documents.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const totalSize = documents.reduce((sum, d) => sum + d.size, 0);

    return NextResponse.json({
      success: true,
      data: {
        documents,
        categories: CATEGORIES,
        meta: {
          version: "2.0",
          lastUpdated: new Date().toISOString(),
          rootPath: SCAN_ROOT,
          totalDocuments: documents.length,
          totalSize,
          totalSizeHuman: formatSize(totalSize),
        },
      },
    });
  } catch (error) {
    console.error("Failed to scan documents:", error);
    return NextResponse.json(
      { success: false, error: "扫描文档失败", details: (error as Error).message },
      { status: 500 }
    );
  }
}
