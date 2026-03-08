import fs from 'node:fs';
import path from 'node:path';

const HOME_DIR = process.env.HOME || process.env.USERPROFILE;
const LOGS_FILE = path.join(HOME_DIR, ".openclaw", "workspace", "mission-control", "data", "logs.json");

function appendLog(level, subsystem, message, sourceModule) {
    try {
        if (!fs.existsSync(LOGS_FILE)) return;

        const content = fs.readFileSync(LOGS_FILE, "utf-8");
        const data = JSON.parse(content);

        // Add the new log entry at the beginning (newest first)
        const newEntry = {
            id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            level: level,
            subsystem: subsystem,
            message: message,
            timestamp: new Date().toISOString(),
            source: sourceModule
        };

        data.logs.unshift(newEntry);

        // Enforce log retention (keep only latest 100 to prevent giant files)
        if (data.logs.length > 100) {
            data.logs = data.logs.slice(0, 100);
        }

        data.meta.lastUpdated = new Date().toISOString();
        data.meta.totalLogs = data.logs.length;

        fs.writeFileSync(LOGS_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
        console.error("[Mission Control Logger Plugin] Failed to write log:", err.message);
    }
}

export default {
    id: "mission-control-logger",
    name: "Mission Control Logger",
    description: "Logs agent actions to the Mission Control dashboard",
    register(api) {

        // Hook 1: When an agent calls a tool (e.g. bash, file search)
        api.on("before_tool_call", async (event) => {
            // Determine the risk level of the tool
            const riskyTools = ["run_bash", "write_to_file", "replace_file_content", "GitCommand"];
            const level = riskyTools.includes(event.toolName) ? "WARN" : "INFO";

            const agentName = "Agent";
            const message = `${agentName} 执行工具调用: ${event.toolName}`;

            appendLog(level, "AI", message, "tool-executor");
        });

        // Hook 2: When an agent sends a message out (e.g. Feishu)
        api.on("message_sent", async (event) => {
            const isSuccess = event.success;
            const level = isSuccess ? "INFO" : "ERROR";
            const message = isSuccess
                ? `消息发送成功: 目标 ${event.to}`
                : `消息发送失败: 目标 ${event.to} (${event.error || "未知异常"})`;

            appendLog(level, "Feishu", message, "message-sender");
        });

        console.log("[Mission Control Logger] Plugin registered and hooks attached.");
    }
};
