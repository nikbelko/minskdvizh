import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTelegramUser, haptic } from '@/lib/telegram';
import { fetchAdminDashboard } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';
import { RefreshCw, ShieldAlert, Users, Globe, Bell, Database, Clock3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const ADMIN_ID = 502917728;

const chartConfig = {
  dau: { label: 'DAU', color: '#00e5ff' },
  mau: { label: 'MAU', color: '#00e5ff' },
  actions: { label: 'Действия', color: '#c026d3' },
  webapp_users: { label: 'WebApp', color: '#22c55e' },
  submissions: { label: 'Сабмиты', color: '#f59e0b' },
  submissions_no_admin: { label: 'Сабмиты без админа', color: '#f59e0b' },
  new_users: { label: 'Новые пользователи', color: '#a78bfa' },
} as const;

function formatDayLabel(day: string) {
  return day.slice(5).split('-').reverse().join('.');
}

function formatMonthLabel(month: string) {
  const [year, mon] = month.split('-');
  return `${mon}.${year.slice(2)}`;
}

function StatCard({
  title, value, subtitle, icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-body text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-display font-bold text-foreground">{value}</p>
            {subtitle && <p className="mt-1 text-xs font-body text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function deltaLabel(delta: number) {
  if (delta > 0) return `+${delta} к вчера`;
  if (delta < 0) return `${delta} к вчера`;
  return 'без изменений ко вчера';
}

const AdminDashboard = () => {
  const tgUser = getTelegramUser();
  const isAdmin = tgUser?.id === ADMIN_ID;
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [includeAdminData, setIncludeAdminData] = useState(false);

  const { data, isLoading, isError, refetch, error } = useQuery({
    queryKey: ['admin-dashboard', tgUser?.id, includeAdminData],
    queryFn: () => fetchAdminDashboard(tgUser!.id, 90, !includeAdminData),
    enabled: isAdmin,
    staleTime: 60_000,
    retry: 1,
  });

  const overview = data?.overview;

  const topSources = useMemo(() => (data?.events_by_source ?? []).slice(0, 8), [data]);
  const topCategories = useMemo(() => (data?.events_by_category ?? []).slice(0, 8), [data]);
  const topSubscriptions = useMemo(() => (data?.subscriptions_by_category ?? []).slice(0, 8), [data]);
  const totalNewUsers = overview?.total_users ?? 0;

  useEffect(() => {
    if (!data?.daily_chart?.length) return;
    const defaultTo = data.daily_chart[data.daily_chart.length - 1]?.day ?? '';
    const defaultFrom = data.daily_chart[Math.max(0, data.daily_chart.length - 30)]?.day ?? data.daily_chart[0]?.day ?? '';
    setFromDate((current) => current || defaultFrom);
    setToDate((current) => current || defaultTo);
  }, [data]);

  const filteredDailyChart = useMemo(() => {
    if (!data?.daily_chart) return [];
    return data.daily_chart.filter((row) => {
      if (fromDate && row.day < fromDate) return false;
      if (toDate && row.day > toDate) return false;
      return true;
    });
  }, [data, fromDate, toDate]);

  const submissionDataKey = includeAdminData ? 'submissions' : 'submissions_no_admin';

  const funnelRows = useMemo(() => {
    const start = data?.funnel.start ?? 0;
    const webapp = data?.funnel.webapp_ping ?? 0;
    const discovery = (data?.funnel.filter_category ?? 0) + (data?.funnel.open_category ?? 0);
    const subscribed = (data?.funnel.subscribe ?? 0) + (data?.funnel.web_flash_subscribe ?? 0);
    const submitted = (data?.funnel.submit_event_sent ?? 0) + (data?.funnel.web_submit_event ?? 0);
    const rows = [
      { key: 'start', label: 'Start', count: start },
      { key: 'webapp', label: 'WebApp open', count: webapp },
      { key: 'discovery', label: 'Explore', count: discovery },
      { key: 'subscribed', label: 'Subscribe', count: subscribed },
      { key: 'submitted', label: 'Submit event', count: submitted },
    ];
    return rows.map((row, index) => {
      const prev = index === 0 ? row.count : rows[index - 1].count;
      const fromStart = start > 0 ? (row.count / start) * 100 : 0;
      const fromPrev = prev > 0 ? (row.count / prev) * 100 : 0;
      return { ...row, fromStart, fromPrev };
    });
  }, [data]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background relative">
        <div className="grain-overlay" />
        <div className="container mx-auto px-4 py-10">
          <Card className="max-w-xl mx-auto border-red-500/20 bg-red-500/5">
            <CardContent className="p-8 text-center">
              <ShieldAlert className="h-10 w-10 text-red-400 mx-auto mb-4" />
              <h1 className="text-xl font-display font-bold text-foreground">Доступ запрещён</h1>
              <p className="mt-2 text-sm font-body text-muted-foreground">
                Admin dashboard доступен только администратору бота.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="grain-overlay" />
      <div className="container mx-auto px-4 py-6 sm:py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm font-body text-muted-foreground mt-1">
              Динамика пользователей, активности, базы событий и подписок за {data?.period_days ?? 30} дней
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-body text-muted-foreground rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <Checkbox checked={includeAdminData} onCheckedChange={(checked) => setIncludeAdminData(Boolean(checked))} />
              Включать данные админа
            </label>
            <button
              onClick={() => { haptic('selection'); refetch(); }}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-body text-foreground hover:border-primary/30 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Обновить
            </button>
          </div>
        </div>

        {isError && (
          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="p-4 text-sm font-body text-red-200">
              Не удалось загрузить admin dashboard.
              {error instanceof Error ? ` ${error.message}` : ''}
            </CardContent>
          </Card>
        )}

        {isLoading && !data && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="border-white/10 bg-white/5">
                <CardContent className="p-4 h-28 animate-pulse" />
              </Card>
            ))}
          </div>
        )}

        {overview && (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Сегодня: всего пользователей"
                value={data?.today_summary.total_users ?? 0}
                subtitle={deltaLabel(data?.today_summary.total_users_delta ?? 0)}
                icon={Users}
              />
              <StatCard
                title="Сегодня: из них уникальных"
                value={data?.today_summary.unique_users_today ?? 0}
                subtitle={deltaLabel(data?.today_summary.unique_users_delta ?? 0)}
                icon={Users}
              />
              <StatCard
                title="Сегодня: всего действий"
                value={data?.today_summary.actions_today ?? 0}
                subtitle={deltaLabel(data?.today_summary.actions_delta ?? 0)}
                icon={RefreshCw}
              />
              <StatCard
                title="Обновлено"
                value={new Date(data!.generated_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                subtitle={new Date(data!.generated_at).toLocaleDateString('ru-RU')}
                icon={Clock3}
              />
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Пользователи" value={overview.total_users} subtitle={`DAU ${overview.dau} • WAU ${overview.wau} • MAU ${overview.mau}`} icon={Users} />
              <StatCard title="WebApp" value={overview.webapp_total} subtitle={`DAU ${overview.webapp_dau} • WAU ${overview.webapp_wau} • MAU ${overview.webapp_mau}`} icon={Globe} />
              <StatCard title="Подписки" value={overview.subscribers_count} subtitle={`Всего подписок ${overview.subscriptions_total} • Flash ${overview.flash_total}`} icon={Bell} />
              <StatCard title="База событий" value={overview.events_count} subtitle={`Flash-пользователей ${overview.flash_users}`} icon={Database} />
              <StatCard title="Новые пользователи" value={totalNewUsers} subtitle={`+${overview.new_today} день • +${overview.new_7d} неделя • +${overview.new_30d} месяц`} icon={Users} />
              <StatCard title="Очередь модерации" value={overview.pending_count} subtitle={`Одобрено ${overview.approved_total} • Отклонено ${overview.rejected_total}`} icon={Clock3} />
              <StatCard title="Действия" value={overview.total_actions} subtitle={`Сегодня ${overview.actions_today} • Проекту ${overview.days_alive} дн`} icon={RefreshCw} />
              <StatCard title="Flash-уведомления" value={overview.flash_notified_users_30d} subtitle={`Новых flash сегодня ${overview.flash_new_today} • за 30д ${overview.flash_new_30d}`} icon={Bell} />
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Дневная активность</CardTitle>
                  <CardDescription>Действия, DAU и WebApp в выбранном диапазоне</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="mb-1 text-xs font-body text-muted-foreground">От</div>
                      <Input type="date" value={fromDate} max={toDate || undefined} onChange={(e) => setFromDate(e.target.value)} className="bg-white/5 border-white/10" />
                    </div>
                    <div>
                      <div className="mb-1 text-xs font-body text-muted-foreground">До</div>
                      <Input type="date" value={toDate} min={fromDate || undefined} onChange={(e) => setToDate(e.target.value)} className="bg-white/5 border-white/10" />
                    </div>
                  </div>
                  <ChartContainer config={chartConfig} className="h-[280px] w-full">
                    <LineChart data={filteredDailyChart}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="day" tickFormatter={formatDayLabel} minTickGap={24} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="dau" stroke="var(--color-dau)" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey="actions" stroke="var(--color-actions)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="webapp_users" stroke="var(--color-webapp_users)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Сабмиты по дням</CardTitle>
                  <CardDescription>Пользовательские отправки событий в выбранном диапазоне</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[280px] w-full">
                    <BarChart data={filteredDailyChart}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="day" tickFormatter={formatDayLabel} minTickGap={24} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey={submissionDataKey} fill="var(--color-submissions)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Месячная динамика</CardTitle>
                  <CardDescription>MAU, действия и WebApp по месяцам</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[260px] w-full">
                    <AreaChart data={data?.monthly_chart}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="month" tickFormatter={formatMonthLabel} minTickGap={20} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="mau" stroke="var(--color-mau)" fill="var(--color-mau)" fillOpacity={0.18} />
                      <Area type="monotone" dataKey="actions" stroke="var(--color-actions)" fill="var(--color-actions)" fillOpacity={0.12} />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Воронка действий за 30 дней</CardTitle>
                  <CardDescription>Counts и конверсии между этапами</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {funnelRows.map((row, index) => (
                    <div key={row.key} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-body text-muted-foreground">{row.label}</div>
                          <div className="mt-1 text-xl font-display font-bold">{row.count}</div>
                        </div>
                        <div className="text-right text-xs font-body text-muted-foreground">
                          <div>{row.fromStart.toFixed(1)}% от старта</div>
                          {index > 0 && <div>{row.fromPrev.toFixed(1)}% от пред. шага</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 xl:grid-cols-3">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Топ действий</CardTitle>
                  <CardDescription>Чаще всего пользователи делают это</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(data?.top_actions ?? []).map((row) => (
                    <div key={row.action} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      <span className="text-sm font-body text-foreground">{row.action}</span>
                      <span className="text-sm font-mono text-primary">{row.count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Источники событий</CardTitle>
                  <CardDescription>Предстоящие события по source_name</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {topSources.map((row) => (
                    <div key={row.source_name} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      <span className="text-sm font-body text-foreground">{row.source_name}</span>
                      <span className="text-sm font-mono text-primary">{row.count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Подписки по категориям</CardTitle>
                  <CardDescription>Активные category subscriptions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {topSubscriptions.map((row) => (
                    <div key={row.category} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      <span className="text-sm font-body text-foreground">{row.category}</span>
                      <span className="text-sm font-mono text-primary">{row.count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Категории в базе</CardTitle>
                  <CardDescription>Предстоящие события по категориям</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {topCategories.map((row) => (
                    <div key={row.category} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      <span className="text-sm font-body text-foreground">{row.category}</span>
                      <span className="text-sm font-mono text-primary">{row.count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Сводка</CardTitle>
                  <CardDescription>Быстрые контрольные значения</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm font-body">
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Новых пользователей за 30 дней</span><span className="font-mono text-foreground">{overview.new_30d}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Flash-пользователей</span><span className="font-mono text-foreground">{overview.flash_users}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Новых flash сегодня</span><span className="font-mono text-foreground">{overview.flash_new_today}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">WebApp MAU</span><span className="font-mono text-foreground">{overview.webapp_mau}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Сабмиты без админа за период</span><span className="font-mono text-foreground">{overview.submitted_period_no_admin}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Общее число действий сегодня</span><span className="font-mono text-foreground">{overview.actions_today}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Обновлено</span><span className="font-mono text-foreground">{new Date(data!.generated_at).toLocaleString('ru-RU')}</span></div>
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
