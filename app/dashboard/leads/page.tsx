import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/profiles";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Mail, Phone, Calendar, ArrowUpRight, MessageSquare, Briefcase } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Lead Center - Business Directory Dashboard",
  description: "View customer inquiries and leads generated from your business directory listing.",
};

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  // Security gate: ONLY admins or business owners can access Lead Center
  const isOwner = profile.app_role === "business_owner";
  const isAdmin = profile.app_role === "super_admin" || profile.app_role === "region_admin";

  if (!isOwner && !isAdmin) {
    redirect("/dashboard");
  }

  // Fetch businesses owned by this user
  const { data: ownerBusinesses, error: bizError } = await supabase
    .from("businesses")
    .select("id, brand_name")
    .eq("owner_id", user.id);

  if (bizError) {
    console.error("Error fetching businesses:", bizError);
  }

  let leads: any[] = [];
  let businessMap: { [id: string]: string } = {};

  if (ownerBusinesses && ownerBusinesses.length > 0) {
    ownerBusinesses.forEach(b => {
      businessMap[b.id] = b.brand_name;
    });

    const businessIds = ownerBusinesses.map(b => b.id);

    // Initialize admin client to bypass RLS and read all leads scoped to the owner's businesses
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: leadsData, error: leadsError } = await supabaseAdmin
      .from("leads")
      .select(`
        id,
        business_id,
        sender_name,
        sender_email,
        sender_phone,
        message,
        created_at
      `)
      .in("business_id", businessIds)
      .order("created_at", { ascending: false });

    if (leadsError) {
      console.error("Error fetching leads:", leadsError);
    } else if (leadsData) {
      leads = leadsData;
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full uppercase tracking-widest block w-fit">
            Partner Center
          </span>
          <h1 className="text-3xl font-black text-blue-950 tracking-tight leading-tight mt-2">
            Lead CRM Inbox
          </h1>
          <p className="text-slate-500 font-light text-base">
            Track and respond to inquiries submitted by prospective clients directly from your directory spotlight page.
          </p>
        </div>
      </div>

      {/* Main Inbox View */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
        <h3 className="text-xl font-black text-blue-950 uppercase tracking-tight flex items-center gap-2 border-b border-slate-100 pb-4">
          <Mail className="w-5 h-5 text-red-600" />
          <span>Customer Inquiries ({leads.length})</span>
        </h3>

        {leads.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-4">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1 max-w-sm mx-auto">
              <p className="text-slate-800 font-bold text-base">Your Inbox is Empty</p>
              <p className="text-xs text-slate-400 font-light leading-relaxed">
                When prospective clients submit the contact/enquiry form on your listing spotlight page, their messages will appear here in real-time.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {leads.map((lead) => {
              const formattedDate = new Date(lead.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div 
                  key={lead.id} 
                  className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col md:flex-row md:items-start justify-between gap-6 hover:border-slate-200 hover:bg-slate-100/30 transition-all shadow-sm"
                >
                  <div className="space-y-4 min-w-0 flex-1">
                    {/* Inquiry Metadata */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100/50">
                        <Briefcase className="w-3.5 h-3.5" />
                        {businessMap[lead.business_id] || "Your Listing"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-light">
                        <Calendar className="w-3.5 h-3.5" />
                        {formattedDate}
                      </span>
                    </div>

                    {/* Message Body */}
                    <div className="space-y-2">
                      <h4 className="text-blue-950 font-black text-lg leading-snug">{lead.sender_name}</h4>
                      <p className="text-slate-600 font-light text-sm leading-relaxed bg-white border border-slate-100 p-4 rounded-xl shadow-inner whitespace-pre-wrap">
                        {lead.message}
                      </p>
                    </div>

                    {/* Sender Contact Details */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500">
                      <a href={`mailto:${lead.sender_email}`} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span>{lead.sender_email}</span>
                      </a>
                      {lead.sender_phone && (
                        <a href={`tel:${lead.sender_phone}`} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span>{lead.sender_phone}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-row md:flex-col items-center gap-3 shrink-0">
                    <a
                      href={`mailto:${lead.sender_email}?subject=Reply regarding your inquiry on ${businessMap[lead.business_id] || 'YMI swir Directory'}`}
                      className="w-full md:w-fit inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-950 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap active:scale-95"
                    >
                      <span>Email Sender</span>
                      <ArrowUpRight className="w-4.5 h-4.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
