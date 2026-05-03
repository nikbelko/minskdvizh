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
import { RefreshCw, ShieldAlert, Users, Globe, Bell, Database, Clock3, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const ADMIN_ID = 502917728;

const chartConfig = {
  dau: { label: 'DAU', color: '#00e5ff' },
  users: { label: 'Пользователи', color: '#00e5ff' },
  mau: { label: 'MAU', color: '#00e5ff' },
  new_users: { label: 'Уникальные', color: '#a78bfa' },
  actions: { label: 'Действия', color: '#c026d3' },
  webapp_users: { label: 'WebApp', color: '#22c55e' },
  submissions: { label: 'Сабмиты', color: '#f59e0b' },
  submissions_no_admin: { label: 'Сабмиты без админа', color: '#f59e0b' },
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

interface QuickMetric {
  label: string;
  value: number;
  delta: number;
}

function QuickSummaryCard({ metric }: { metric: QuickMetric }) {
  const isPositive = metric.delta >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const trendColor = metric.delta > 0 ? 'text-green-400' : metric.delta < 0 ? 'text-red-400' : 'text-muted-foreground';

  return (
    <div className="p-3 rounded-lg border border-white/10 bg-white/5">
      <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-display font-bold">{metric.value}</p>
        <div className={`flex items-center gap-0.5 text-xs ${trendColor}`}>
          <TrendIcon className="h-3 w-3" />
          <span>{Math.abs(metric.delta)}</span>
        </div>
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  description,
  isCollapsed,
  onToggle,
  children,
}: {
  title: string;
  description?: string;
  isCollapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-white/10 bg-white/5">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/10 transition-colors text-left"
      >
        <div>
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {description && <CardDescription className="text-xs mt-1">{description}</CardDescription>}
        </div>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
      </button>
      {!isCollapsed && <CardContent className="pb-6 border-t border-white/10">{children}</CardContent>}
    </Card>
  );
}

const AdminDashboard = () => {
  const tgUser = getTelegramUser();
  const isAdmin = tgUser?.id === ADMIN_ID;
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [includeAdminData, setIncludeAdminData] = useState(false);

  // Collapse state - all collapsed by default
  const [collapsed, setCollapsed] = useState({
    kpi: true,
    daily: true,
    submissions: true,
    monthly: true,
    funnel: true,
    topActions: true,
    sources: true,
    subscriptions: true,
    categories: true,
  });

  const toggleSection = (section: keyof typeof collapsed) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

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
              <p className="mt-2 text-sm font-body text-muted-foreground">Admin dashboard доступен только администратору бота.</p>
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
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm font-body text-muted-foreground mt-1">
              Динамика пользователей, активности, базы событий и подписок за {data?.period_days ?? 30} дней
            </p>
          </div>
          <button
            onClick={() => { haptic('selection'); refetch(); }}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-body text-foreground hover:border-primary/30 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
        </div>

        <label className="flex items-center gap-2 text-xs font-body text-muted-foreground rounded-lg border border-white/10 bg-white/5 px-3 py-2 w-fit">
          <Checkbox checked={includeAdminData} onCheckedChange={(checked) => setIncludeAdminData(Boolean(checked))} />
          Admin данные
        </label>

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
            {/* Quick Summary - Always Visible */}
            <Card className="border-white/10 bg-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Сводка {new Date().toLocaleDateString('ru-RU')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <QuickSummaryCard
                    metric={{
                      label: 'Пользователи',
                      value: data?.today_summary.unique_users_today ?? 0,
                      delta: data?.today_summary.unique_users_delta ?? 0,
                    }}
                  />
                  <QuickSummaryCard
                    metric={{
                      label: 'Уникальные',
                      value: data?.today_summary.total_users_delta ?? 0,
                      delta: 0,
                    }}
                  />
                  <QuickSummaryCard
                    metric={{
                      label: 'Действия',
                      value: data?.today_summary.actions_today ?? 0,
                      delta: data?.today_summary.actions_delta ?? 0,
                    }}
                  />
                  <div className="p-3 rounded-lg border border-white/10 bg-white/5">
                    <p className="text-xs text-muted-foreground mb-1">Обновлено</p>
                    <p className="text-sm font-mono text-foreground break-words">
                      {new Date(data!.generated_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(data!.generated_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KPI Section */}
            <CollapsibleSection
              title="KPI"
              isCollapsed={collapsed.kpi}
              onToggle={() => toggleSection('kpi')}
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Пользователи" value={overview.total_users} subtitle={`DAU ${overview.dau} • WAU ${overview.wau} • MAU ${overview.mau}`} icon={Users} />
                <StatCard title="WebApp" value={overview.webapp_total} subtitle={`DAU ${overview.webapp_dau} • WAU ${overview.webapp_wau} • MAU ${overview.webapp_mau}`} icon={Globe} />
                <StatCard title="Подписки" value={overview.subscribers_count} subtitle={`Всего подписок ${overview.subscriptions_total} • Flash ${overview.flash_total}`} icon={Bell} />
                <StatCard title="База событий" value={overview.events_count} subtitle={`Flash-пользователей ${overview.flash_users}`} icon={Database} />
                <StatCard title="Новые пользователи" value={totalNewUsers} subtitle={`+${overview.new_today} день • +${overview.new_7d} неделя • +${overview.new_30d} месяц`} icon={Users} />
                <StatCard title="Очередь модерации" value={overview.pending_count} subtitle={`Одобрено ${overview.approved_total} • Отклонено ${overview.rejected_total}`} icon={Clock3} />
                <StatCard title="Действия" value={overview.total_actions} subtitle={`Сегодня ${overview.actions_today} • Проекту ${overview.days_alive} дн`} icon={RefreshCw} />
                <StatCard title="Flash-уведомления" value={overview.flash_notified_users_30d} subtitle={`Новых flash сегодня ${overview.flash_new_today} • за 30д ${overview.flash_new_30d}`} icon={Bell} />
              </div>
            </CollapsibleSection>

            {/* Daily Activity Section */}
            <CollapsibleSection
              title="Дневная активность"
              description="Пользователи, Уникальные, Действия и WebApp в выбранном диапазоне"
              isCollapsed={collapsed.daily}
              onToggle={() => toggleSection('daily')}
            >
              <div className="mb-4 grid gap-2 sm:grid-cols-2 w-fit">
                <div>
                  <div className="mb-1 text-xs font-body text-muted-foreground">От</div>
                  <Input type="date" value={fromDate} max={toDate || undefined} onChange={(e) => setFromDate(e.target.value)} className="bg-white/5 border-white/10 h-8 text-xs" />
                </div>
                <div>
                  <div className="mb-1 text-xs font-body text-muted-foreground">До</div>
                  <Input type="date" value={toDate} min={fromDate || undefined} onChange={(e) => setToDate(e.target.value)} className="bg-white/5 border-white/10 h-8 text-xs" />
                </div>
              </div>
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <LineChart data={filteredDailyChart}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="day" tickFormatter={formatDayLabel} minTickGap={24} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="users" stroke="var(--color-users)" strokeWidth={2.5} dot={false} name="Пользователи" />
                  <Line type="monotone" dataKey="new_users" stroke="var(--color-new_users)" strokeWidth={2} dot={false} name="Уникальные" />
                  <Line type="monotone" dataKey="actions" stroke="var(--color-actions)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="webapp_users" stroke="var(--color-webapp_users)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </CollapsibleSection>

            {/* Submissions Section */}
            <CollapsibleSection
              title="Сабмиты по дням"
              description="Пользовательские отправки событий в выбранном диапазоне"
              isCollapsed={collapsed.submissions}
              onToggle={() => toggleSection('submissions')}
            >
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <BarChart data={filteredDailyChart}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="day" tickFormatter={formatDayLabel} minTickGap={24} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey={submissionDataKey} fill="var(--color-submissions)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CollapsibleSection>

            {/* Monthly & Funnel Grid */}
            <div className="grid gap-4 xl:grid-cols-2">
              {/* Monthly Section */}
              <CollapsibleSection
                title="Месячная динамика"
                description="Пользователи, Уникальные и Действия по месяцам"
                isCollapsed={collapsed.monthly}
                onToggle={() => toggleSection('monthly')}
              >
                <ChartContainer config={chartConfig} className="h-[260px] w-full">
                  <AreaChart data={data?.monthly_chart}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickFormatter={formatMonthLabel} minTickGap={20} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="users" stroke="var(--color-users)" fill="var(--color-users)" fillOpacity={0.18} name="Пользователи" />
                    <Area type="monotone" dataKey="new_users" stroke="var(--color-new_users)" fill="var(--color-new_users)" fillOpacity={0.12} name="Уникальные" />
                    <Area type="monotone" dataKey="actions" stroke="var(--color-actions)" fill="var(--color-actions)" fillOpacity={0.08} name="Действия" />
                  </AreaChart>
                </ChartContainer>
              </CollapsibleSection>

              {/* Funnel Section */}
              <CollapsibleSection
                title="Воронка действий за 30 дней"
                description="Counts и конверсии между этапами"
                isCollapsed={collapsed.funnel}
                onToggle={() => toggleSection('funnel')}
              >
                <div className="space-y-3">
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
                </div>
              </CollapsibleSection>
            </div>

            {/* Top Actions, Sources, Subscriptions Grid */}
            <div className="grid gap-4 xl:grid-cols-3">
              {/* Top Actions */}
              <CollapsibleSection
                title="Топ действий"
                description="Чаще всего пользователи делают это"
                isCollapsed={collapsed.topActions}
                onToggle={() => toggleSection('topActions')}
              >
                <div className="space-y-2">
                  {(data?.top_actions ?? []).map((row) => (
                    <div key={row.action} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      <span className="text-sm font-body text-foreground">{row.action}</span>
                      <span className="text-sm font-mono text-primary">{row.count}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              {/* Sources */}
              <CollapsibleSection
                title="Источники событий"
                description="Предстоящие события по source_name"
                isCollapsed={collapsed.sources}
                onToggle={() => toggleSection('sources')}
              >
                <div className="space-y-2">
                  {topSources.map((row) => (
                    <div key={row.source_name} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      <span className="text-sm font-body text-foreground">{row.source_name}</span>
                      <span className="text-sm font-mono text-primary">{row.count}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              {/* Subscriptions */}
              <CollapsibleSection
                title="Подписки по категориям"
                description="Активные category subscriptions"
                isCollapsed={collapsed.subscriptions}
                onToggle={() => toggleSection('subscriptions')}
              >
                <div className="space-y-2">
                  {topSubscriptions.map((row) => (
                    <div key={row.category} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      <span className="text-sm font-body text-foreground">{row.category}</span>
                      <span className="text-sm font-mono text-primary">{row.count}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            </div>

            {/* Categories & Summary Grid */}
            <div className="grid gap-4 xl:grid-cols-2">
              {/* Categories */}
              <CollapsibleSection
                title="Категории в базе"
                description="Предстоящие события по категориям"
                isCollapsed={collapsed.categories}
                onToggle={() => toggleSection('categories')}
              >
                <div className="space-y-2">
                  {topCategories.map((row) => (
                    <div key={row.category} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      <span className="text-sm font-body text-foreground">{row.category}</span>
                      <span className="text-sm font-mono text-primary">{row.count}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              {/* Summary */}
              <Card className="border-white/10 bg-white/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Сводка</CardTitle>
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
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
