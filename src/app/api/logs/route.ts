import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

interface Log {
  id: string;
  level: "INFO" | "WARN" | "ERROR";
  subsystem: string;
  message: string;
  timestamp: string;
  source: string;
}

interface Permissions {
  allowOutboundMessages: boolean;
  allowApiPayments: boolean;
  allowRiskyCommands: boolean;
}

interface LogsData {
  logs: Log[];
  permissions: Permissions;
  meta: {
    version: string;
    lastUpdated: string;
    totalLogs: number;
    logRetentionDays: number;
  };
}

const LOGS_FILE_PATH = join(process.env.HOME || "~", ".openclaw/workspace/mission-control/data/logs.json");

async function readLogsFile(): Promise<LogsData> {
  try {
    const content = await readFile(LOGS_FILE_PATH, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        logs: [],
        permissions: {
          allowOutboundMessages: false,
          allowApiPayments: true,
          allowRiskyCommands: true,
        },
        meta: {
          version: "1.0",
          lastUpdated: new Date().toISOString(),
          totalLogs: 0,
          logRetentionDays: 30,
        },
      };
    }
    throw error;
  }
}

async function writeLogsFile(data: LogsData) {
  const content = JSON.stringify(data, null, 2);
  await writeFile(LOGS_FILE_PATH, content, "utf-8");
}

// GET - 读取日志（支持筛选）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level");
    const subsystem = searchParams.get("subsystem");
    const limit = parseInt(searchParams.get("limit") || "50");
    
    const data = await readLogsFile();
    
    let logs = data.logs;
    
    // 级别筛选
    if (level && level !== "all") {
      logs = logs.filter(l => l.level === level);
    }
    
    // 子系统筛选
    if (subsystem && subsystem !== "all") {
      logs = logs.filter(l => l.subsystem === subsystem);
    }
    
    // 按时间倒序（最新的在前）
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // 限制数量
    logs = logs.slice(0, limit);
    
    return NextResponse.json({
      success: true,
      data: {
        ...data,
        logs,
      },
    });
  } catch (error) {
    console.error("Failed to read logs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "读取日志数据失败",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// PUT - 更新权限设置
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await readLogsFile();
    
    // 更新权限
    if (body.permissions) {
      data.permissions = {
        ...data.permissions,
        ...body.permissions,
      };
    }
    
    data.meta.lastUpdated = new Date().toISOString();
    
    await writeLogsFile(data);
    
    return NextResponse.json({
      success: true,
      data: {
        permissions: data.permissions,
      },
    });
  } catch (error) {
    console.error("Failed to update permissions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "更新权限失败",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
