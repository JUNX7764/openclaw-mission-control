import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";

interface Project {
  id: string;
  name: string;
  description: string;
  owner: string;
  ownerName: string;
  ownerEmoji?: string;
  status: "active" | "urgent" | "at-risk" | "archived";
  progress: number;
  taskIds: string[];
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

interface ProjectsData {
  projects: Project[];
  meta: {
    version: string;
    lastUpdated: string;
  };
}

const PROJECTS_FILE_PATH = join(process.env.HOME || "~", ".openclaw/workspace/mission-control/data/projects.json");

async function ensureDataDirectory() {
  const dir = dirname(PROJECTS_FILE_PATH);
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    // 目录可能已存在，忽略错误
  }
}

async function readProjectsFile(): Promise<ProjectsData> {
  try {
    const content = await readFile(PROJECTS_FILE_PATH, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      // 文件不存在，返回空数据结构
      return {
        projects: [],
        meta: {
          version: "1.0",
          lastUpdated: new Date().toISOString(),
        },
      };
    }
    throw error;
  }
}

async function writeProjectsFile(data: ProjectsData) {
  await ensureDataDirectory();
  const content = JSON.stringify(data, null, 2);
  await writeFile(PROJECTS_FILE_PATH, content, "utf-8");
}

// GET - 读取所有项目
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");
    
    const data = await readProjectsFile();
    
    let projects = data.projects;
    
    // 状态筛选
    if (statusFilter && statusFilter !== "all") {
      projects = projects.filter(p => p.status === statusFilter);
    }
    
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Failed to read projects:", error);
    return NextResponse.json(
      {
        success: false,
        error: "读取项目数据失败",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// POST - 创建新项目
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await readProjectsFile();

    const newProject: Project = {
      id: body.id || `proj-${Date.now()}`,
      name: body.name,
      description: body.description || "",
      owner: body.owner || "main",
      ownerName: body.ownerName || "二毛",
      ownerEmoji: body.ownerEmoji || "🐱",
      status: body.status || "active",
      progress: body.progress || 0,
      taskIds: body.taskIds || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: body.tags || [],
    };

    data.projects.push(newProject);
    data.meta.lastUpdated = new Date().toISOString();

    await writeProjectsFile(data);

    return NextResponse.json({
      success: true,
      data: {
        project: newProject,
      },
    });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json(
      {
        success: false,
        error: "创建项目失败",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
