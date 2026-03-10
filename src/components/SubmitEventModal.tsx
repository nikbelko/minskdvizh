import { useState, useRef, useEffect } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { haptic } from '@/lib/telegram';
import { categories, type CategorySlug } from '@/data/events';

const API_BASE = 'https://minskdvizh.up.railway.app';

interface FormData {
  title: string;
  format: string;
  category: CategorySlug | '';
  date_mode: 'single' | 'range';
  event_date: string;
  event_date_to: string;
  show_time: string;
  place: string;
  address: string;
  price: string;
  description: string;
  source_url: string;
}

interface FormErrors {
  title?: string;
  format?: string;
  category?: string;
  event_date?: string;
  event_date_to?: string;
  place?: string;
  source_url?: string;
}

const today = new Date().toISOString().split('T')[0];

const EMPTY_FORM: FormData = {
  title: '', format: '', category: '', date_mode: 'single',
  event_date: '', event_date_to: '', show_time: '',
  place: '', address: '', price: '', description: '', source_url: '',
};

export default function SubmitEventModal() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  // Lock scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.title.trim() || form.title.trim().length < 3)
      e.title = 'Введите название (мин. 3 символа)';
    if (!form.format.trim() || form.format.trim().length < 3)
      e.format = 'Введите формат (мин. 3 символа)';
    if (!form.category)
      e.category = 'Выберите категорию';
    if (!form.event_date)
      e.event_date = 'Выберите дату';
    else if (form.event_date < today)
      e.event_date = 'Дата не может быть в прошлом';
    if (form.date_mode === 'range') {
      if (!form.event_date_to)
        e.event_date_to = 'Выберите дату окончания';
      else if (form.event_date_to <= form.event_date)
        e.event_date_to = 'Дата окончания должна быть позже начала';
    }
    if (!form.place.trim() || form.place.trim().length < 3)
      e.place = 'Введите название площадки (мин. 3 символа)';
    if (form.source_url && !form.source_url.startsWith('http'))
      e.source_url = 'Введите корректную ссылку (начиная с http)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    haptic('medium');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/events/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          details: form.format,
          event_date_to: form.date_mode === 'range' ? form.event_date_to : undefined,
          show_time: form.show_time || undefined,
          address: form.address || undefined,
          price: form.price || undefined,
          description: form.description || undefined,
          source_url: form.source_url || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      setOpen(false);
      setForm(EMPTY_FORM);
      setErrors({});
      toast.success('✅ Событие отправлено на модерацию!');
    } catch {
      toast.error('Не удалось отправить. Попробуйте ещё раз.');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (field: keyof FormData, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(e => ({ ...e, [field]: undefined }));
    }
  };

  const inputClass = (error?: string) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all bg-white/5 ${
      error
        ? 'border-red-500/70 focus:ring-red-500/30'
        : 'border-white/10 focus:ring-primary/40 focus:border-primary/50'
    }`;

  const labelClass = 'block text-xs font-body font-medium text-muted-foreground mb-1.5';

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { haptic('light'); setOpen(true); }}
        className="fixed bottom-24 right-4 sm:bottom-8 sm:right-8 z-40 flex items-center gap-1.5 px-3 py-2 rounded-lg font-body font-medium text-xs text-white shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #c026d3, #9333ea)' }}
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Добавить</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
          <div
            ref={modalRef}
            onClick={e => e.stopPropagation()}
            className="pointer-events-auto w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-white/10 flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
            style={{
              background: 'linear-gradient(180deg, hsla(270,20%,10%,0.97) 0%, hsla(270,15%,8%,0.99) 100%)',
              backdropFilter: 'blur(24px)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
              <h2 className="text-base font-display font-bold text-foreground flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                Добавить событие
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {/* Название */}
              <div>
                <label className={labelClass}>Название <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="Название мероприятия"
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  className={inputClass(errors.title)}
                />
                {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title}</p>}
              </div>

              {/* Формат */}
              <div>
                <label className={labelClass}>Формат <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="Концерт, спектакль, мастер-класс..."
                  value={form.format}
                  onChange={e => set('format', e.target.value)}
                  className={inputClass(errors.format)}
                />
                {errors.format && <p className="text-xs text-red-400 mt-1">{errors.format}</p>}
              </div>

              {/* Категория */}
              <div>
                <label className={labelClass}>Категория <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => { haptic('light'); set('category', cat.slug); }}
                      className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-xs font-body transition-all ${
                        form.category === cat.slug
                          ? 'border-primary bg-primary/20 text-primary'
                          : 'border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground'
                      }`}
                    >
                      <span className="text-base">{cat.emoji}</span>
                      <span className="truncate w-full text-center leading-tight">{cat.name}</span>
                    </button>
                  ))}
                </div>
                {errors.category && <p className="text-xs text-red-400 mt-1">{errors.category}</p>}
              </div>

              {/* Режим даты */}
              <div>
                <label className={labelClass}>Дата проведения <span className="text-red-400">*</span></label>
                <div className="flex gap-2 mb-2">
                  {(['single', 'range'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => { haptic('light'); set('date_mode', mode); }}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-body transition-all ${
                        form.date_mode === mode
                          ? 'border-primary bg-primary/20 text-primary'
                          : 'border-white/10 bg-white/5 text-muted-foreground'
                      }`}
                    >
                      {mode === 'single' ? '📅 Одна дата' : '📆 Период'}
                    </button>
                  ))}
                </div>

                {form.date_mode === 'single' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input type="date" min={today} value={form.event_date}
                        onChange={e => set('event_date', e.target.value)}
                        className={inputClass(errors.event_date)} />
                      {errors.event_date && <p className="text-xs text-red-400 mt-1">{errors.event_date}</p>}
                    </div>
                    <div>
                      <input type="time" value={form.show_time}
                        onChange={e => set('show_time', e.target.value)}
                        className={inputClass()} placeholder="Время" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground/70 mb-1 block">С</label>
                        <input type="date" min={today} value={form.event_date}
                          onChange={e => set('event_date', e.target.value)}
                          className={inputClass(errors.event_date)} />
                        {errors.event_date && <p className="text-xs text-red-400 mt-1">{errors.event_date}</p>}
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground/70 mb-1 block">По</label>
                        <input type="date" min={form.event_date || today} value={form.event_date_to}
                          onChange={e => set('event_date_to', e.target.value)}
                          className={inputClass(errors.event_date_to)} />
                        {errors.event_date_to && <p className="text-xs text-red-400 mt-1">{errors.event_date_to}</p>}
                      </div>
                    </div>
                    <div>
                      <input type="time" value={form.show_time}
                        onChange={e => set('show_time', e.target.value)}
                        className={inputClass()} placeholder="Время (одинаковое каждый день)" />
                    </div>
                    {form.event_date && form.event_date_to && form.event_date_to > form.event_date && (
                      <p className="text-xs text-muted-foreground/60">
                        ℹ️ Будет создана запись для каждого дня периода
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Площадка */}
              <div>
                <label className={labelClass}>Площадка <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="Prime Hall, Театр Купалы..."
                  value={form.place}
                  onChange={e => set('place', e.target.value)}
                  className={inputClass(errors.place)}
                />
                {errors.place && <p className="text-xs text-red-400 mt-1">{errors.place}</p>}
              </div>

              {/* Адрес */}
              <div>
                <label className={labelClass}>Адрес</label>
                <input
                  type="text"
                  placeholder="ул. Притыцкого, 62"
                  value={form.address}
                  onChange={e => set('address', e.target.value)}
                  className={inputClass()}
                />
              </div>

              {/* Цена */}
              <div>
                <label className={labelClass}>Цена</label>
                <input
                  type="text"
                  placeholder="от 20 BYN / Бесплатно"
                  value={form.price}
                  onChange={e => set('price', e.target.value)}
                  className={inputClass()}
                />
              </div>

              {/* Описание */}
              <div>
                <label className={labelClass}>
                  Описание
                  <span className="ml-2 text-muted-foreground/60">{form.description.length}/500</span>
                </label>
                <textarea
                  placeholder="Расскажите подробнее..."
                  value={form.description}
                  maxLength={500}
                  rows={3}
                  onChange={e => set('description', e.target.value)}
                  className={`${inputClass()} resize-none`}
                />
              </div>

              {/* Ссылка */}
              <div>
                <label className={labelClass}>Ссылка</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.source_url}
                  onChange={e => set('source_url', e.target.value)}
                  className={inputClass(errors.source_url)}
                />
                {errors.source_url && <p className="text-xs text-red-400 mt-1">{errors.source_url}</p>}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-white/10 shrink-0">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-body font-semibold text-sm text-white disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:opacity-90 active:scale-98"
                style={{ background: 'linear-gradient(135deg, #c026d3, #9333ea)' }}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Отправляем...</>
                ) : (
                  'Отправить на модерацию →'
                )}
              </button>
              <p className="text-center text-xs text-muted-foreground font-body mt-2">
                * — обязательные поля
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
