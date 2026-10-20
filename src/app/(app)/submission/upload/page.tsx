"use client";
 
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, Paperclip, X, Download } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, Th, Td } from "@/components/ui/table";
import { cn } from "@/lib/utils";
 
const MAX_SIZE = 10 * 1024 * 1024;
 
const TEXT_RULE = "Max 50 characters";
 
const COLUMNS = [
  { field: "Kode/ID Menara", type: "Text", rule: TEXT_RULE },
  { field: "Nama Pemilik Menara", type: "Text", rule: TEXT_RULE },
  { field: "Tahun Pembangunan", type: "Integer", rule: "4 digits, 1900 to current year" },
  { field: "Penyelenggara Jaringan (Tenant)", type: "Text", rule: "Max 50 characters, one tenant per row" },
  { field: "Longitude", type: "Decimal", rule: "6 decimals, 95 to 141" },
  { field: "Latitude", type: "Decimal", rule: "6 decimals, -11 to 6" },
  { field: "Alamat", type: "Text", rule: TEXT_RULE },
  { field: "Jenis Menara", type: "Text", rule: TEXT_RULE },
  { field: "Tinggi Menara (AGL)", type: "Integer", rule: "Positive, max 3 digits (meters)" },
  { field: "Kapasitas Maksimal", type: "Text", rule: TEXT_RULE },
  { field: "Kapasitas Disewakan", type: "Text", rule: TEXT_RULE },
  { field: "Kapasitas Digunakan Sendiri", type: "Text", rule: TEXT_RULE },
];
 
function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
 
export default function UploadExcelPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
 
  function accept(next: File | undefined) {
    if (!next) return;
    if (!next.name.toLowerCase().endsWith(".xlsx")) {
      setFile(null);
      setError("Only .xlsx files are accepted.");
      return;
    }
    if (next.size > MAX_SIZE) {
      setFile(null);
      setError("The file is larger than 10 MB.");
      return;
    }
    setError("");
    setFile(next);
  }
 
  function clear() {
    setFile(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }
 
  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-6">
      <h1 className="text-page-title">Upload Excel</h1>
 
      <Card title="Submission method">
        <CardBody className="pt-4">
          <Select
            label="Method"
            value="upload"
            onChange={(e) => {
              if (e.target.value === "form") router.push("/submission/form");
            }}
          >
            <option value="upload">Upload Excel</option>
            <option value="form">Application Form</option>
          </Select>
        </CardBody>
      </Card>
 
      <Card title="Upload file">
        <CardBody className="flex flex-col gap-4 pt-4">
          {error && (
            <div
              role="alert"
              className="rounded-card border border-danger bg-danger-bg px-3 py-2 text-sm text-danger"
            >
              {error}
            </div>
          )}
 
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              accept(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "flex flex-col items-center gap-3 rounded-card border-2 border-dashed border-primary px-6 py-10 text-center transition-colors duration-150",
              dragging ? "bg-nav-active-bg" : "bg-dropzone-bg"
            )}
          >
            <CloudUpload className="h-10 w-10 text-primary" strokeWidth={1.5} aria-hidden />
            <p className="text-sm font-semibold text-heading">
              Drag and drop .xlsx file here
            </p>
            <p className="text-helper">or</p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx"
              className="sr-only"
              aria-label="Choose .xlsx file"
              tabIndex={-1}
              onChange={(e) => accept(e.target.files?.[0])}
            />
            <Button variant="outline" onClick={() => inputRef.current?.click()}>
              <Paperclip className="h-4 w-4" strokeWidth={2} />
              Choose file
            </Button>
          </div>
 
          {file && (
            <div className="flex items-center justify-between rounded-card border border-border-soft bg-surface px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <Paperclip className="h-4 w-4 shrink-0 text-muted" strokeWidth={2} />
                <span className="truncate text-sm text-heading">{file.name}</span>
                <span className="shrink-0 text-helper">{formatSize(file.size)}</span>
              </div>
              <button
                type="button"
                onClick={clear}
                aria-label="Remove file"
                className="cursor-pointer text-danger"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          )}
 
          <p className="text-helper">
            Each row is one tenant relationship. Repeat the tower fields on every
            row for a tower with several tenants.
          </p>
          <div>
            <Button variant="outline" disabled>
              <Download className="h-4 w-4" strokeWidth={2} />
              Download template
            </Button>
          </div>
        </CardBody>
      </Card>
 
      <Card title="Excel column guide">
        <CardBody className="pt-4">
          <Table>
            <thead>
              <tr>
                <Th>No</Th>
                <Th>Field</Th>
                <Th>Type</Th>
                <Th>Rule</Th>
                <Th>Required</Th>
              </tr>
            </thead>
            <tbody>
              {COLUMNS.map((c, i) => (
                <tr key={c.field}>
                  <Td>{i + 1}</Td>
                  <Td>{c.field}</Td>
                  <Td>{c.type}</Td>
                  <Td>{c.rule}</Td>
                  <Td>Yes</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>
 
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push("/submission")}>
          Cancel
        </Button>
        <Button
          disabled={!file}
          onClick={() => router.push("/submission/result/rejected")}
        >
          Upload / Submit
        </Button>
      </div>
    </div>
  );
}
