import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { join } from "path";
import mime from "mime"; // You can use mime-types or raw determination

export const dynamic = "force-dynamic";

const HOME_DIR = process.env.HOME || "~";
const DOCUMENTS_JSON_PATH = join(HOME_DIR, ".openclaw/workspace/mission-control/data/documents.json");
const DOCS_ROOT = join(HOME_DIR, ".openclaw/workspace/mission-control/docs");

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Next.js 15+ promise signature
) {
    try {
        const { id } = await params;

        // 1. Read metadata from JSON
        const jsonContent = await readFile(DOCUMENTS_JSON_PATH, "utf-8");
        const data = JSON.parse(jsonContent);
        const docMeta = data.documents.find((d: any) => d.id === id);

        if (!docMeta) {
            return new NextResponse("Document entry not found", { status: 404 });
        }

        // 2. Verify physical file exists and read its buffer
        const physicalPath = join(DOCS_ROOT, docMeta.category, docMeta.name);

        try {
            await stat(physicalPath); // ensure it exists
        } catch (e) {
            return new NextResponse("Physical file not found on disk", { status: 404 });
        }

        const fileBuffer = await readFile(physicalPath);

        // 3. Determine mimetype
        let contentType = "application/octet-stream";
        if (docMeta.name.endsWith(".md")) contentType = "text/markdown; charset=utf-8";
        if (docMeta.name.endsWith(".pdf")) contentType = "application/pdf";
        if (docMeta.name.endsWith(".txt")) contentType = "text/plain; charset=utf-8";

        // 4. Return the standard Http Response with Content-Disposition headers to trigger download behavior
        const headers = new Headers();
        headers.append("Content-Disposition", `attachment; filename="${encodeURIComponent(docMeta.name)}"`);
        headers.append("Content-Type", contentType);

        return new NextResponse(fileBuffer, { headers });
    } catch (error) {
        console.error("Failed to stream document download:", error);
        return new NextResponse("Internal Server Error while downloading file", { status: 500 });
    }
}
