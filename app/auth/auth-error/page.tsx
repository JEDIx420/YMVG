import Link from "next/link";
import { AlertCircle } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AuthErrorPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  
  // Resolve error or error_description from parameters
  const rawError = resolvedSearchParams.error;
  const rawDesc = resolvedSearchParams.error_description;
  
  const error = typeof rawError === "string" ? rawError : undefined;
  const errorDescription = typeof rawDesc === "string" ? rawDesc : undefined;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 overflow-hidden relative">
        
        {/* Main Error Illustration */}
        <div className="text-center mb-6 relative z-10">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-rose-600" />
          </div>
          
          <h1 className="text-3xl font-black text-blue-950 tracking-tight leading-tight mb-4">
            Authentication Failed
          </h1>
          
          <p className="text-slate-600 font-light leading-relaxed text-sm md:text-base">
            If you are trying to claim a directory profile, please ensure you are logging in with the exact Google Email address associated with your IMIS ID.
          </p>
        </div>

        {/* Debugging Info (Muted Text Block) */}
        {(errorDescription || error) && (
          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-left relative z-10 mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Error details
            </p>
            <p className="text-xs text-slate-500 font-mono leading-relaxed break-words">
              {errorDescription || error}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 mt-8 relative z-10 w-full flex flex-col">
          <Link
            href="/login"
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex justify-center items-center gap-2 text-center text-sm"
          >
            Try Logging In Again
          </Link>
          
          <Link
            href="/"
            className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-bold transition-all shadow-sm active:scale-95 flex justify-center items-center gap-2 text-center text-sm"
          >
            Return to Home
          </Link>
        </div>

        {/* Decorative background blur element */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-rose-50/50 rounded-full blur-3xl opacity-50 z-0"></div>
      </div>
    </div>
  );
}
