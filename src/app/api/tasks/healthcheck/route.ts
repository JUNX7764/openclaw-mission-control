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

export async function GET(request: NextRequest) {
    try {
        const data = await readTasksFile();
        let updatedCount = 0;

        const now = Date.now();
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

        data.tasks.forEach((task: any) => {
            if (task.status === 'in-progress') {
                const updatedTime = new Date(task.updatedAt).getTime();
                // If it's been in progress for over 24 hours without updates
                if (now - updatedTime > TWENTY_FOUR_HOURS) {
                    task.status = 'reviewing';
                    task.updatedAt = new Date().toISOString();
                    task.description += "\n\n[System] Auto-flagged for review due to 24h timeout.";
                    updatedCount++;
                }
            }
        });

        if (updatedCount > 0) {
            data.meta.lastUpdated = new Date().toISOString();
            await writeTasksFile(data);
        }

        return NextResponse.json({
            success: true,
            scanned: data.tasks.length,
            staleUpdated: updatedCount
        });
    } catch (error) {
        console.error(`Failed to execute healthcheck:`, error);
        return NextResponse.json(
            {
                success: false,
                error: "健康检查运行失败",
                details: (error as Error).message,
            },
            { status: 500 }
        );
    }
}
