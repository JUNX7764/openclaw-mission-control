import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

interface OpenClawConfig {
  channels?: {
    feishu?: {
      accounts?: Record<string, { appId?: string; appSecret?: string }>;
    };
  };
  gateway?: {
    mode?: string;
    auth?: {
      mode?: string;
    };
  };
  models?: {
    providers?: Record<string, { baseUrl?: string; apiKey?: string }>;
  };
  memory?: {
    backend?: string;
  };
  update?: {
    channel?: string;
    checkOnStart?: boolean;
  };
  meta?: {
    lastTouchedVersion?: string;
    lastTouchedAt?: string;
  };
}

export async function GET() {
  try {
    const configPath = join(process.env.HOME || "~", ".openclaw/openclaw.json");
    const configContent = await readFile(configPath, "utf-8");
    const config: OpenClawConfig = JSON.parse(configContent);

    // 提取 Feishu 账号信息
    const feishuAccounts = config.channels?.feishu?.accounts || {};
    const accountList = Object.entries(feishuAccounts).map(([key, value]) => ({
      id: key,
      appId: value.appId,
      // 不返回 appSecret，避免敏感信息泄露
    }));

    // 提取模型提供商信息
    const modelProviders = config.models?.providers || {};
    const providerList = Object.entries(modelProviders).map(([key, value]) => ({
      id: key,
      baseUrl: value.baseUrl,
      // 不返回 apiKey，避免敏感信息泄露
    }));

    // 提取网关配置
    const gatewayConfig = {
      mode: config.gateway?.mode || "unknown",
      authMode: config.gateway?.auth?.mode || "none",
    };

    // 提取内存后端配置
    const memoryConfig = {
      backend: config.memory?.backend || "unknown",
    };

    // 提取更新配置
    const updateConfig = {
      channel: config.update?.channel || "stable",
      checkOnStart: config.update?.checkOnStart || false,
    };

    // 提取版本信息
    const metaInfo = {
      version: config.meta?.lastTouchedVersion || "unknown",
      lastUpdated: config.meta?.lastTouchedAt || null,
    };

    return NextResponse.json({
      success: true,
      data: {
        channels: {
          feishu: {
            accounts: accountList,
            total: accountList.length,
          },
        },
        gateway: gatewayConfig,
        memory: memoryConfig,
        update: updateConfig,
        meta: metaInfo,
        models: {
          providers: providerList,
          total: providerList.length,
        },
      },
    });
  } catch (error) {
    console.error("Failed to read system config:", error);

    // 容错处理
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({
        success: true,
        data: {
          message: "OpenClaw 配置文件未找到",
          channels: { feishu: { accounts: [], total: 0 } },
          gateway: { mode: "unknown", authMode: "unknown" },
          memory: { backend: "unknown" },
          update: { channel: "stable", checkOnStart: false },
          meta: { version: "unknown", lastUpdated: null },
          models: { providers: [], total: 0 },
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "读取系统配置失败",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
