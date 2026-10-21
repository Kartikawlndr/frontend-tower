"use client";
 
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, ClipboardList } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, Th, Td } from "@/components/ui/table";
import { cn } from "@/lib/utils";
 
const METHODS = [
  {
    value: "upload",
    href: "/submission/upload",
    title: "Upload Excel",
    description: "Register many towers at once from an .xlsx file.",
    icon: FileSpreadsheet,
  },
  {
    value: "form",
    href: "/submission/form",
    title: "Application Form",
    description: "Register a single tower by filling in the form.",
    icon: ClipboardList,
  },
] as const;
 
type MethodValue = (typeof METHODS)[number]["value"];
 
const RECENT = [
  { reg: "REG-2026-000003", date: "19/10/2026", method: "Upload Excel", status: "Registered" },
  { reg: "REG-2026-000002", date: "17/10/2026", method: "Application Form", status: "Registered" },
  { reg: "REG-2026-000001", date: "15/10/2026", method: "Upload Excel", status: "Rejected" },
] as const;
 
const STATUS_VARIANT = {
  Registered: "success",
  Rejected: "destructive",
} as const;
 
export default function SubmissionPage() {
  const router = useRouter();
  const [method, setMethod] = useState<MethodValue>("upload");
 
  const selected = METHODS.find((m) => m.value === method)!;
 
  return (
    <div className="mx-auto flex max-w-240 flex-col gap-6">
      <h1 className="text-page-title">Data Submission</h1>
 
      <Card title="Submission method">
        <CardBody className="flex flex-col gap-4 pt-4">
          <p className="text-helper">
            Choose how you want to register tower data.
          </p>
          <div
            role="radiogroup"
            aria-label="Submission method"
            className="grid gap-4 sm:grid-cols-2"
          >
            {METHODS.map((m) => {
              const isSelected = m.value === method;
              const Icon = m.icon;
              return (
                <label
                  key={m.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-card border p-4 transition-colors duration-150 has-focus-visible:ring-2 has-focus-visible:ring-primary/40",
                    isSelected
                      ? "border-primary bg-nav-active-bg"
                      : "border-border-soft bg-surface hover:bg-canvas"
                  )}
                >
                  <input
                    type="radio"
                    name="submission-method"
                    value={m.value}
                    checked={isSelected}
                    onChange={() => setMethod(m.value)}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-2 text-base font-semibold text-heading">
                      <Icon className="h-4 w-4 text-primary" strokeWidth={2} />
                      {m.title}
                    </span>
                    <span className="text-helper">{m.description}</span>
                  </div>
                </label>
              );
            })}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => router.push(selected.href)}>Continue</Button>
          </div>
        </CardBody>
      </Card>
 
      <Card title="Your recent submissions">
        <CardBody className="flex flex-col gap-4 pt-4">
          <Table>
            <thead>
              <tr>
                <Th>Registration No.</Th>
                <Th>Date</Th>
                <Th>Method</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {RECENT.map((r) => (
                <tr key={r.reg}>
                  <Td>{r.reg}</Td>
                  <Td>{r.date}</Td>
                  <Td>{r.method}</Td>
                  <Td>
                    <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                  </Td>
                  <Td>
                    <Link
                      href={`/submission/${r.reg}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      View
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div>
            <Link
              href="/submission/history"
              className="text-sm font-semibold text-primary hover:underline"
            >
              View all history
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
