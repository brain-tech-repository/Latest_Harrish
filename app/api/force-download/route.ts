import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fileUrl = searchParams.get("url");
  const fileName = searchParams.get("filename") || "download";

  if (!fileUrl) {
    return new NextResponse("Missing url", { status: 400 });
  }

  const upstream = await fetch(fileUrl);

  // Determine content type from filename extension
  let contentType = "application/octet-stream";
  if (fileName.endsWith(".pdf")) {
    contentType = "application/pdf";
  } else if (fileName.endsWith(".csv")) {
    contentType = "text/csv";
  } else if (fileName.endsWith(".xlsx")) {
    contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  } else if (fileName.endsWith(".xls")) {
    contentType = "application/vnd.ms-excel";
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
