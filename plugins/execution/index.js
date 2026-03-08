import fs from 'node:fs';
import path from 'node:path';

const HOME_DIR = process.env.HOME || process.env.USERPROFILE;
const TASKS_FILE = path.join(HOME_DIR, ".openclaw", "workspace", "mission-control", "data", "tasks.json");

function updateTaskStatus(taskId, newStatus, agentName) {
    try {
        if (!fs.existsSync(TASKS_FILE)) return;

        const content = fs.readFileSync(TASKS_FILE, "utf-8");
        const data = JSON.parse(content);

        let updated = false;

        // Try to locate the task either by exact taskId or by checking if a task is assigned to the invoking agent and is currently 'in-progress'.
        // This acts as a fuzzy-matcher since the hook might not carry the exact taskId.
        // If we only have the agentName, we complete the first in-progress task they own.
        const taskToComplete = taskId
            ? data.tasks.find(t => t.id === taskId)
            : data.tasks.find(t => (t.agentId === agentName || t.agentName === agentName) && t.status === 'in-progress');

        if (taskToComplete && taskToComplete.status !== newStatus) {
            console.log(`[Execution Feedback] Auto-updating task ${taskToComplete.id} to ${newStatus}`);
            taskToComplete.status = newStatus;
            taskToComplete.updatedAt = new Date().toISOString();
            updated = true;
        }

        if (updated) {
            data.meta.lastUpdated = new Date().toISOString();
            fs.writeFileSync(TASKS_FILE, JSON.stringify(data, null, 2), "utf-8");
        }
    } catch (err) {
        console.error("[Mission Control Execution Plugin] Failed to update task:", err.message);
    }
}

function checkStuckTasks() {
    try {
        if (!fs.existsSync(TASKS_FILE)) return;

        const content = fs.readFileSync(TASKS_FILE, "utf-8");
        const data = JSON.parse(content);

        let updated = false;
        const now = Date.now();
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

        for (const task of data.tasks) {
            if (task.status === 'in-progress') {
                const updatedTime = new Date(task.updatedAt).getTime();
                if (now - updatedTime > TWENTY_FOUR_HOURS) {
                    console.log(`[Execution Feedback] Task ${task.id} stuck for > 24h. Marking as 'reviewing'`);
                    task.status = 'reviewing'; // Instead of at-risk to fit standard columns
                    task.updatedAt = new Date().toISOString();
                    task.description += "\n\n[System] Auto-flagged for review due to timeout.";
                    updated = true;
                }
            }
        }

        if (updated) {
            data.meta.lastUpdated = new Date().toISOString();
            fs.writeFileSync(TASKS_FILE, JSON.stringify(data, null, 2), "utf-8");
        }
    } catch (err) {
        console.error("[Mission Control Execution Plugin] Failed to check stuck tasks:", err.message);
    }
}

export default {
    id: "mission-control-execution",
    name: "Mission Control Execution Feedback",
    description: "Automatically updates Tasks when agents complete their runs and checks for stuck tasks.",
    register(api) {

        // Hook 1: When an agent finishes a session or run
        api.on("agent_end", async (event, ctx) => {
            const agentName = ctx?.agentId || "auto-updater";

            // If the agent successfully finished, assume they completed their current "in-progress" task
            if (event.success) {
                updateTaskStatus(null, "done", agentName);
            }
        });

        // Hook 2: Start a heartbeat interval for Health Checking generic tasks
        api.on("gateway_start", async () => {
            console.log("[Execution Feedback] Gateway started, setting up task health-check interval.");
            // Run check every 1 hour
            setInterval(() => {
                checkStuckTasks();
            }, 60 * 60 * 1000);

            // Run initial check right now
            checkStuckTasks();
        });

        console.log("[Mission Control Execution] Plugin registered and hooks attached.");
    }
};
