import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";

export const dynamic = "force-dynamic";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  agentId: string;
  agentName: string;
  agentEmoji?: string;
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

interface TasksData {
  tasks: Task[];
  columns: Record<string, { id: string; title: string; color: string }>;
  meta: {
    version: string;
    lastUpdated: string;
  };
}

const TASKS_FILE_PATH = join(process.env.HOME || "~", ".openclaw/workspace/mission-control/data/tasks.json");

async function ensureDataDirectory() {
  const dir = dirname(TASKS_FILE_PATH);
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    // 目录可能已存在，忽略错误
  }
}

async function readTasksFile(): Promise<TasksData> {
  try {
    const content = await readFile(TASKS_FILE_PATH, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      // 文件不存在，返回空数据结构
      return {
        tasks: [],
        columns: {
          todo: { id: "todo", title: "待分配", color: "gray" },
          "in-progress": { id: "in-progress", title: "执行中", color: "blue" },
          reviewing: { id: "reviewing", title: "待我确认", color: "amber" },
          done: { id: "done", title: "已完成", color: "green" },
          archived: { id: "archived", title: "已归档", color: "slate" },
        },
        meta: {
          version: "1.0",
          lastUpdated: new Date().toISOString(),
        },
      };
    }
    throw error;
  }
}

async function writeTasksFile(data: TasksData) {
  await ensureDataDirectory();
  const content = JSON.stringify(data, null, 2);
  await writeFile(TASKS_FILE_PATH, content, "utf-8");
}

// GET - 读取所有任务
export async function GET() {
  try {
    const data = await readTasksFile();
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Failed to read tasks:", error);
    return NextResponse.json(
      {
        success: false,
        error: "读取任务数据失败",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// POST - 创建新任务
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await readTasksFile();

    const newTask: Task = {
      id: body.id || `task-${Date.now()}`,
      title: body.title,
      description: body.description || "",
      status: body.status || "todo",
      agentId: body.agentId,
      agentName: body.agentName,
      agentEmoji: body.agentEmoji,
      priority: body.priority || "medium",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: body.tags || [],
    };

    data.tasks.push(newTask);
    data.meta.lastUpdated = new Date().toISOString();

    await writeTasksFile(data);

    return NextResponse.json({
      success: true,
      data: {
        task: newTask,
      },
    });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json(
      {
        success: false,
        error: "创建任务失败",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// PUT - 更新任务（包括拖拽改变状态）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await readTasksFile();

    const taskIndex = data.tasks.findIndex((t) => t.id === body.id);
    if (taskIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "任务不存在",
        },
        { status: 404 }
      );
    }

    // 更新任务字段
    const updatedTask = {
      ...data.tasks[taskIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    data.tasks[taskIndex] = updatedTask;
    data.meta.lastUpdated = new Date().toISOString();

    await writeTasksFile(data);

    return NextResponse.json({
      success: true,
      data: {
        task: updatedTask,
      },
    });
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json(
      {
        success: false,
        error: "更新任务失败",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
