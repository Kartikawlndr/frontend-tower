import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TowerRecordsTable } from "@/components/submission/tower-records-table";
import {
  SUBMISSIONS,
  STATUS_VARIANT,
  formatDate,
  makeTowerRows,
} from "@/lib/dummy-submissions";
 
const EMPTY_MESSAGE = {
  Registered: "No records.",
  Rejected: "No records were saved because this submission was rejected.",
  Draft: "This draft has not been submitted yet.",
} as const;
 
async function SubmissionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const submission = SUBMISSIONS.find((s) => s.reg === decodeURIComponent(id));
  if (!submission) notFound();
 
  const rows =
    submission.status === "Registered" ? makeTowerRows(submission.rows) : [];
 
  const summary = [
    { label: "Registration number", value: submission.reg },
    { label: "Submitted by", value: "demo" },
    { label: "Date", value: formatDate(submission.iso) },
    { label: "Method", value: submission.method },
    { label: "Total rows", value: String(submission.rows) },
  ];
 
  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <h1 className="text-page-title">Submission Detail</h1>
 
      <Card title="Summary">
        <CardBody className="pt-4">
          <dl className="grid gap-4 sm:grid-cols-3">
            {summary.map((s) => (
              <div key={s.label} className="flex flex-col gap-1">
                <dt className="text-field-label">{s.label}</dt>
                <dd className="text-base text-text">{s.value}</dd>
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <dt className="text-field-label">Status</dt>
              <dd>
                <Badge variant={STATUS_VARIANT[submission.status]}>
                  {submission.status}
                </Badge>
              </dd>
            </div>
          </dl>
        </CardBody>
      </Card>
 
      <TowerRecordsTable
        reg={submission.reg}
        rows={rows}
        emptyMessage={EMPTY_MESSAGE[submission.status]}
      />
 
      <div>
        <Button asChild variant="outline">
          <Link href="/submission/history">Back to history</Link>
        </Button>
      </div>
 
      <p className="text-caption-note">
        Sample data. Records will come from the database once it is connected.
      </p>
    </div>
  );
}
 
export default function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-helper">Loading submission...</p>}>
      <SubmissionDetail params={params} />
    </Suspense>
  );
}
