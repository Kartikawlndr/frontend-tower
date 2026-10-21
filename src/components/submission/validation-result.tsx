import Link from "next/link";
import { CircleAlert, CircleCheck } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, Th, Td } from "@/components/ui/table";
 
const SAMPLE_NOTE =
  "Sample data. Results will come from the submission pipeline once it is connected.";
 
const REJECTED_ROWS = [
  { row: 4, field: "Longitude", value: "142.5", error: "Must be between 95 and 141", kind: "invalid" },
  { row: 7, field: "Tahun Pembangunan", value: "2031", error: "Enter a 4-digit year from 1900 to the current year", kind: "invalid" },
  { row: 9, field: "Tinggi Menara (AGL)", value: "1200", error: "Enter a whole number from 1 to 999 (meters)", kind: "invalid" },
  { row: 12, field: "Kode/ID Menara", value: "TWR-0005", error: "Duplicate of row 5 in this file", kind: "duplicate" },
] as const;
 
const SUMMARY = [
  { label: "Registration number", value: "REG-2026-000004" },
  { label: "Submitted by", value: "demo" },
  { label: "Date", value: "19/10/2026" },
  { label: "Method", value: "Upload Excel" },
  { label: "Total rows", value: "12" },
];
 
function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}
 
export function RejectedResult() {
  const invalid = REJECTED_ROWS.filter((r) => r.kind === "invalid").length;
  const duplicate = REJECTED_ROWS.filter((r) => r.kind === "duplicate").length;
 
  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-6">
      <h1 className="text-page-title">Validation Result</h1>
 
      <Card>
        <CardBody className="flex flex-col gap-4">
          <div
            role="alert"
            className="flex items-center gap-2 rounded-card border border-danger bg-danger-bg px-3 py-2 text-sm font-semibold text-danger"
          >
            <CircleAlert className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
            Submission rejected: {plural(invalid, "invalid row")},{" "}
            {plural(duplicate, "duplicate")}
          </div>
          <p className="text-helper">
            No data was saved. Correct the rows below and submit again.
          </p>
          <Table>
            <thead>
              <tr>
                <Th>Row</Th>
                <Th>Field</Th>
                <Th>Value</Th>
                <Th>Error</Th>
              </tr>
            </thead>
            <tbody>
              {REJECTED_ROWS.map((r) => (
                <tr key={`${r.row}-${r.field}`}>
                  <Td>{r.row}</Td>
                  <Td>{r.field}</Td>
                  <Td>{r.value}</Td>
                  <Td className="text-danger">{r.error}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="flex justify-end gap-3">
            <Button asChild variant="outline">
              <Link href="/submission">Back</Link>
            </Button>
            <Button asChild>
              <Link href="/submission/upload">Re-upload</Link>
            </Button>
          </div>
        </CardBody>
      </Card>
 
      <p className="text-caption-note">{SAMPLE_NOTE}</p>
    </div>
  );
}
 
export function RegisteredResult() {
  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-6">
      <h1 className="text-page-title">Validation Result</h1>
 
      <Card>
        <CardBody className="flex flex-col gap-4">
          <div
            role="status"
            className="flex items-center gap-2 rounded-card border border-primary bg-nav-active-bg px-3 py-2 text-sm font-semibold text-primary"
          >
            <CircleCheck className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
            Submission registered
          </div>
          <dl className="grid gap-4 sm:grid-cols-3">
            {SUMMARY.map((s) => (
              <div key={s.label} className="flex flex-col gap-1">
                <dt className="text-field-label">{s.label}</dt>
                <dd className="text-base text-text">{s.value}</dd>
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <dt className="text-field-label">Status</dt>
              <dd>
                <Badge variant="success">Registered</Badge>
              </dd>
            </div>
          </dl>
          <p className="text-helper">Confirmation sent to the registered email.</p>
          <div className="flex justify-end gap-3">
            <Button asChild variant="outline">
              <Link href="/submission">New submission</Link>
            </Button>
            <Button asChild>
              <Link href="/submission/REG-2026-000004">View detail</Link>
            </Button>
          </div>
        </CardBody>
      </Card>
 
      <p className="text-caption-note">{SAMPLE_NOTE}</p>
    </div>
  );
}
