"use client";

import React from "react";

export interface ModalState {
  isOpen: boolean;
  type?: "info" | "success" | "warning" | "danger";
  title: string;
  message?: string;
  details?: string[];
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const IconInfo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
);

const IconSuccess = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

const IconWarning = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);

const IconDanger = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
);

export default function CustomModal({
  isOpen,
  type = "info",
  title,
  message,
  details,
  confirmText = "Tutup",
  cancelText,
  onConfirm,
  onCancel,
}: ModalState) {
  if (!isOpen) return null;

  const isConfirm = !!cancelText;

  const typeConfig = {
    info: { icon: <IconInfo />, iconBg: "bg-blue-50 border-blue-100" },
    success: { icon: <IconSuccess />, iconBg: "bg-emerald-50 border-emerald-100" },
    warning: { icon: <IconWarning />, iconBg: "bg-amber-50 border-amber-100" },
    danger: { icon: <IconDanger />, iconBg: "bg-rose-50 border-rose-100" },
  }[type];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden border border-slate-100 transform transition-all">
        {/* Header */}
        <div className="p-5 pb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${typeConfig.iconBg} shrink-0`}>
              {typeConfig.icon}
            </div>
            <div>
              <h3 className="font-bold text-base md:text-lg text-slate-900 leading-snug">{title}</h3>
            </div>
          </div>
          <button
            onClick={onCancel || onConfirm}
            className="text-slate-400 hover:text-slate-600 text-sm font-medium p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-5">
          {message && <p className="text-xs md:text-sm text-slate-600 font-normal leading-relaxed mb-3">{message}</p>}

          {details && details.length > 0 && (
            <div className="rounded-xl p-3.5 bg-slate-50 border border-slate-200/80 text-xs space-y-1 mb-4">
              <p className="font-semibold text-slate-800 mb-1">Rincian Persyaratan Ujian:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                {details.map((d, idx) => (
                  <li key={idx}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 mt-5">
            {isConfirm && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-xs md:text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={onConfirm}
              className={`px-5 py-2 text-xs md:text-sm font-medium rounded-xl text-white transition-colors shadow-sm ${
                type === "danger"
                  ? "bg-slate-900 hover:bg-slate-800"
                  : type === "warning"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : type === "success"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
