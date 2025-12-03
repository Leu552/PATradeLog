import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel, confirmText }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 border border-slate-200">
        <div className="flex items-center gap-3 text-rose-600 mb-4">
          <div className="bg-rose-50 p-2 rounded-full">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        </div>
        
        <p className="text-slate-600 mb-6 text-sm leading-relaxed">
          {message}
        </p>

        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
          >
            取消
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-200 transition"
          >
            {confirmText || '确认删除'}
          </button>
        </div>
      </div>
    </div>
  );
};