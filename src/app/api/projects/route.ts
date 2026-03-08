import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";

export const dynamic = "force-dynamic";

interface Project {
  id: string;
  name: string;
  description: string;
  owner: string;
  ownerName: string;
  ownerEmoji?: string;
  status: "active" | "urgent" | "at-risk" | "archived";
  progress: number;
  progressOverride?: number | null; // 手动覆盖进度 (-1 或 null 表示使用自动计算)
  lastProgressCalcAt?: string;      // 最后计算时间
  taskIds: string[];
  createdAt: string;
  updatedAt: string;
  tags?: string[];

  // 仅在 GET 时附加的计算属性
  taskDistribution?: {
    todo: number;
    "in-progress": number;
    reviewing: number;
    done: number;
    archived: number;
  };
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

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const TASKS_FILE_PATH = join(process.env.HOME || "~", ".openclaw/workspace/mission-control/data/tasks.json");

async function readTasksFile(): Promise<{ tasks: any[] }> {
  try {
    const content = await readFile(TASKS_FILE_PATH, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { tasks: [] };
    }
    throw error;
  }
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

    // 动态计算所有项目的进度
    const tasksData = await readTasksFile();
    const allTasks = tasksData.tasks || [];
    const now = new Date().toISOString();

    projects = projects.map(p => {
      // 特殊逻辑：如果有 override，直接用
      if (p.progressOverride !== undefined && p.progressOverride !== null && p.progressOverride >= 0) {
        p.progress = p.progressOverride;
        p.lastProgressCalcAt = now;
        return p;
      }

      // 自动计算进度
      let todo = 0, inProgress = 0, reviewing = 0, done = 0, archived = 0;

      p.taskIds.forEach(tId => {
        const t = allTasks.find(x => x.id === tId);
        if (t) {
          if (t.status === "todo") todo++;
          else if (t.status === "in-progress") inProgress++;
          else if (t.status === "reviewing") reviewing++;
          else if (t.status === "done") done++;
          else if (t.status === "archived") archived++;
        }
      });

      const totalTasks = todo + inProgress + reviewing + done + archived;
      if (totalTasks > 0) {
        const completed = done + archived;
        p.progress = Math.round((completed / totalTasks) * 100);
      } else {
        // 如果没有关联任何任务，保持为 0 或者使用原来的静态值(兜底)
        p.progress = p.taskIds.length === 0 ? 0 : p.progress;
      }

      p.lastProgressCalcAt = now;
      p.taskDistribution = {
        todo,
        "in-progress": inProgress,
        reviewing,
        done,
        archived
      };

      return p;
    });

    return NextResponse.json({
      success: true,
      data: {
        projects: projects,
        meta: data.meta
      },
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
      progressOverride: body.progressOverride || null,
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
