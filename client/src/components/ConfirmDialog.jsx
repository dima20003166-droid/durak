// client/src/components/ConfirmDialog.jsx
import React from 'react';

export default function ConfirmDialog({
  open,
  title = 'Подтверждение',
  message = '',
  confirmText = 'ОК',
  cancelText = 'Отмена',
  onConfirm = () => {},
  onCancel = () => {},
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className="relative w-[92%] max-w-md rounded-2xl bg-gray-900 text-gray-100 shadow-xl ring-1 ring-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 text-lg font-semibold">
          {title}
        </div>
        <div className="px-6 py-5 text-gray-300 whitespace-pre-line">
          {message}
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 transition font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition font-semibold"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}