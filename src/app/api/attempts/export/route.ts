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
        user: { select: { name: true, email: true, skdTrack: true } },
        exam: { select: { title: true, examType: true } },
      },
    });

    const isSkd = attempts.length > 0 && attempts[0].exam.examType === "SKD";

    const wb = new ExcelJS.Workbook();
    wb.creator = "Roemah Bimbel Admin";
    wb.created = new Date();

    const ws = wb.addWorksheet("Hasil Ujian");

    // ── Column definitions ─────────────────────────────────────────────────
    if (isSkd) {
      ws.columns = [
        { header: "No",              key: "no",         width: 6  },
        { header: "Nama",            key: "name",       width: 28 },
        { header: "Email",           key: "email",      width: 32 },
        { header: "Jalur SKD",       key: "jalur",      width: 14 },
        { header: "TWK",             key: "twk",        width: 10 },
        { header: "TIU",             key: "tiu",        width: 10 },
        { header: "TKP",             key: "tkp",        width: 10 },
        { header: "Total Skor",      key: "total",      width: 14 },
        { header: "Status",          key: "status",     width: 12 },
        { header: "Tanggal Selesai", key: "finishedAt", width: 22 },
      ];
    } else {
      ws.columns = [
        { header: "No",              key: "no",         width: 6  },
        { header: "Nama",            key: "name",       width: 28 },
        { header: "Email",           key: "email",      width: 32 },
        { header: "TWK",             key: "twk",        width: 10 },
        { header: "TIU",             key: "tiu",        width: 10 },
        { header: "TKP",             key: "tkp",        width: 10 },
        { header: "Total Skor",      key: "total",      width: 14 },
        { header: "Status",          key: "status",     width: 12 },
        { header: "Tanggal Selesai", key: "finishedAt", width: 22 },
      ];
    }

    // Kolom terakhir (J=SKD, I=non-SKD) untuk merge
    const lastCol = isSkd ? "J" : "I";

    // ── Title row ──────────────────────────────────────────────────────────
    ws.insertRow(1, []);
    ws.insertRow(1, [`Hasil Ujian: ${examTitle}`]);
    ws.insertRow(2, [`Diekspor: ${new Date().toLocaleString("id-ID")}`]);
    ws.insertRow(3, []);

    const titleCell = ws.getCell("A1");
    titleCell.font = { bold: true, size: 14, name: "Arial" };
    ws.mergeCells(`A1:${lastCol}1`);
    titleCell.alignment = { horizontal: "left" };

    ws.getCell("A2").font = { size: 10, name: "Arial", color: { argb: "FF888888" } };
    ws.mergeCells(`A2:${lastCol}2`);

    // ── Header row (now at row 4) ──────────────────────────────────────────
    const headerRow = ws.getRow(4);
    if (isSkd) {
      headerRow.values = ["No", "Nama", "Email", "Jalur SKD", "TWK", "TIU", "TKP", "Total Skor", "Status", "Tanggal Selesai"];
    } else {
      headerRow.values = ["No", "Nama", "Email", "TWK", "TIU", "TKP", "Total Skor", "Status", "Tanggal Selesai"];
    }
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
    // Kolom skor: SKD=E,F,G,H  non-SKD=D,E,F,G
    const twkCol  = isSkd ? "E" : "D";
    const tiuCol  = isSkd ? "F" : "E";
    const tkpCol  = isSkd ? "G" : "F";
    const totCol  = isSkd ? "H" : "G";
    const statCol = isSkd ? "I" : "H";
    const datCol  = isSkd ? "J" : "I";

    attempts.forEach((a, i) => {
      const passed =
        a.twkScore >= 65 && a.tiuScore >= 80 && a.tkpScore >= 156;

      const rowData: Record<string, string | number> = {
        no:         i + 1,
        name:       a.user.name,
        email:      a.user.email,
        twk:        a.twkScore,
        tiu:        a.tiuScore,
        tkp:        a.tkpScore,
        total:      a.totalScore,
        status:     passed ? "LULUS" : "BELUM LULUS",
        finishedAt: a.finishedAt
          ? new Date(a.finishedAt).toLocaleString("id-ID")
          : "-",
      };

      if (isSkd) {
        rowData.jalur = a.user.skdTrack ?? "Belum Dipilih";
      }

      const row = ws.addRow(rowData);

      // Zebra striping
      const bgColor = i % 2 === 0 ? "FFFFFFFF" : "FFF0F7FF";
      row.eachCell((cell) => {
        cell.font = { name: "Arial", size: 10 };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
        cell.alignment = { vertical: "middle" };
      });

      // Center numeric + status + date columns
      [twkCol, tiuCol, tkpCol, totCol, statCol, datCol].forEach((col) => {
        row.getCell(col).alignment = { horizontal: "center", vertical: "middle" };
      });

      // Center + color Jalur SKD column
      if (isSkd) {
        const jalurCell = row.getCell("D");
        jalurCell.alignment = { horizontal: "center", vertical: "middle" };
        jalurCell.font = {
          name: "Arial",
          size: 10,
          bold: true,
          color: {
            argb: a.user.skdTrack === "CPNS"
              ? "FF1D4ED8"        // blue-700
              : a.user.skdTrack === "KEDINASAN"
              ? "FF0F766E"        // teal-700
              : "FF9CA3AF",       // gray-400
          },
        };
      }

      // Color status cell
      const statusCell = row.getCell(statCol);
      statusCell.font = {
        name: "Arial",
        size: 10,
        bold: true,
        color: { argb: passed ? "FF16A34A" : "FFDC2626" },
      };

      // Red score if below passing
      const twkCell = row.getCell(twkCol);
      if (a.twkScore < 65)  twkCell.font = { ...twkCell.font,  color: { argb: "FFDC2626" } };
      const tiuCell = row.getCell(tiuCol);
      if (a.tiuScore < 80)  tiuCell.font = { ...tiuCell.font,  color: { argb: "FFDC2626" } };
      const tkpCell = row.getCell(tkpCol);
      if (a.tkpScore < 156) tkpCell.font = { ...tkpCell.font,  color: { argb: "FFDC2626" } };

      row.height = 18;
    });

    // ── Summary row ────────────────────────────────────────────────────────
    ws.addRow([]);
    const lastDataRow = 4 + attempts.length; // header at 4, data from 5
    const summaryRow = ws.addRow({
      no:         "",
      name:       "RATA-RATA",
      email:      "",
      jalur:      "",
      twk:        `=AVERAGE(${twkCol}5:${twkCol}${lastDataRow})`,
      tiu:        `=AVERAGE(${tiuCol}5:${tiuCol}${lastDataRow})`,
      tkp:        `=AVERAGE(${tkpCol}5:${tkpCol}${lastDataRow})`,
      total:      `=AVERAGE(${totCol}5:${totCol}${lastDataRow})`,
      status:     `${attempts.filter((a) => a.twkScore >= 65 && a.tiuScore >= 80 && a.tkpScore >= 156).length} lulus`,
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