import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

const TASKS_FILE_PATH = join(process.env.HOME || "~", ".openclaw/workspace/mission-control/data/tasks.json");

async function readTasksFile() {
    try {
        const content = await readFile(TASKS_FILE_PATH, "utf-8");
        return JSON.parse(content);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            throw new Error("Tasks data file not found");
        }
        throw error;
    }
}

async function writeTasksFile(data: any) {
    const content = JSON.stringify(data, null, 2);
    await writeFile(TASKS_FILE_PATH, content, "utf-8");
}

// POST - 更新特定任务的状态
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: taskId } = await params;
        const body = await request.json();
        const { status, _message } = body;

        if (!status) {
            return NextResponse.json(
                { success: false, error: "Missing required field: status" },
                { status: 400 }
            );
        }

        const data = await readTasksFile();

        // Ensure the status is a valid column
        if (!data.columns[status]) {
            return NextResponse.json(
                { success: false, error: `Invalid status '${status}'. Allowed: ${Object.keys(data.columns).join(', ')}` },
                { status: 400 }
            );
        }

        const taskIndex = data.tasks.findIndex((t: any) => t.id === taskId);
        if (taskIndex === -1) {
            return NextResponse.json(
                { success: false, error: `Task '${taskId}' not found` },
                { status: 404 }
            );
        }

        // Update the task status
        data.tasks[taskIndex].status = status;
        data.tasks[taskIndex].updatedAt = new Date().toISOString();

        // Optional append system message to description
        if (_message) {
            data.tasks[taskIndex].description += `\n\n[System Feedback] ${_message}`;
        }

        data.meta.lastUpdated = new Date().toISOString();

        await writeTasksFile(data);

        return NextResponse.json({
            success: true,
            data: data.tasks[taskIndex]
        });
    } catch (error) {
        console.error(`Failed to update task status:`, error);
        return NextResponse.json(
            {
                success: false,
                error: "更新任务状态失败",
                details: (error as Error).message,
            },
            { status: 500 }
        );
    }
}
