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

  const colorStyles = {
    info: { bg: "bg-blue-600", text: "text-blue-600", light: "bg-blue-50 border-blue-200" },
    success: { bg: "bg-green-600", text: "text-green-600", light: "bg-green-50 border-green-200" },
    warning: { bg: "bg-amber-600", text: "text-amber-600", light: "bg-amber-50 border-amber-200" },
    danger: { bg: "bg-red-600", text: "text-red-600", light: "bg-red-50 border-red-200" },
  }[type];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 transform transition-all scale-100">
        <div className={`p-4 md:p-5 text-white ${colorStyles.bg} flex items-center justify-between`}>
          <h3 className="font-bold text-base md:text-lg flex items-center gap-2">
            {type === "danger" && "⚠️"}
            {type === "warning" && "ℹ️"}
            {type === "success" && "✅"}
            {type === "info" && "📢"}
            {title}
          </h3>
          <button
            onClick={onCancel || onConfirm}
            className="text-white/80 hover:text-white text-xl font-bold leading-none p-1 rounded-lg hover:bg-white/10"
          >
            ✕
          </button>
        </div>
        
        <div className="p-5 md:p-6">
          {message && <p className="text-xs md:text-sm text-gray-700 font-medium mb-3">{message}</p>}
          
          {details && details.length > 0 && (
            <div className={`rounded-xl p-3 border text-xs space-y-1 mb-4 ${colorStyles.light}`}>
              <p className="font-semibold text-gray-800 mb-1">Rincian Persyaratan Ujian:</p>
              <ul className="list-disc pl-4 space-y-1 text-gray-600">
                {details.map((d, idx) => (
                  <li key={idx}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 mt-5">
            {isConfirm && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-xs md:text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={onConfirm}
              className={`px-5 py-2 text-xs md:text-sm font-semibold rounded-xl text-white transition-colors shadow-sm ${
                type === "danger"
                  ? "bg-red-600 hover:bg-red-700"
                  : type === "warning"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : type === "success"
                  ? "bg-green-600 hover:bg-green-700"
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
