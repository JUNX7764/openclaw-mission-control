import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

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
            return NextResponse.json({ success: false, error: "Document not found." }, { status: 404 });
        }

        // 2. Read actual physical file text for Preview
        const physicalPath = join(DOCS_ROOT, docMeta.category, docMeta.name);
        let rawContent = "";

        try {
            if (docMeta.type === "markdown" || docMeta.type === "doc" || docMeta.name.endsWith(".md") || docMeta.name.endsWith(".txt")) {
                rawContent = await readFile(physicalPath, "utf-8");
            } else {
                rawContent = `[Binary Content - Preview not supported for ${docMeta.type} format]`;
            }
        } catch (fsError) {
            console.warn(`[API] Physical file missing for ${docMeta.name}`, fsError);
            rawContent = "[File Read Error: physical file could not be found or loaded]";
        }

        return NextResponse.json({
            success: true,
            data: {
                ...docMeta,
                content: rawContent
            }
        });
    } catch (error) {
        console.error("Failed to fetch document preview:", error);
        return NextResponse.json(
            { success: false, error: "获取预览内容失败", details: (error as Error).message },
            { status: 500 }
        );
    }
}
