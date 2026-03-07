import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, copyFile } from "fs/promises";
import { join } from "path";

// GET - 读取记忆文件
export async function GET() {
  try {
    // main agent 的 workspace 默认在 ~/.openclaw/workspace
    const workspacePath = join(process.env.HOME || "~", ".openclaw/workspace");
    const memoryPath = join(workspacePath, "MEMORY.md");

    const content = await readFile(memoryPath, "utf-8");

    // 解析 MEMORY.md 的基本信息
    const lines = content.split("\n");
    const preview = lines.slice(0, 20).join("\n"); // 前 20 行预览
    const totalLines = lines.length;
    const totalChars = content.length;

    // 尝试提取最后更新时间（从文件末尾的"最后更新：YYYY-MM-DD"）
    const lastUpdateMatch = content.match(/最后更新：(\d{4}-\d{2}-\d{2})/);
    const lastUpdated = lastUpdateMatch ? lastUpdateMatch[1] : null;

    // 尝试提取用户核心信息
    const userNameMatch = content.match(/姓名：(.+?)(?:\n|$)/);
    const userName = userNameMatch ? userNameMatch[1].trim() : null;

    // 尝试提取关键事实数量（统计"### "标题数量作为粗略估计）
    const sectionCount = (content.match(/^### /gm) || []).length;

    return NextResponse.json({
      success: true,
      data: {
        path: memoryPath,
        exists: true,
        content: {
          full: content,
          preview: preview,
        },
        stats: {
          totalLines,
          totalChars,
          sections: sectionCount,
        },
        metadata: {
          lastUpdated,
          userName,
        },
      },
    });
  } catch (error) {
    console.error("Failed to read MEMORY.md:", error);

    // 容错处理：文件不存在
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({
        success: true,
        data: {
          path: join(process.env.HOME || "~", ".openclaw/workspace/MEMORY.md"),
          exists: false,
          content: null,
          stats: null,
          metadata: null,
          message: "MEMORY.md 文件不存在，可能是新安装的 OpenClaw 或记忆系统未启用",
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "读取记忆文件失败",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// POST/PUT - 写入记忆文件（带备份）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少内容",
        },
        { status: 400 }
      );
    }

    const workspacePath = join(process.env.HOME || "~", ".openclaw/workspace");
    const memoryPath = join(workspacePath, "MEMORY.md");
    const backupPath = join(workspacePath, "MEMORY.bak.md");

    // 备份旧文件（如果存在）
    try {
      await copyFile(memoryPath, backupPath);
      console.log("Backup created:", backupPath);
    } catch (backupError) {
      // 文件不存在时忽略备份错误
      if ((backupError as NodeJS.ErrnoException).code !== "ENOENT") {
        console.warn("Backup failed, continuing anyway:", backupError);
      }
    }

    // 写入新内容
    await writeFile(memoryPath, content, "utf-8");

    // 更新最后更新时间
    const now = new Date().toISOString();
    const updatedContent = content.replace(
      /最后更新：\d{4}-\d{2}-\d{2}/,
      `最后更新：${now.split("T")[0]}`
    );
    
    if (updatedContent !== content) {
      await writeFile(memoryPath, updatedContent, "utf-8");
    }

    return NextResponse.json({
      success: true,
      data: {
        message: "记忆保存成功",
        backupPath: backupPath,
        updatedAt: now,
      },
    });
  } catch (error) {
    console.error("Failed to write MEMORY.md:", error);
    return NextResponse.json(
      {
        success: false,
        error: "写入记忆文件失败",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
