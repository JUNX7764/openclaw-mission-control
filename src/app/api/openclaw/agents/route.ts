import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

interface Agent {
  id: string;
  name?: string;
  workspace?: string;
  model?: string;
  default?: boolean;
  identity?: {
    name?: string;
    emoji?: string;
  };
  agentDir?: string;
  subagents?: {
    allowAgents?: string[];
  };
}

interface OpenClawConfig {
  agents?: {
    list?: Agent[];
  };
}

export async function GET() {
  try {
    const configPath = join(process.env.HOME || "~", ".openclaw/openclaw.json");
    const configContent = await readFile(configPath, "utf-8");
    const config: OpenClawConfig = JSON.parse(configContent);

    const agents = config.agents?.list || [];

    // 格式化返回数据
    const formattedAgents = agents.map((agent) => ({
      id: agent.id,
      name: agent.identity?.name || agent.name || agent.id,
      emoji: agent.identity?.emoji,
      workspace: agent.workspace,
      model: agent.model,
      isDefault: agent.default || false,
      agentDir: agent.agentDir,
      allowAgents: agent.subagents?.allowAgents,
    }));

    return NextResponse.json({
      success: true,
      data: {
        agents: formattedAgents,
        total: formattedAgents.length,
      },
    });
  } catch (error) {
    console.error("Failed to read openclaw.json:", error);
    
    // 容错处理：文件不存在时返回空列表
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({
        success: true,
        data: {
          agents: [],
          total: 0,
          message: "OpenClaw 配置文件未找到，请确认已正确安装 OpenClaw",
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "读取 OpenClaw 配置失败",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
