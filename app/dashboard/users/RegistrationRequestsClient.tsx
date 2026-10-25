"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Link as LinkIcon,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  Shield,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";
import ClubCombobox from "@/components/forms/ClubCombobox";
import {
  findRegistrationProfileCandidates,
  linkRegistrationRequestToExistingProfile,
  reviewRegistrationRequest,
} from "@/app/actions/registrationRequests";
import type {
  RegistrationCandidateProfile,
  RegistrationRequest,
  RegistrationRequestStatus,
  SwirClub,
} from "@/types/database.types";

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

  // Linking state
  const [showLinkPanel, setShowLinkPanel] = useState(false);
  const [candidates, setCandidates] = useState<RegistrationCandidateProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<RegistrationCandidateProfile | null>(null);
  const [isSearchingCandidates, setIsSearchingCandidates] = useState(false);

  const visible = filter === "all" ? requests : requests.filter((request) => request.status === filter);

  const openRequest = (request: RegistrationRequest) => {
    setSelected(request);
    setCorrectedClubId(request.club_id);
    setRejectionReason("");
    setError(null);
    setShowLinkPanel(false);
    setSelectedCandidate(null);
    setSearchQuery("");
    setCandidates([]);

    if (request.status === "pending" || request.status === "approved") {
      fetchCandidates(request.id, "");
    }
  };

  const fetchCandidates = async (requestId: string, query: string) => {
    setIsSearchingCandidates(true);
    const res = await findRegistrationProfileCandidates({
      request_id: requestId,
      search: query || null,
    });
    setIsSearchingCandidates(false);
    if (res.success && res.data) {
      setCandidates(res.data);
    }
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (selected) {
      fetchCandidates(selected.id, q);
    }
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

  const executeLink = () => {
    if (!selected || !selectedCandidate) return;
    setError(null);
    startTransition(async () => {
      const result = await linkRegistrationRequestToExistingProfile({
        request_id: selected.id,
        profile_id: selectedCandidate.profile_id,
      });

      if (!result.success) {
        setError(result.error || "Profile linking failed.");
        return;
      }

      setSelected(null);
      setSelectedCandidate(null);
      setShowLinkPanel(false);
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
          <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-8" onMouseDown={(event) => event.stopPropagation()}>
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
              <Detail icon={MapPin} label="Club" value={`${selected.club_name}${selected.imis_club_id ? ` - iMIS ${selected.imis_club_id}` : ""}`} />
              <Detail icon={MapPin} label="Hierarchy" value={`District ${selected.district_number} - Zone ${selected.zone_number} - ${selected.region_code}`} />
              {selected.reviewer_name && <Detail icon={UserCheck} label="Reviewer" value={selected.reviewer_name} />}
              {selected.rejection_reason && <Detail icon={XCircle} label="Rejection reason" value={selected.rejection_reason} />}
            </div>

            {/* Candidate Warning Alert */}
            {(selected.status === "pending" || selected.status === "approved") && candidates.length > 0 && !showLinkPanel && (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                      Candidate Profile Match Detected ({candidates.length})
                    </h4>
                    <p className="text-xs text-amber-800">
                      An existing profile matches key identity signals (phone, name, or iMIS ID). You can review candidates and link this request to preserve their existing account.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowLinkPanel(true)}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-700 transition"
                    >
                      <LinkIcon className="h-3.5 w-3.5" /> Review Candidate Profiles
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Link to Existing Profile Workflow */}
            {(selected.status === "pending" || selected.status === "approved") && showLinkPanel && (
              <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/50 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-blue-900" />
                    <h4 className="text-sm font-black uppercase tracking-wider text-blue-950">Link to Existing Profile</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLinkPanel(false);
                      setSelectedCandidate(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                  >
                    Cancel Link Workflow
                  </button>
                </div>

                {/* Candidate Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search candidate profiles by name, email, phone, or iMIS ID..."
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Candidate List */}
                <div className="max-h-60 overflow-y-auto space-y-2 rounded-xl border border-slate-200 bg-white p-2">
                  {isSearchingCandidates ? (
                    <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Searching profiles...
                    </div>
                  ) : candidates.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No matching profiles found for this query.
                    </div>
                  ) : (
                    candidates.map((c) => {
                      const isSelected = selectedCandidate?.profile_id === c.profile_id;
                      return (
                        <div
                          key={c.profile_id}
                          onClick={() => setSelectedCandidate(c)}
                          className={`cursor-pointer rounded-xl border p-3 transition text-xs ${
                            isSelected
                              ? "border-blue-600 bg-blue-50/80 shadow-sm"
                              : "border-slate-100 bg-slate-50/50 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-slate-900">{c.full_name || "Unnamed Profile"}</p>
                              <p className="text-[11px] font-mono text-slate-600 mt-0.5">
                                Profile/Login Email: <strong className="text-blue-950">{c.email}</strong>
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Phone: {c.phone || "None"} | iMIS: {c.imis_id || "None"} | Club: {c.club_name || "Unassigned"}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="inline-block rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-700">
                                {c.app_role.replace("_", " ")}
                              </span>
                              <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-500">
                                <Shield className="h-3 w-3 text-slate-400" />
                                {c.has_auth_binding ? "Auth Bound" : "Unbound"}
                              </div>
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-1">
                            {c.match_reasons.map((reason) => (
                              <span
                                key={reason}
                                className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                  reason.startsWith("exact_")
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {reason.replace("_", " ")}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Linking Confirmation Step */}
                {selectedCandidate && (
                  <div className="rounded-xl border border-blue-300 bg-blue-100/60 p-4 space-y-3">
                    <h5 className="text-xs font-black uppercase tracking-wider text-blue-950">
                      Confirm Profile Linking
                    </h5>

                    <div className="space-y-1.5 text-xs text-slate-800">
                      <p>
                        <strong>Registration Request Email:</strong> {selected.email}
                      </p>
                      <p>
                        <strong>Preserved Profile & Login Email:</strong> {selectedCandidate.email}
                      </p>
                      <p>
                        <strong>Preserved Role:</strong> <span className="uppercase font-bold">{selectedCandidate.app_role.replace("_", " ")}</span>
                      </p>
                    </div>

                    <div className="rounded-lg bg-amber-100 p-2.5 text-[11px] font-medium text-amber-900 border border-amber-300/60">
                      <AlertTriangle className="h-3.5 w-3.5 inline mr-1 text-amber-700" />
                      The existing profile and login email will be preserved. This action does not change the Supabase Auth email.
                    </div>

                    {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-700">{error}</p>}

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => setSelectedCandidate(null)}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Change Selection
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={executeLink}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-950 px-4 py-2 text-xs font-bold text-white hover:bg-black disabled:opacity-50"
                      >
                        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LinkIcon className="h-3.5 w-3.5" />}
                        {selected.status === "pending" ? "Approve and Link" : "Link to Profile"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Standard Approve / Reject Workflow for Pending Requests */}
            {selected.status === "pending" && !showLinkPanel && (
              <div className="mt-7 space-y-5 border-t border-slate-100 pt-6">
                <ClubCombobox key={selected.id} clubs={clubs} value={correctedClubId} onChange={setCorrectedClubId} label="Approved club affiliation" required />
                <div>
                  <label htmlFor="rejection-reason" className="mb-2 block text-sm font-bold text-blue-950">Rejection reason</label>
                  <textarea id="rejection-reason" rows={3} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" placeholder="Required only when rejecting" />
                </div>
                {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p>}
                <div className="grid gap-3 sm:grid-cols-3">
                  <button type="button" disabled={isPending || !correctedClubId} onClick={() => review("approve")} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Approve New Account
                  </button>
                  <button type="button" disabled={isPending} onClick={() => setShowLinkPanel(true)} className="flex items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-3 text-xs font-bold text-white hover:bg-blue-950 disabled:opacity-50">
                    <LinkIcon className="h-4 w-4" /> Link Existing Profile
                  </button>
                  <button type="button" disabled={isPending || !rejectionReason.trim()} onClick={() => review("reject")} className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50">
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </div>
              </div>
            )}

            {/* Link Option for Already Approved Requests */}
            {selected.status === "approved" && !showLinkPanel && (
              <div className="mt-7 border-t border-slate-100 pt-6">
                {error && <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p>}
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setShowLinkPanel(true)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-900 px-5 py-3 text-xs font-bold text-white hover:bg-blue-950 disabled:opacity-50"
                >
                  <LinkIcon className="h-4 w-4" /> Link to Existing Profile
                </button>
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
