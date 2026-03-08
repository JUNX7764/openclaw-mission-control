import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { basename, extname } from "path";

export const dynamic = "force-dynamic";

const HOME_DIR = process.env.HOME || "~";
const SCAN_ROOT = `${HOME_DIR}/.openclaw`;

function decodeId(id: string): string {
    return Buffer.from(id, "base64url").toString("utf-8");
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const filePath = decodeId(id);

        // Security: ensure the resolved path is within the allowed scan root
        if (!filePath.startsWith(SCAN_ROOT)) {
            return NextResponse.json({ success: false, error: "Access denied." }, { status: 403 });
        }

        let fileStats;
        try {
            fileStats = await stat(filePath);
        } catch {
            return NextResponse.json({ success: false, error: "File not found." }, { status: 404 });
        }

        const ext = extname(filePath).toLowerCase().slice(1);
        const name = basename(filePath);

        let content = "";
        if (ext === "md" || ext === "txt") {
            content = await readFile(filePath, "utf-8");
        } else if (ext === "pdf") {
            content = `[PDF 文件，请使用「下载」按钮获取原始文件]`;
        } else {
            content = `[二进制文件，不支持预览]`;
        }

        return NextResponse.json({
            success: true,
            data: {
                id,
                name,
                path: filePath,
                size: fileStats.size,
                updatedAt: fileStats.mtime.toISOString(),
                content,
            },
        });
    } catch (error) {
        console.error("Failed to fetch document preview:", error);
        return NextResponse.json(
            { success: false, error: "获取预览内容失败", details: (error as Error).message },
            { status: 500 }
        );
    }
}
