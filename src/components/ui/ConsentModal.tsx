"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConsentModal({ isOpen, onClose, onConfirm }: ConsentModalProps) {
  const t = useTranslations("consent");
  const [isChecked, setIsChecked] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isChecked) {
      onConfirm();
      setIsChecked(false);
    }
  };

  const handleClose = () => {
    setIsChecked(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-primary/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-primary px-6 py-5 border-b border-accent/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-black text-sm uppercase tracking-widest">
                {t("title")}
              </h2>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <p className="text-slate-600 text-sm leading-relaxed">
            {t("body")}
          </p>

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-slate-300 text-accent focus:ring-accent focus:ring-2 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-700 leading-relaxed">
              {t("checkbox")}
            </span>
          </label>
        </div>

        {/* Buttons */}
        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-6 py-3 rounded-lg border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 active:scale-[0.99] transition-all duration-200"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isChecked}
            className={`flex-1 px-6 py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all duration-200 ${
              isChecked
                ? "bg-accent text-white hover:bg-accent-dark shadow-lg shadow-accent/20 active:scale-[0.99]"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {t("confirm")}
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">
            REMO Trust Compliance v2.40
          </p>
        </div>
      </div>
    </div>
  );
}
