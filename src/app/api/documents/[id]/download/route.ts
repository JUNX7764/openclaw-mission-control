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
            return new NextResponse("Access denied.", { status: 403 });
        }

        try {
            await stat(filePath);
        } catch {
            return new NextResponse("File not found.", { status: 404 });
        }

        const fileBuffer = await readFile(filePath);
        const name = basename(filePath);
        const ext = extname(filePath).toLowerCase();

        let contentType = "application/octet-stream";
        if (ext === ".md") contentType = "text/markdown; charset=utf-8";
        else if (ext === ".pdf") contentType = "application/pdf";
        else if (ext === ".txt") contentType = "text/plain; charset=utf-8";

        const headers = new Headers();
        headers.append("Content-Disposition", `attachment; filename="${encodeURIComponent(name)}"`);
        headers.append("Content-Type", contentType);

        return new NextResponse(fileBuffer, { headers });
    } catch (error) {
        console.error("Failed to stream document download:", error);
        return new NextResponse("Internal Server Error while downloading file", { status: 500 });
    }
}
