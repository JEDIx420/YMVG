"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, Loader2, Mail, MapPin, Phone, UserCheck, X, XCircle } from "lucide-react";
import ClubCombobox from "@/components/forms/ClubCombobox";
import { reviewRegistrationRequest } from "@/app/actions/registrationRequests";
import type { RegistrationRequest, RegistrationRequestStatus, SwirClub } from "@/types/database.types";

const filters: Array<RegistrationRequestStatus | "all"> = ["all", "pending", "approved", "rejected", "activated"];

export default function RegistrationRequestsClient({
  requests,
  clubs,
}: {
  requests: RegistrationRequest[];
  clubs: SwirClub[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<RegistrationRequestStatus | "all">("pending");
  const [selected, setSelected] = useState<RegistrationRequest | null>(null);
  const [correctedClubId, setCorrectedClubId] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const visible = filter === "all" ? requests : requests.filter((request) => request.status === filter);

  const openRequest = (request: RegistrationRequest) => {
    setSelected(request);
    setCorrectedClubId(request.club_id);
    setRejectionReason("");
    setError(null);
  };

  const review = (requestedAction: "approve" | "reject") => {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const result = await reviewRegistrationRequest({
        request_id: selected.id,
        requested_action: requestedAction,
        rejection_reason: requestedAction === "reject" ? rejectionReason : null,
        corrected_club_id: correctedClubId || selected.club_id,
      });

      if (!result.success) {
        setError(result.error || "Review failed.");
        return;
      }

      setSelected(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {filters.map((status) => {
          const count = status === "all" ? requests.length : requests.filter((request) => request.status === status).length;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider transition ${
                filter === status ? "bg-blue-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {status} ({count})
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {visible.length === 0 ? (
          <p className="p-12 text-center text-sm text-slate-500">No registration requests in this status.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4">Applicant</th>
                  <th className="px-5 py-4">Club</th>
                  <th className="px-5 py-4">Submitted</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((request) => (
                  <tr key={request.id} onClick={() => openRequest(request)} className="cursor-pointer text-sm transition hover:bg-blue-50/40">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">{request.full_name}</p>
                      <p className="mt-1 text-xs text-slate-500">{request.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">{request.club_name}</p>
                      <p className="mt-1 text-xs text-slate-500">District {request.district_number} - Zone {request.zone_number}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">{new Date(request.submitted_at).toLocaleDateString()}</td>
                    <td className="px-5 py-4"><StatusBadge status={request.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={() => setSelected(null)}>
          <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-8" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-red-600">Registration request</p>
                <h3 className="mt-1 text-2xl font-black text-blue-950">{selected.full_name}</h3>
                <div className="mt-2"><StatusBadge status={selected.status} /></div>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Detail icon={Mail} label="Email" value={selected.email} />
              <Detail icon={Phone} label="Phone" value={selected.phone} />
              <Detail icon={UserCheck} label="Member iMIS ID" value={selected.member_imis_id || "Not supplied"} />
              <Detail icon={Clock3} label="Submitted" value={new Date(selected.submitted_at).toLocaleString()} />
              <Detail icon={MapPin} label="Club" value={`${selected.club_name} - iMIS ${selected.imis_club_id}`} />
              <Detail icon={MapPin} label="Hierarchy" value={`District ${selected.district_number} - Zone ${selected.zone_number} - ${selected.region_code}`} />
              {selected.reviewer_name && <Detail icon={UserCheck} label="Reviewer" value={selected.reviewer_name} />}
              {selected.rejection_reason && <Detail icon={XCircle} label="Rejection reason" value={selected.rejection_reason} />}
            </div>

            {selected.status === "pending" && (
              <div className="mt-7 space-y-5 border-t border-slate-100 pt-6">
                <ClubCombobox key={selected.id} clubs={clubs} value={correctedClubId} onChange={setCorrectedClubId} label="Approved club affiliation" required />
                <div>
                  <label htmlFor="rejection-reason" className="mb-2 block text-sm font-bold text-blue-950">Rejection reason</label>
                  <textarea id="rejection-reason" rows={3} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" placeholder="Required only when rejecting" />
                </div>
                {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p>}
                <div className="grid gap-3 sm:grid-cols-2">
                  <button type="button" disabled={isPending || !correctedClubId} onClick={() => review("approve")} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Approve
                  </button>
                  <button type="button" disabled={isPending || !rejectionReason.trim()} onClick={() => review("reject")} className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50">
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: RegistrationRequestStatus }) {
  const styles = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-blue-100 text-blue-800",
    rejected: "bg-rose-100 text-rose-800",
    activated: "bg-emerald-100 text-emerald-800",
  }[status];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${styles}`}>{status}</span>;
}

function Detail({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-500"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <p className="mt-2 break-words text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
