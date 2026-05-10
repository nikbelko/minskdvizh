import { useState, useRef, useEffect } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  addMonths, subMonths, isSameDay, isBefore, isAfter, startOfDay,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  X, Plus, Loader2, Megaphone, Upload, Download, FileSpreadsheet,
  CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { haptic } from '@/lib/telegram';
import { getTelegramUser } from '@/lib/telegram';
import { categories, type CategorySlug } from '@/data/events';

const API_BASE = 'https://minskdvizh.up.railway.app';

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** yyyy-MM-dd → dd.mm.yyyy */
function fmtDisplay(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

/** dd.mm.yyyy → yyyy-MM-dd, or null if invalid */
function parseDisplay(s: string): string | null {
  const m = s.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  const iso = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return isNaN(Date.parse(iso)) ? null : iso;
}

interface DateEntry { from: string; to?: string }

/**
 * Parse free-form text like "25.04.2026, 28.04.2026 — 30.04.2026" into entries.
 * Separators: comma or semicolon between entries, dash/em-dash/en-dash between range dates.
 */
function parseDateText(text: string): DateEntry[] {
  const parts = text.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
  const entries: DateEntry[] = [];
  for (const part of parts) {
    // Range: two dates separated by —, –, or " - " (space-dash-space to avoid confusion with date hyphens)
    const sides = part.split(/\s*[—–]\s*|\s+-\s+/);
    if (sides.length === 2) {
      const from = parseDisplay(sides[0]);
      const to = parseDisplay(sides[1]);
      if (from && to && to > from) { entries.push({ from, to }); continue; }
    }
    const d = parseDisplay(part);
    if (d) entries.push({ from: d });
  }
  return entries;
}

// ─── Inline calendar picker ───────────────────────────────────────────────────

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

interface CalendarPickerProps {
  onAdd: (from: string, to: string) => void;
  onClose: () => void;
}

function CalendarPicker({ onAdd, onClose }: CalendarPickerProps) {
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const today = startOfDay(new Date());
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const startOffset = (getDay(startOfMonth(month)) + 6) % 7;
  const fromDate = from ? startOfDay(new Date(from)) : null;
  const toDate = to ? startOfDay(new Date(to)) : null;

  const handleDay = (day: Date) => {
    if (isBefore(day, today)) return;
    haptic('light');
    const iso = format(day, 'yyyy-MM-dd');
    if (!fromDate) { setFrom(iso); setTo(''); return; }
    if (!toDate) {
      if (isSameDay(day, fromDate)) { setFrom(''); return; }
      if (isAfter(day, fromDate)) { setTo(iso); return; }
      setFrom(iso); setTo('');
      return;
    }
    setFrom(iso); setTo('');
  };

  const getState = (day: Date) => {
    if (isBefore(day, today)) return 'past';
    if (!fromDate) return 'default';
    if (isSameDay(day, fromDate) && !toDate) return 'single';
    if (isSameDay(day, fromDate)) return 'start';
    if (toDate && isSameDay(day, toDate)) return 'end';
    if (toDate && isAfter(day, fromDate) && isBefore(day, toDate)) return 'mid';
    return 'default';
  };

  const label = from && to
    ? `${fmtDisplay(from)} — ${fmtDisplay(to)}`
    : from ? fmtDisplay(from) : '';

  const handleAdd = () => {
    if (!from) return;
    onAdd(from, to);
    setFrom(''); setTo('');
  };

  return (
    <div className="mt-1.5 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => setMonth(m => subMonths(m, 1))}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-body font-semibold capitalize">
          {format(month, 'LLLL yyyy', { locale: ru })}
        </span>
        <button type="button" onClick={() => setMonth(m => addMonths(m, 1))}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-0.5">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-body text-muted-foreground/50 py-0.5">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {Array.from({ length: startOffset }).map((_, i) => <div key={`e-${i}`} />)}
        {days.map(day => {
          const st = getState(day);
          const isEdge = st === 'single' || st === 'start' || st === 'end';
          const isMid = st === 'mid';
          return (
            <div key={day.toISOString()} className="relative flex items-center justify-center h-8">
              {(isMid || st === 'end') && (
                <div className="absolute inset-y-1 left-0 right-0"
                  style={{ background: 'rgba(168,85,247,0.15)', borderRadius: st === 'end' ? '0 6px 6px 0' : 0 }} />
              )}
              {st === 'start' && (
                <div className="absolute inset-y-1 left-1/2 right-0"
                  style={{ background: 'rgba(168,85,247,0.15)' }} />
              )}
              <button type="button" disabled={st === 'past'} onClick={() => handleDay(day)}
                className={`relative z-10 w-7 h-7 text-[11px] font-body rounded-full flex items-center justify-center transition-all
                  ${st === 'past' ? 'text-muted-foreground/25 cursor-default' : ''}
                  ${isEdge ? 'text-white font-semibold' : ''}
                  ${isMid ? 'text-primary' : ''}
                  ${st === 'default' ? 'text-foreground hover:bg-white/10' : ''}
                `}
                style={isEdge ? { background: 'linear-gradient(135deg,#c026d3,#9333ea)' } : {}}>
                {format(day, 'd')}
              </button>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2">
        <span className="flex-1 text-[11px] font-body text-primary truncate">
          {label || <span className="text-muted-foreground/50">Выберите дату или диапазон</span>}
        </span>
        <button type="button" onClick={onClose}
          className="px-2.5 py-1 rounded-lg text-[11px] font-body text-muted-foreground border border-white/10 hover:border-white/20 transition-colors">
          Отмена
        </button>
        <button type="button" disabled={!from} onClick={handleAdd}
          className="px-2.5 py-1 rounded-lg text-[11px] font-body font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          style={{ background: 'linear-gradient(135deg,#c026d3,#9333ea)' }}>
          Добавить
        </button>
      </div>
    </div>
  );
}

// ─── Form types ───────────────────────────────────────────────────────────────

interface FormData {
  title: string;
  format: string;
  category: CategorySlug | '';
  dateText: string;   // free-form, e.g. "25.04.2026, 28.04.2026 — 30.04.2026"
  show_time: string;
  show_time_end: string;
  place: string;
  address: string;
  price: string;
  description: string;
  source_url: string;
  is_promo: boolean;
  is_kids: boolean;
}

interface FormErrors {
  title?: string;
  format?: string;
  category?: string;
  dateText?: string;
  place?: string;
  source_url?: string;
}

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

const todayStr = new Date().toISOString().split('T')[0];

const EMPTY_FORM: FormData = {
  title: '', format: '', category: '', dateText: '',
  show_time: '', show_time_end: '',
  place: '', address: '', price: '', description: '', source_url: '',
  is_promo: false, is_kids: false,
};

// ─── Batch Tab ────────────────────────────────────────────────────────────────

function BatchTab({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tgUser = getTelegramUser();

  const handleFileSelect = (f: File | null) => {
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      toast.error('Поддерживаются только .xlsx, .xls, .csv'); return;
    }
    if (f.size > 5 * 1024 * 1024) { toast.error('Файл слишком большой (макс. 5 МБ)'); return; }
    setFile(f); setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    handleFileSelect(e.dataTransfer.files[0] || null);
  };

  const handleUpload = async () => {
    if (!file) return;
    haptic('medium'); setUploading(true); setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const params = new URLSearchParams();
      if (tgUser?.id) params.set('tg_user_id', String(tgUser.id));
      if (tgUser?.username) params.set('tg_username', tgUser.username);
      if (tgUser?.first_name) params.set('tg_first_name', tgUser.first_name);
      const res = await fetch(`${API_BASE}/api/events/batch?${params}`, { method: 'POST', body: formData });
      const data: UploadResponse = await res.json();
      if (!res.ok) { toast.error((data as any).detail || 'Ошибка загрузки'); return; }
      setResult(data);
      haptic(data.accepted > 0 ? 'medium' : 'soft');
      if (data.accepted > 0) toast.success(`Принято ${data.accepted} событий на модерацию!`);
      else toast.error('Ни одно событие не принято');
    } catch { toast.error('Ошибка соединения с сервером'); }
    finally { setUploading(false); }
  };

  const downloadTemplate = (fmt: 'xlsx' | 'csv') => {
    haptic('light');
    window.open(`${API_BASE}/api/events/batch/template?format=${fmt}`, '_blank');
  };

  return (
    <div className="px-5 py-4 flex flex-col gap-4">
      {!result && (
        <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(192,38,211,0.07)', border: '1px solid rgba(192,38,211,0.2)' }}>
          <p className="text-xs font-body font-medium text-foreground">1. Скачайте шаблон и заполните его</p>
          <div className="flex gap-2">
            <button onClick={() => downloadTemplate('xlsx')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium"
              style={{ background: 'rgba(192,38,211,0.15)', border: '1px solid rgba(192,38,211,0.35)', color: '#c026d3' }}>
              <Download className="h-3 w-3" /> Excel (.xlsx)
            </button>
            <button onClick={() => downloadTemplate('csv')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body text-muted-foreground"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Download className="h-3 w-3" /> CSV
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">Обязательные поля: title, details, category, event_date, show_time, place</p>
        </div>
      )}
      {!result && (
        <div>
          <p className="text-xs font-body font-medium text-foreground mb-2">2. Загрузите заполненный файл</p>
          <div
            className={`rounded-xl border-2 border-dashed transition-all cursor-pointer ${dragging ? 'border-primary bg-primary/10' : file ? 'border-primary/50 bg-primary/5' : 'border-white/10 hover:border-white/20'}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}>
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              {file ? (
                <>
                  <FileSpreadsheet className="h-8 w-8 text-primary mb-2" />
                  <p className="text-sm font-body font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{(file.size / 1024).toFixed(0)} КБ · нажмите чтобы заменить</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-body text-muted-foreground">Перетащите файл или <span className="text-primary">выберите</span></p>
                  <p className="text-xs text-muted-foreground/60 mt-1">.xlsx, .xls, .csv · макс. 5 МБ · до 100 событий</p>
                </>
              )}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
            onChange={e => handleFileSelect(e.target.files?.[0] || null)} />
        </div>
      )}
      {result && (
        <div className="space-y-3">
          <div className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: result.accepted > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${result.accepted > 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
            {result.accepted > 0
              ? <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              : <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />}
            <div>
              <p className="text-sm font-body font-medium text-foreground">{result.accepted > 0 ? 'Загрузка завершена' : 'Ни одно событие не принято'}</p>
              <p className="text-xs text-muted-foreground">
                Всего: {result.total} · Принято: <span className="text-emerald-400 font-medium">{result.accepted}</span> · Пропущено: <span className="text-red-400 font-medium">{result.errors}</span>
              </p>
            </div>
          </div>
          {result.results.length > 0 && (
            <div className="space-y-1 max-h-[180px] overflow-y-auto">
              {result.results.map(r => (
                <div key={r.row} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-body"
                  style={{ background: r.status === 'accepted' ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)' }}>
                  {r.status === 'accepted'
                    ? <CheckCircle className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                    : <AlertCircle className="h-3 w-3 text-red-400 flex-shrink-0" />}
                  <span className="text-muted-foreground shrink-0">стр.{r.row}</span>
                  <span className="text-foreground truncate flex-1">{r.title}</span>
                  {r.reason && <span className="text-red-400 truncate max-w-[110px]">{r.reason}</span>}
                </div>
              ))}
            </div>
          )}
          <button onClick={() => { setFile(null); setResult(null); }}
            className="w-full py-2 rounded-lg text-xs font-body text-muted-foreground hover:text-foreground transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            Загрузить другой файл
          </button>
        </div>
      )}
      <div className="mt-auto border-t border-white/10" style={{ paddingTop: '0.75rem', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        {!result ? (
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-body text-muted-foreground transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Отмена</button>
            <button onClick={handleUpload} disabled={!file || uploading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-body font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #c026d3, #9333ea)', color: 'white' }}>
              {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Загружаю...</> : <><Upload className="h-4 w-4" /> Отправить на модерацию</>}
            </button>
          </div>
        ) : (
          <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-body font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #c026d3, #9333ea)' }}>Закрыть</button>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SubmitEventModal() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'single' | 'batch'>('single');
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [showTimeSet, setShowTimeSet] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (calendarOpen) setCalendarOpen(false); else handleClose(); } };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, calendarOpen]);

  useEffect(() => {
    if (open) {
      const y = window.scrollY;
      document.body.style.cssText = `position:fixed;top:-${y}px;left:0;right:0;overflow-y:hidden`;
      return () => {
        document.body.style.cssText = '';
        window.scrollTo(0, y);
      };
    }
  }, [open]);

  useEffect(() => {
    if (!open) { setShowTimeSet(false); setTab('single'); setIsFree(false); setCalendarOpen(false); }
  }, [open]);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-submit-event-modal', handler as EventListener);
    return () => window.removeEventListener('open-submit-event-modal', handler as EventListener);
  }, []);

  const handleClose = () => { setOpen(false); setForm(EMPTY_FORM); setErrors({}); };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.title.trim() || form.title.trim().length < 3) e.title = 'Введите название (мин. 3 символа)';
    if (!form.format.trim() || form.format.trim().length < 3) e.format = 'Введите формат (мин. 3 символа)';
    if (!form.category) e.category = 'Выберите категорию';
    if (!form.dateText.trim()) {
      e.dateText = 'Введите или выберите дату';
    } else {
      const entries = parseDateText(form.dateText);
      if (entries.length === 0) e.dateText = 'Не удалось распознать дату. Формат: дд.мм.гггг';
      else if (entries.some(en => en.from < todayStr)) e.dateText = 'Одна из дат в прошлом';
    }
    if (!form.place.trim() || form.place.trim().length < 3) e.place = 'Введите название площадки (мин. 3 символа)';
    if (form.source_url && !form.source_url.startsWith('http')) e.source_url = 'Введите корректную ссылку (начиная с http)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    haptic('medium');
    setSubmitting(true);

    const entries = parseDateText(form.dateText);
    const payload = {
      title: form.title,
      details: form.format,
      category: form.category,
      event_date: entries[0]?.from || '',
      event_date_to: entries.length === 1 ? entries[0]?.to : undefined,
      event_dates: entries.map((entry) => (entry.to ? `${entry.from}|${entry.to}` : entry.from)),
      show_time: form.show_time || undefined,
      end_time: form.show_time_end || undefined,
      place: form.place,
      address: form.address || undefined,
      price: isFree ? 'Бесплатно' : (form.price || undefined),
      description: form.description || undefined,
      source_url: form.source_url || undefined,
      is_promo: form.is_promo,
      is_kids: form.is_kids,
      tg_user_id: window.Telegram?.WebApp?.initDataUnsafe?.user?.id ?? null,
      tg_username: window.Telegram?.WebApp?.initDataUnsafe?.user?.username ?? null,
      tg_first_name: window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name ?? null,
    };

    try {
      const res = await fetch(`${API_BASE}/api/events/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d?.detail || 'Не удалось отправить. Попробуйте ещё раз.', { duration: 4000 });
        return;
      }

      handleClose();
      const msg = entries.length > 1
        ? '✅ Событие с несколькими датами отправлено на модерацию!'
        : '✅ Событие отправлено на модерацию!';
      toast.success(msg);
    } catch {
      toast.error('Не удалось отправить. Попробуйте ещё раз.');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (field: keyof FormData, value: string | boolean) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field as keyof FormErrors]) setErrors(e => ({ ...e, [field]: undefined }));
  };

  const handleShowTimeChange = (value: string) => {
    set('show_time', value);
    if (value) setShowTimeSet(true);
    else { setShowTimeSet(false); set('show_time_end', ''); }
  };

  /** Append a calendar-selected date/range to the dateText field */
  const handleCalendarAdd = (from: string, to: string) => {
    const formatted = to ? `${fmtDisplay(from)} — ${fmtDisplay(to)}` : fmtDisplay(from);
    setForm(f => {
      const cur = f.dateText.trim();
      return { ...f, dateText: cur ? `${cur}, ${formatted}` : formatted };
    });
    if (errors.dateText) setErrors(e => ({ ...e, dateText: undefined }));
    setCalendarOpen(false);
  };

  const inputClass = (error?: string) =>
    `w-full rounded-lg border px-2.5 py-1.5 text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-all bg-white/5 select-text ${
      error ? 'border-red-500/70 focus:ring-red-500/30' : 'border-white/10 focus:ring-primary/40 focus:border-primary/50'
    }`;

  const labelClass = 'block text-xs font-body font-medium text-muted-foreground mb-1';
  const timeEndDisabled = !showTimeSet && !form.show_time;

  return (
    <>
      {/* Floating button */}
      <button onClick={() => { haptic('light'); setOpen(true); }}
        className="fixed bottom-24 right-4 sm:bottom-8 sm:right-8 z-40 flex items-center gap-1.5 px-3 py-2 rounded-lg font-body font-medium text-xs text-white shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #c026d3, #9333ea)' }}>
        <Plus className="h-3.5 w-3.5" />
        <span>Добавить</span>
      </button>

      {/* Backdrop desktop */}
      {open && <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 hidden sm:block" onClick={handleClose} />}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
          <div ref={modalRef} onClick={e => e.stopPropagation()}
            className="pointer-events-auto w-full sm:max-w-lg sm:rounded-2xl border-t sm:border border-white/10 flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
            style={{ background: 'linear-gradient(180deg,hsla(270,20%,10%,0.97) 0%,hsla(270,15%,8%,0.99) 100%)', backdropFilter: 'blur(24px)', height: '100dvh', maxHeight: '100dvh' }}>

            {/* Header + Tabs */}
            <div className="flex flex-col border-b border-white/10 shrink-0" style={{ paddingTop: 'max(0.75rem,env(safe-area-inset-top))' }}>
              <div className="flex items-center justify-between px-4 pb-2">
                <h2 className="text-sm font-display font-bold text-foreground flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-primary" /> Добавить событие
                </h2>
                <button onClick={handleClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex px-4">
                {(['single', 'batch'] as const).map(t => (
                  <button key={t} onClick={() => { haptic('light'); setTab(t); }}
                    className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-body font-medium border-b-2 transition-all ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                    {t === 'single' ? <><Plus className="h-3 w-3" /> Одно событие</> : <><Upload className="h-3 w-3" /> Список событий</>}
                  </button>
                ))}
              </div>
            </div>

            {tab === 'batch' && <div className="overflow-y-auto flex-1"><BatchTab onClose={handleClose} /></div>}

            {tab === 'single' && (
              <>
                <div className="overflow-y-auto flex-1 px-5 py-3 space-y-3 select-none">

                  <div>
                    <label className={labelClass}>Название <span className="text-red-400">*</span></label>
                    <input type="text" placeholder="Название мероприятия" value={form.title}
                      onChange={e => set('title', e.target.value)} className={inputClass(errors.title)} />
                    {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title}</p>}
                  </div>

                  <div>
                    <label className={labelClass}>Формат <span className="text-red-400">*</span></label>
                    <input type="text" placeholder="Концерт, спектакль, мастер-класс..." value={form.format}
                      onChange={e => set('format', e.target.value)} className={inputClass(errors.format)} />
                    {errors.format && <p className="text-xs text-red-400 mt-1">{errors.format}</p>}
                  </div>

                  <div>
                    <label className={labelClass}>Категория <span className="text-red-400">*</span></label>
                    <div className="grid grid-cols-3 gap-2">
                      {categories.filter(cat => cat.slug !== 'kids' && cat.slug !== 'free' && cat.slug !== 'quests').map(cat => (
                        <button key={cat.slug} type="button"
                          onClick={() => { haptic('light'); set('category', cat.slug); }}
                          className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-xs font-body transition-all ${
                            form.category === cat.slug
                              ? 'border-primary bg-primary/20 text-primary'
                              : 'border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground'
                          }`}>
                          <span className="text-base">{cat.emoji}</span>
                          <span className="truncate w-full text-center leading-tight">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                    {errors.category && <p className="text-xs text-red-400 mt-1">{errors.category}</p>}
                    <button type="button" onClick={() => { haptic('light'); set('is_kids', !form.is_kids); }}
                      className={`mt-2 flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-body font-medium transition-all ${form.is_kids ? 'border-amber-500/60 bg-amber-500/15 text-amber-400' : 'border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground'}`}>
                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${form.is_kids ? 'bg-amber-500 border-amber-500' : 'border-white/30'}`}>
                        {form.is_kids && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </span>
                      🧸 Для детей
                    </button>
                  </div>

                  {/* ─── Date field + calendar ─────────────────────────────── */}
                  <div>
                    <label className={labelClass}>Дата проведения <span className="text-red-400">*</span></label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="25.04.2026 или 25.04 — 30.04.2026"
                        value={form.dateText}
                        onChange={e => { set('dateText', e.target.value); setCalendarOpen(false); }}
                        className={`${inputClass(errors.dateText)} flex-1`}
                      />
                      <button
                        type="button"
                        onClick={() => { haptic('light'); setCalendarOpen(v => !v); }}
                        title="Выбрать в календаре"
                        className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border transition-all ${
                          calendarOpen
                            ? 'border-primary bg-primary/20 text-primary'
                            : 'border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground'
                        }`}>
                        <Calendar className="h-4 w-4" />
                      </button>
                    </div>
                    {errors.dateText && <p className="text-xs text-red-400 mt-1">{errors.dateText}</p>}
                    {!errors.dateText && (
                      <p className="text-[10px] text-muted-foreground/50 mt-1">
                        Несколько дат или периодов — через запятую
                      </p>
                    )}
                    {calendarOpen && (
                      <CalendarPicker onAdd={handleCalendarAdd} onClose={() => setCalendarOpen(false)} />
                    )}
                    <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                      <input type="time" value={form.show_time}
                        onChange={e => handleShowTimeChange(e.target.value)} className={inputClass()} />
                      <input type="time" value={form.show_time_end}
                        onChange={e => set('show_time_end', e.target.value)}
                        disabled={timeEndDisabled}
                        className={`${inputClass()} disabled:opacity-40 disabled:cursor-not-allowed`} />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Площадка <span className="text-red-400">*</span></label>
                    <input type="text" placeholder="Prime Hall, Театр Купалы..." value={form.place}
                      onChange={e => set('place', e.target.value)} className={inputClass(errors.place)} />
                    {errors.place && <p className="text-xs text-red-400 mt-1">{errors.place}</p>}
                  </div>

                  <div>
                    <label className={labelClass}>Адрес</label>
                    <input type="text" placeholder="ул. Притыцкого, 62" value={form.address}
                      onChange={e => set('address', e.target.value)} className={inputClass()} />
                  </div>

                  <div>
                    <label className={labelClass}>Цена</label>
                    <div className="flex items-center gap-2">
                      <input type="text" placeholder="от 20 BYN" value={form.price}
                        onChange={e => set('price', e.target.value)} disabled={isFree}
                        className={`${inputClass()} flex-1 disabled:opacity-40 disabled:cursor-not-allowed`} />
                      <button type="button"
                        onClick={() => { haptic('light'); if (!isFree) set('price', ''); setIsFree(v => !v); }}
                        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-xs font-body font-medium whitespace-nowrap shrink-0 transition-all ${isFree ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-400' : 'border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground'}`}>
                        <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${isFree ? 'bg-emerald-500 border-emerald-500' : 'border-white/30'}`}>
                          {isFree && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </span>
                        Бесплатно
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Описание <span className="ml-1 text-muted-foreground/60">{form.description.length}/500</span></label>
                    <textarea placeholder="Расскажите подробнее..." value={form.description}
                      maxLength={500} rows={3}
                      onChange={e => set('description', e.target.value)}
                      className={`${inputClass()} resize-none`} />
                  </div>

                  <div>
                    <label className={labelClass}>Ссылка</label>
                    <input type="url" placeholder="https://..." value={form.source_url}
                      onChange={e => set('source_url', e.target.value)} className={inputClass(errors.source_url)} />
                    {errors.source_url && <p className="text-xs text-red-400 mt-1">{errors.source_url}</p>}
                  </div>

                  <div>
                    <button type="button"
                      onClick={() => { haptic('light'); set('is_promo', !form.is_promo); }}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all ${form.is_promo ? 'border-fuchsia-500/60 bg-fuchsia-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Megaphone className={`h-4 w-4 shrink-0 ${form.is_promo ? 'text-fuchsia-400' : 'text-muted-foreground'}`} />
                        <div className="text-left min-w-0">
                          <p className={`text-sm font-body font-medium leading-tight ${form.is_promo ? 'text-fuchsia-300' : 'text-foreground'}`}>Промо-публикация</p>
                          <p className="text-[11px] text-muted-foreground font-body leading-tight mt-0.5">После одобрения — пост в канал и рассылка подписчикам</p>
                        </div>
                      </div>
                      <div className="relative shrink-0 rounded-full transition-colors duration-200"
                        style={{ width: 40, height: 22, background: form.is_promo ? '#a855f7' : 'rgba(255,255,255,0.2)' }}>
                        <span className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-transform duration-200 ${form.is_promo ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                      </div>
                    </button>
                    {form.is_promo && (
                      <p className="text-[11px] text-fuchsia-400/80 font-body mt-1.5 px-1">
                        📣 Событие будет опубликовано в канале @MinskDvizh после одобрения модератором.
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-5 border-t border-white/10 shrink-0"
                  style={{ paddingTop: '1rem', paddingBottom: 'max(1rem,env(safe-area-inset-bottom))' }}>
                  <button onClick={handleSubmit} disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-body font-semibold text-sm text-white disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #c026d3, #9333ea)' }}>
                    {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Отправляем...</> : 'Отправить на модерацию →'}
                  </button>
                  <p className="text-center text-xs text-muted-foreground font-body mt-2">* — обязательные поля</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
