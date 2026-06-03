import { CreditCard, Clock } from "lucide-react";

export const metadata = {
  title: "Subscription & Billing - Business Directory Dashboard",
  description: "Manage your business directory subscription plans and billing details.",
};

export default async function BillingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full uppercase tracking-widest block w-fit">
            Account Management
          </span>
          <h1 className="text-3xl font-black text-blue-950 tracking-tight leading-tight mt-2">
            Subscription & Billing
          </h1>
          <p className="text-slate-500 font-light text-base">
            Manage your corporate directory subscription details, billing history, and invoices.
          </p>
        </div>
      </div>

      {/* Coming Soon Panel */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-12 text-white relative overflow-hidden shadow-lg text-center space-y-6">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
        
        <div className="w-16 h-16 bg-white/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm backdrop-blur-md">
          <CreditCard className="w-8 h-8" />
        </div>
        
        <div className="space-y-2 max-w-md mx-auto relative z-10">
          <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
            Coming Soon
          </span>
          <h2 className="text-2xl font-black tracking-tight leading-tight pt-2">Integrated Payments & Billing</h2>
          <p className="text-blue-100/70 font-light text-sm leading-relaxed">
            We are integrating localized payment gateways to support self-serve ad promotions and automated monthly subscription invoices.
          </p>
        </div>

        <div className="pt-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-white font-bold text-[10px] uppercase px-4 py-2.5 rounded-xl mx-auto w-fit">
            <Clock className="w-4.5 h-4.5 text-red-500 animate-spin" />
            <span>Under Development — Releasing in Phase 8</span>
          </div>
        </div>
      </div>
    </div>
  );
}
