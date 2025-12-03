import React, { useRef, useState } from 'react';
import { Download, Upload, Trash2, AlertTriangle, X } from 'lucide-react';
import { Trade } from '../types';

interface DataManagementModalProps {
  trades: Trade[];
  onClose: () => void;
  onImport: (trades: Trade[]) => void;
  onReset: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({ trades, onClose, onImport, onReset }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState('');

  const handleExport = () => {
    const dataStr = JSON.stringify(trades, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindful_trader_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          // Basic validation to check if it looks like trade data
          if (json.length > 0 && (!json[0].id || !json[0].date)) {
            throw new Error("文件格式不正确：缺少必要的交易字段。");
          }
          
          // Delegate to parent
          onImport(json);
          onClose();
        } else {
          throw new Error("文件格式错误：必须是交易数组。");
        }
      } catch (err) {
        setImportError("导入失败：文件无效或损坏。");
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetApp = () => {
    // Notify parent to start reset flow
    onReset();
    // Close this modal to show the confirmation modal clearly
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-fadeIn">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 className="text-lg font-bold text-slate-800">数据管理与备份</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {importError && (
            <div className="bg-rose-50 text-rose-700 p-3 rounded-lg text-sm font-bold flex items-center gap-2">
              <AlertTriangle size={16} /> {importError}
            </div>
          )}

          {/* Export */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-700">1. 数据备份 (推荐)</h3>
            <p className="text-xs text-slate-500 mb-2">将所有交易记录（含图片）下载为 JSON 文件保存到电脑。</p>
            <button 
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl border border-indigo-200 hover:bg-indigo-100 transition"
            >
              <Download size={18} /> 导出数据 (Backup)
            </button>
          </div>

          <div className="border-t border-slate-100"></div>

          {/* Import */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-700">2. 数据恢复</h3>
            <p className="text-xs text-slate-500 mb-2">从电脑上传备份文件，恢复之前的交易记录。</p>
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
            />
            <button 
              onClick={handleImportClick}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white text-slate-700 font-bold rounded-xl border border-slate-300 hover:bg-slate-50 transition"
            >
              <Upload size={18} /> 导入数据 (Restore)
            </button>
          </div>

          <div className="border-t border-slate-100"></div>

          {/* Reset */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-rose-700 flex items-center gap-2">
               <AlertTriangle size={16} /> 危险区域
            </h3>
            <p className="text-xs text-slate-500 mb-2">清空当前应用内的所有数据。请确保通过上面的按钮备份了数据。</p>
            <button 
              onClick={handleResetApp}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white text-rose-600 font-bold rounded-xl border border-rose-200 hover:bg-rose-50 transition"
            >
              <Trash2 size={18} /> 重置应用 (清空数据)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};