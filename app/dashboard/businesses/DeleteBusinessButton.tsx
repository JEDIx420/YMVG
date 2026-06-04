"use client";

import React, { useState } from "react";
import { Trash2, X, AlertTriangle, Loader2 } from "lucide-react";
import { deleteBusiness } from "@/app/actions/deleteBusiness";
import { motion, AnimatePresence } from "framer-motion";

interface DeleteBusinessButtonProps {
  businessId: string;
  brandName: string;
}

export default function DeleteBusinessButton({ businessId, brandName }: DeleteBusinessButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const result = await deleteBusiness(businessId);
      if (result.success) {
        setIsOpen(false);
      } else {
        setError(result.error || "Failed to delete the listing.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setError(null);
          setIsOpen(true);
        }}
        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-all cursor-pointer border border-rose-100 hover:border-rose-200"
        title={`Delete ${brandName}`}
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Delete</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isDeleting) setIsOpen(false);
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 z-10 overflow-hidden"
            >
              {/* Close Button */}
              <button
                disabled={isDeleting}
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center space-y-4 pt-2">
                {/* Warning Icon Badge */}
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 border border-rose-100">
                  <AlertTriangle className="w-6 h-6" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-blue-950">
                    Delete Business Listing?
                  </h3>
                  <p className="text-slate-500 font-light text-sm px-2">
                    Are you sure you want to delete <span className="font-semibold text-slate-950">"{brandName}"</span> from the directory? This action is permanent and cannot be undone.
                  </p>
                </div>

                {error && (
                  <div className="w-full p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold text-left">
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 w-full mt-4">
                  <button
                    disabled={isDeleting}
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-xs transition-all border border-slate-200/60 cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isDeleting}
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-rose-600/10 active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Listing</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
