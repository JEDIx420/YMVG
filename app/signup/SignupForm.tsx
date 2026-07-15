"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import ClubCombobox from "@/components/forms/ClubCombobox";
import { submitRegistrationRequest } from "@/app/actions/registrationRequests";
import type { SwirClub } from "@/types/database.types";

interface SignupFormProps {
  clubs: SwirClub[];
}

const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100";

export default function SignupForm({ clubs }: SignupFormProps) {
  const [clubId, setClubId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  if (successMessage) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-xl shadow-slate-950/5 sm:p-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black text-blue-950">Request received</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">{successMessage}</p>
        <Link href="/login" className="mt-8 inline-flex rounded-xl bg-blue-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-black">
          Return to login
        </Link>
      </div>
    );
  }

  return (
    <form
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 sm:p-9"
      onSubmit={async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError(null);
        setFieldErrors({});

        const form = new FormData(event.currentTarget);
        const result = await submitRegistrationRequest({
          full_name: form.get("full_name"),
          email: form.get("email"),
          phone: form.get("phone"),
          club_id: clubId,
          member_imis_id: form.get("member_imis_id") || undefined,
          address: form.get("address") || undefined,
          city: form.get("city") || undefined,
          state: form.get("state") || undefined,
          country: form.get("country") || undefined,
          education: form.get("education") || undefined,
          job_title: form.get("job_title") || undefined,
        });

        if (result.success) {
          setSuccessMessage(result.message || "Your request has been received for review.");
        } else {
          setError(result.error || "Unable to submit the request.");
          setFieldErrors(result.fieldErrors || {});
        }
        setSubmitting(false);
      }}
      noValidate
    >
      <div className="mb-8 flex items-start gap-4 border-b border-slate-100 pb-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-950 text-white">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-600">Approval-based access</p>
          <h2 className="mt-1 text-2xl font-black text-blue-950">Apply for a YMBD account</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Your club determines your district, zone, and SWIR region automatically.</p>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Full name" name="full_name" required error={fieldErrors.full_name?.[0]} />
        <Field label="Email" name="email" type="email" required error={fieldErrors.email?.[0]} />
        <Field label="Phone" name="phone" type="tel" required error={fieldErrors.phone?.[0]} />
        <Field label="Personal / member iMIS ID" name="member_imis_id" error={fieldErrors.member_imis_id?.[0]} />

        <div className="sm:col-span-2">
          <ClubCombobox clubs={clubs} value={clubId} onChange={setClubId} required />
          {fieldErrors.club_id?.[0] && <p className="mt-1 text-xs font-semibold text-rose-600">Select a club from the list.</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="address" className="mb-2 block text-sm font-bold text-blue-950">Address</label>
          <textarea id="address" name="address" rows={2} className={inputClass} />
        </div>
        <Field label="City" name="city" />
        <Field label="State" name="state" />
        <Field label="Country" name="country" defaultValue="India" />
        <Field label="Education" name="education" />
        <div className="sm:col-span-2">
          <Field label="Job title" name="job_title" />
        </div>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/login" className="inline-flex items-center justify-center gap-2 px-3 py-3 text-sm font-bold text-slate-600 transition hover:text-blue-950">
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>
        <button
          type="submit"
          disabled={submitting || !clubId}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/15 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit registration request
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  error,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-bold text-blue-950">
        {label}{required ? " *" : ""}
      </label>
      <input id={name} name={name} type={type} required={required} defaultValue={defaultValue} className={inputClass} />
      {error && <p className="mt-1 text-xs font-semibold text-rose-600">{error}</p>}
    </div>
  );
}
