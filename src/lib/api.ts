// API 客户端工具函数

export interface Agent {
  id: string;
  name: string;
  emoji?: string;
  workspace?: string;
  model?: string;
  isDefault: boolean;
  allowAgents?: string[];
}

export interface AgentsResponse {
  success: boolean;
  data: {
    agents: Agent[];
    total: number;
    message?: string;
  };
}

export interface SystemResponse {
  success: boolean;
  data: {
    channels: {
      feishu: {
        accounts: Array<{ id: string; appId: string }>;
        total: number;
      };
    };
    gateway: {
      mode: string;
      authMode: string;
    };
    memory: {
      backend: string;
    };
    update: {
      channel: string;
      checkOnStart: boolean;
    };
    meta: {
      version: string;
      lastUpdated: string | null;
    };
    models: {
      providers: Array<{ id: string; baseUrl: string }>;
      total: number;
    };
  };
}

export interface MemoryCoreResponse {
  success: boolean;
  data: {
    path: string;
    exists: boolean;
    content: {
      full: string | null;
      preview: string | null;
    } | null;
    stats: {
      totalLines: number;
      totalChars: number;
      sections: number;
    } | null;
    metadata: {
      lastUpdated: string | null;
      userName: string | null;
    } | null;
    message?: string;
  };
}

export async function fetchAgents(): Promise<AgentsResponse> {
  const res = await fetch("/api/openclaw/agents");
  return res.json();
}

export async function fetchSystem(): Promise<SystemResponse> {
  const res = await fetch("/api/openclaw/system");
  return res.json();
}

export async function fetchMemoryCore(): Promise<MemoryCoreResponse> {
  const res = await fetch("/api/memory/core");
  return res.json();
}
