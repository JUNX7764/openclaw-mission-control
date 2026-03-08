import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

const HOME_DIR = process.env.HOME || "~";
const PROJECTS_FILE_PATH = join(HOME_DIR, ".openclaw/workspace/mission-control/data/projects.json");
const TASKS_FILE_PATH = join(HOME_DIR, ".openclaw/workspace/mission-control/data/tasks.json");

async function readProjectsFile() {
    try {
        const content = await readFile(PROJECTS_FILE_PATH, "utf-8");
        return JSON.parse(content);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            return { projects: [] };
        }
        throw error;
    }
}

async function readTasksFile() {
    try {
        const content = await readFile(TASKS_FILE_PATH, "utf-8");
        return JSON.parse(content);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            return { tasks: [] };
        }
        throw error;
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const [projectsData, tasksData] = await Promise.all([
            readProjectsFile(),
            readTasksFile()
        ]);

        const project = projectsData.projects?.find((p: any) => p.id === id);

        if (!project) {
            return NextResponse.json({ success: false, error: "Project not found." }, { status: 404 });
        }

        const allTasks = tasksData.tasks || [];
        const now = new Date().toISOString();

        // 1. Calculate Dynamic Progress
        let todo = 0, inProgress = 0, reviewing = 0, done = 0, archived = 0;
        const hydratedTasks: any[] = [];

        project.taskIds.forEach((tId: string) => {
            const t = allTasks.find((x: any) => x.id === tId);
            if (t) {
                hydratedTasks.push(t);
                if (t.status === "todo") todo++;
                else if (t.status === "in-progress") inProgress++;
                else if (t.status === "reviewing") reviewing++;
                else if (t.status === "done") done++;
                else if (t.status === "archived") archived++;
            }
        });

        // Check Manual override
        if (project.progressOverride !== undefined && project.progressOverride !== null && project.progressOverride >= 0) {
            project.progress = project.progressOverride;
        } else {
            const totalTasks = todo + inProgress + reviewing + done + archived;
            if (totalTasks > 0) {
                const completed = done + archived;
                project.progress = Math.round((completed / totalTasks) * 100);
            } else {
                project.progress = project.taskIds.length === 0 ? 0 : project.progress;
            }
        }

        // Attach distribution and timestamp
        project.lastProgressCalcAt = now;
        project.taskDistribution = {
            todo,
            "in-progress": inProgress,
            reviewing,
            done,
            archived
        };

        // Attach full task objects
        project.tasks = hydratedTasks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        return NextResponse.json({
            success: true,
            data: project
        });

    } catch (error) {
        console.error("Failed to fetch project details:", error);
        return NextResponse.json(
            { success: false, error: "获取项目详情失败", details: (error as Error).message },
            { status: 500 }
        );
    }
}
