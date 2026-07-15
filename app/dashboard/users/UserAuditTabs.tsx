"use client";

import { useState } from "react";
import { ClipboardCheck, Users } from "lucide-react";
import UserAuditClient from "./UserAuditClient";
import RegistrationRequestsClient from "./RegistrationRequestsClient";
import type { RegistrationRequest, SwirClub } from "@/types/database.types";

interface ProfileItem {
  id: string;
  user_id: string | null;
  full_name: string | null;
  email: string;
  phone: string | null;
  club: string | null;
  app_role: string;
  created_at: string;
}

interface BusinessLink {
  id: string;
  brand_name: string | null;
  owner_id: string | null;
  owner_profile_id: string | null;
}

export default function UserAuditTabs({ profiles, businesses, requests, clubs }: {
  profiles: ProfileItem[];
  businesses: BusinessLink[];
  requests: RegistrationRequest[];
  clubs: SwirClub[];
}) {
  const [tab, setTab] = useState<"members" | "requests">("members");
  const pendingCount = requests.filter((request) => request.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-2xl bg-slate-100 p-1.5">
        <button type="button" onClick={() => setTab("members")} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${tab === "members" ? "bg-white text-blue-950 shadow-sm" : "text-slate-500"}`}>
          <Users className="h-4 w-4" /> Members
        </button>
        <button type="button" onClick={() => setTab("requests")} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${tab === "requests" ? "bg-white text-blue-950 shadow-sm" : "text-slate-500"}`}>
          <ClipboardCheck className="h-4 w-4" /> Registration Requests
          {pendingCount > 0 && <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] text-white">{pendingCount}</span>}
        </button>
      </div>
      {tab === "members" ? <UserAuditClient profiles={profiles} businesses={businesses} /> : <RegistrationRequestsClient requests={requests} clubs={clubs} />}
    </div>
  );
}
