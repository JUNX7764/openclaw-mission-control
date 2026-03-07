import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  agentId?: string;
  agentName?: string;
  agentEmoji?: string;
  type: "cron" | "milestone" | "personal";
  startTime: string;
  endTime: string;
  cronExpression?: string;
  cronHuman?: string;
  color: "purple" | "blue" | "green";
  recurring: boolean;
}

interface CalendarData {
  events: CalendarEvent[];
  meta: {
    version: string;
    lastUpdated: string;
    timezone: string;
  };
}

const CALENDAR_FILE_PATH = join(process.env.HOME || "~", ".openclaw/workspace/mission-control/data/calendar.json");

async function ensureDataDirectory() {
  const dir = dirname(CALENDAR_FILE_PATH);
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    // 目录可能已存在，忽略错误
  }
}

async function readCalendarFile(): Promise<CalendarData> {
  try {
    const content = await readFile(CALENDAR_FILE_PATH, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      // 文件不存在，返回空数据结构
      return {
        events: [],
        meta: {
          version: "1.0",
          lastUpdated: new Date().toISOString(),
          timezone: "Asia/Shanghai",
        },
      };
    }
    throw error;
  }
}

async function writeCalendarFile(data: CalendarData) {
  await ensureDataDirectory();
  const content = JSON.stringify(data, null, 2);
  await writeFile(CALENDAR_FILE_PATH, content, "utf-8");
}

// GET - 读取日程（支持日期筛选）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const type = searchParams.get("type");
    
    const data = await readCalendarFile();
    
    let events = data.events;
    
    // 日期筛选（格式：YYYY-MM-DD）
    if (date) {
      events = events.filter(e => e.startTime.startsWith(date));
    }
    
    // 类型筛选
    if (type && type !== "all") {
      events = events.filter(e => e.type === type);
    }
    
    // 按时间排序
    events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Failed to read calendar:", error);
    return NextResponse.json(
      {
        success: false,
        error: "读取日程数据失败",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// POST - 创建新日程
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await readCalendarFile();

    const newEvent: CalendarEvent = {
      id: body.id || `evt-${Date.now()}`,
      title: body.title,
      description: body.description || "",
      agentId: body.agentId,
      agentName: body.agentName || "二毛",
      agentEmoji: body.agentEmoji || "🐱",
      type: body.type || "personal",
      startTime: body.startTime,
      endTime: body.endTime || body.startTime,
      cronExpression: body.cronExpression,
      cronHuman: body.cronHuman,
      color: body.color || "green",
      recurring: body.recurring || false,
    };

    data.events.push(newEvent);
    data.meta.lastUpdated = new Date().toISOString();

    await writeCalendarFile(data);

    return NextResponse.json({
      success: true,
      data: {
        event: newEvent,
      },
    });
  } catch (error) {
    console.error("Failed to create event:", error);
    return NextResponse.json(
      {
        success: false,
        error: "创建日程失败",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
