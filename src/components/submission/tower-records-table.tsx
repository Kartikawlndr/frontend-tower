"use client";
 
import { useState } from "react";
import { Download } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, Th, Td } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import type { TowerRow } from "@/lib/dummy-submissions";
 
const COLUMNS: { key: keyof TowerRow; label: string }[] = [
  { key: "kode", label: "Kode/ID Menara" },
  { key: "pemilik", label: "Nama Pemilik" },
  { key: "tahun", label: "Tahun" },
  { key: "tenant", label: "Penyelenggara Jaringan" },
  { key: "longitude", label: "Longitude" },
  { key: "latitude", label: "Latitude" },
  { key: "alamat", label: "Alamat" },
  { key: "jenis", label: "Jenis Menara" },
  { key: "tinggi", label: "Tinggi (AGL)" },
];
 
function csvCell(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
 
export function TowerRecordsTable({
  reg,
  rows,
  emptyMessage,
}: {
  reg: string;
  rows: TowerRow[];
  emptyMessage: string;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
 
  const visible = rows.slice((page - 1) * pageSize, page * pageSize);
 
  function download() {
    const lines = [
      COLUMNS.map((c) => c.label),
      ...rows.map((r) => COLUMNS.map((c) => r[c.key])),
    ].map((cells) => cells.map(csvCell).join(","));
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reg}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
 
  return (
    <Card title="Tower records in this submission">
      <CardBody className="flex flex-col gap-4 pt-4">
        <div className="flex justify-end">
          <Button variant="download" disabled={rows.length === 0} onClick={download}>
            <Download className="h-4 w-4" strokeWidth={2} />
            Download
          </Button>
        </div>
        <Table>
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <Th key={c.key}>{c.label}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <Td colSpan={COLUMNS.length} className="py-8 text-center text-muted">
                  {emptyMessage}
                </Td>
              </tr>
            ) : (
              visible.map((r) => (
                <tr key={r.kode}>
                  {COLUMNS.map((c) => (
                    <Td key={c.key} className="whitespace-nowrap">
                      {r[c.key]}
                    </Td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </Table>
        {rows.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={rows.length}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
          />
        )}
      </CardBody>
    </Card>
  );
}
