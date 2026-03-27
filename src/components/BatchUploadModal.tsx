import { useState, useRef, useEffect } from 'react';
import { X, Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { haptic } from '@/lib/telegram';
import { getTelegramUser } from '@/lib/telegram';

const API_BASE = 'https://minskdvizh.up.railway.app';

interface UploadResult {
  row: number;
  title: string;
  status: 'accepted' | 'error';
  reason?: string;
  id?: number;
}

interface UploadResponse {
  success: boolean;
  total: number;
  accepted: number;
  errors: number;
  results: UploadResult[];
}

export default function BatchUploadModal() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const tgUser = getTelegramUser();

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Body scroll lock
  useEffect(() => {
    if (open) {
      const y = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${y}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflowY = 'hidden';
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflowY = '';
        window.scrollTo(0, y);
      };
    }
  }, [open]);

  const handleClose = () => {
    setOpen(false);
    setFile(null);
    setResult(null);
    setDragging(false);
  };

  const handleFileSelect = (f: File | null) => {
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      toast.error('Поддерживаются только .xlsx, .xls, .csv');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('Файл слишком большой (макс. 5 МБ)');
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFileSelect(e.dataTransfer.files[0] || null);
  };

  const handleUpload = async () => {
    if (!file) return;
    haptic('medium');
    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const params = new URLSearchParams();
      if (tgUser?.id)         params.set('tg_user_id',    String(tgUser.id));
      if (tgUser?.username)   params.set('tg_username',   tgUser.username);
      if (tgUser?.first_name) params.set('tg_first_name', tgUser.first_name);

      const res = await fetch(`${API_BASE}/api/events/batch?${params}`, {
        method: 'POST',
        body: formData,
      });

      const data: UploadResponse = await res.json();

      if (!res.ok) {
        toast.error((data as any).detail || 'Ошибка загрузки');
        return;
      }

      setResult(data);
      haptic(data.accepted > 0 ? 'success' : 'error');

      if (data.accepted > 0) {
        toast.success(`Принято ${data.accepted} событий на модерацию!`);
      } else {
        toast.error('Ни одно событие не принято');
      }
    } catch (err) {
      toast.error('Ошибка соединения с сервером');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = (fmt: 'xlsx' | 'csv') => {
    haptic('light');
    window.open(`${API_BASE}/api/events/batch/template?format=${fmt}`, '_blank');
  };

  return (
    <>
      {/* Кнопка-триггер */}
      <button
        onClick={() => { haptic('light'); setOpen(true); }}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body font-medium transition-colors"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}
      >
        <Upload className="h-3.5 w-3.5" />
        <span>Загрузить список</span>
      </button>

      {!open ? null : (
        <div
          className="fixed inset-0 z-[999999998] flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div
            ref={modalRef}
            className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden"
            style={{
              background: 'hsl(var(--background))',
              border: '1px solid rgba(192,38,211,0.2)',
              maxHeight: '92vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              <div>
                <h2 className="text-sm font-display font-bold text-foreground">📦 Загрузить список событий</h2>
                <p className="text-xs text-muted-foreground mt-0.5">До 100 событий за раз из .xlsx или .csv</p>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">

              {/* Шаг 1: скачать шаблон */}
              {!result && (
                <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(192,38,211,0.07)', border: '1px solid rgba(192,38,211,0.2)' }}>
                  <p className="text-xs font-body font-medium text-foreground">1. Скачайте шаблон и заполните его</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadTemplate('xlsx')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all"
                      style={{ background: 'rgba(192,38,211,0.15)', border: '1px solid rgba(192,38,211,0.35)', color: '#c026d3' }}
                    >
                      <Download className="h-3 w-3" />
                      Excel (.xlsx)
                    </button>
                    <button
                      onClick={() => downloadTemplate('csv')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body transition-all text-muted-foreground hover:text-foreground"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <Download className="h-3 w-3" />
                      CSV
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Обязательные поля: title, details, category, event_date, show_time, place
                  </p>
                </div>
              )}

              {/* Шаг 2: загрузить файл */}
              {!result && (
                <div>
                  <p className="text-xs font-body font-medium text-foreground mb-2">2. Загрузите заполненный файл</p>

                  {/* Drop zone */}
                  <div
                    className={`rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                      dragging ? 'border-primary bg-primary/10' : file ? 'border-primary/50 bg-primary/5' : 'border-border/50 hover:border-border'
                    }`}
                    style={{ minHeight: '100px' }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                      {file ? (
                        <>
                          <FileSpreadsheet className="h-8 w-8 text-primary mb-2" />
                          <p className="text-sm font-body font-medium text-foreground">{file.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {(file.size / 1024).toFixed(0)} КБ · нажмите чтобы заменить
                          </p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm font-body text-muted-foreground">
                            Перетащите файл сюда или <span className="text-primary">выберите</span>
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-1">.xlsx, .xls, .csv · макс. 5 МБ</p>
                        </>
                      )}
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                  />
                </div>
              )}

              {/* Результат */}
              {result && (
                <div className="space-y-3">
                  {/* Summary */}
                  <div className="rounded-xl p-3 flex items-center gap-3"
                    style={{
                      background: result.accepted > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `1px solid ${result.accepted > 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    }}>
                    {result.accepted > 0
                      ? <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                      : <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />}
                    <div>
                      <p className="text-sm font-body font-medium text-foreground">
                        {result.accepted > 0 ? 'Загрузка завершена' : 'Ни одно событие не принято'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Всего: {result.total} · Принято: <span className="text-emerald-400 font-medium">{result.accepted}</span> · Пропущено: <span className="text-red-400 font-medium">{result.errors}</span>
                      </p>
                    </div>
                  </div>

                  {/* Detail rows */}
                  {result.results.length > 0 && (
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                      {result.results.map((r) => (
                        <div key={r.row} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-body"
                          style={{ background: r.status === 'accepted' ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)' }}>
                          {r.status === 'accepted'
                            ? <CheckCircle className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                            : <AlertCircle className="h-3 w-3 text-red-400 flex-shrink-0" />}
                          <span className="text-muted-foreground shrink-0">стр. {r.row}</span>
                          <span className="text-foreground truncate flex-1">{r.title}</span>
                          {r.reason && <span className="text-red-400 truncate max-w-[120px]">{r.reason}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Загрузить ещё */}
                  <button
                    onClick={() => { setFile(null); setResult(null); }}
                    className="w-full py-2 rounded-lg text-xs font-body text-muted-foreground hover:text-foreground transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    Загрузить другой файл
                  </button>
                </div>
              )}

              {/* Footer кнопки */}
              {!result && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-2.5 rounded-xl text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-body font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #c026d3, #9333ea)', color: 'white', border: 'none' }}
                  >
                    {uploading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Загружаю...</>
                    ) : (
                      <><Upload className="h-4 w-4" /> Отправить на модерацию</>
                    )}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}
