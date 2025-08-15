// client/src/components/ConfirmDialog.jsx
import React from 'react';
import Lottie from 'lottie-react';
import successAnim from '../assets/animations/success.json';
import errorAnim from '../assets/animations/error.json';

export default function ConfirmDialog({
  open,
  type,
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
      <div className="absolute inset-0 bg-bg/70" onClick={onCancel} />
      <div className="relative w-[92%] max-w-md rounded-2xl bg-surface text-text shadow-xl ring-1 ring-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border text-lg font-semibold">
          {title}
        </div>
        <div className="px-6 py-5 text-muted whitespace-pre-line flex flex-col items-center">
          {type === 'success' && (
            <Lottie animationData={successAnim} loop={false} className="w-32 h-32 mb-4" />
          )}
          {type === 'error' && (
            <Lottie animationData={errorAnim} loop={false} className="w-32 h-32 mb-4" />
          )}
          {message}
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-surface hover:bg-surface/80 transition font-medium text-text"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/80 transition font-semibold text-text"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
