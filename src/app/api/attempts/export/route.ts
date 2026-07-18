import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const examTitle = searchParams.get("exam");

  if (!examTitle) {
    return NextResponse.json({ error: "Parameter 'exam' wajib diisi" }, { status: 400 });
  }

  try {
    // Fetch attempts for this exam, sorted by totalScore desc
    const attempts = await prisma.examAttempt.findMany({
      where: {
        finishedAt: { not: null },
        exam: { title: examTitle },
      },
      orderBy: { totalScore: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        exam: { select: { title: true } },
      },
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = "Roemah Bimbel Admin";
    wb.created = new Date();

    const ws = wb.addWorksheet("Hasil Ujian");

    // ── Column definitions ─────────────────────────────────────────────────
    ws.columns = [
      { header: "No", key: "no", width: 6 },
      { header: "Nama", key: "name", width: 28 },
      { header: "Email", key: "email", width: 32 },
      { header: "TWK", key: "twk", width: 10 },
      { header: "TIU", key: "tiu", width: 10 },
      { header: "TKP", key: "tkp", width: 10 },
      { header: "Total Skor", key: "total", width: 14 },
      { header: "Status", key: "status", width: 12 },
      { header: "Tanggal Selesai", key: "finishedAt", width: 22 },
    ];

    // ── Title row ──────────────────────────────────────────────────────────
    ws.insertRow(1, []);
    ws.insertRow(1, [`Hasil Ujian: ${examTitle}`]);
    ws.insertRow(2, [`Diekspor: ${new Date().toLocaleString("id-ID")}`]);
    ws.insertRow(3, []);

    const titleCell = ws.getCell("A1");
    titleCell.font = { bold: true, size: 14, name: "Arial" };
    ws.mergeCells("A1:I1");
    titleCell.alignment = { horizontal: "left" };

    ws.getCell("A2").font = { size: 10, name: "Arial", color: { argb: "FF888888" } };
    ws.mergeCells("A2:I2");

    // ── Header row (now at row 4) ──────────────────────────────────────────
    const headerRow = ws.getRow(4);
    headerRow.values = ["No", "Nama", "Email", "TWK", "TIU", "TKP", "Total Skor", "Status", "Tanggal Selesai"];
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, name: "Arial", color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2563EB" }, // blue-600
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FF1D4ED8" } },
      };
    });
    headerRow.height = 22;

    // ── Data rows ──────────────────────────────────────────────────────────
    attempts.forEach((a, i) => {
      const passed =
        a.twkScore >= 65 && a.tiuScore >= 80 && a.tkpScore >= 156;

      const row = ws.addRow({
        no: i + 1,
        name: a.user.name,
        email: a.user.email,
        twk: a.twkScore,
        tiu: a.tiuScore,
        tkp: a.tkpScore,
        total: a.totalScore,
        status: passed ? "LULUS" : "BELUM LULUS",
        finishedAt: a.finishedAt
          ? new Date(a.finishedAt).toLocaleString("id-ID")
          : "-",
      });

      // Zebra striping
      const bgColor = i % 2 === 0 ? "FFFFFFFF" : "FFF0F7FF";
      row.eachCell((cell) => {
        cell.font = { name: "Arial", size: 10 };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
        cell.alignment = { vertical: "middle" };
      });

      // Center numeric columns
      ["D", "E", "F", "G", "H", "I"].forEach((col) => {
        const cell = row.getCell(col);
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });

      // Color status cell
      const statusCell = row.getCell("H");
      statusCell.font = {
        name: "Arial",
        size: 10,
        bold: true,
        color: { argb: passed ? "FF16A34A" : "FFDC2626" },
      };

      // Red score if below passing
      const twkCell = row.getCell("D");
      if (a.twkScore < 65) twkCell.font = { ...twkCell.font, color: { argb: "FFDC2626" } };
      const tiuCell = row.getCell("E");
      if (a.tiuScore < 80) tiuCell.font = { ...tiuCell.font, color: { argb: "FFDC2626" } };
      const tkpCell = row.getCell("F");
      if (a.tkpScore < 156) tkpCell.font = { ...tkpCell.font, color: { argb: "FFDC2626" } };

      row.height = 18;
    });

    // ── Summary row ────────────────────────────────────────────────────────
    ws.addRow([]);
    const lastDataRow = 4 + attempts.length; // header at 4, data from 5
    const summaryRow = ws.addRow({
      no: "",
      name: "RATA-RATA",
      email: "",
      twk: `=AVERAGE(D5:D${lastDataRow})`,
      tiu: `=AVERAGE(E5:E${lastDataRow})`,
      tkp: `=AVERAGE(F5:F${lastDataRow})`,
      total: `=AVERAGE(G5:G${lastDataRow})`,
      status: `${attempts.filter((a) => a.twkScore >= 65 && a.tiuScore >= 80 && a.tkpScore >= 156).length} lulus`,
      finishedAt: "",
    });
    summaryRow.eachCell((cell) => {
      cell.font = { bold: true, name: "Arial", size: 10 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
    summaryRow.getCell("B").alignment = { horizontal: "left", vertical: "middle" };
    summaryRow.height = 20;

    // ── Freeze header ──────────────────────────────────────────────────────
    ws.views = [{ state: "frozen", ySplit: 4 }];

    // ── Generate buffer ────────────────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="hasil-ujian.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Gagal mengekspor data" }, { status: 500 });
  }
}