import { useMemo } from 'react';
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
import { RefreshCw, ShieldAlert, Users, Globe, Bell, Database, CheckCircle2, Clock3 } from 'lucide-react';

const ADMIN_ID = 502917728;

const chartConfig = {
  users: { label: 'Пользователи', color: '#00e5ff' },
  actions: { label: 'Действия', color: '#c026d3' },
  webapp_users: { label: 'WebApp', color: '#22c55e' },
  submissions: { label: 'Сабмиты', color: '#f59e0b' },
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

const AdminDashboard = () => {
  const tgUser = getTelegramUser();
  const isAdmin = tgUser?.id === ADMIN_ID;

  const { data, isLoading, isError, refetch, error } = useQuery({
    queryKey: ['admin-dashboard', tgUser?.id],
    queryFn: () => fetchAdminDashboard(tgUser!.id, 30),
    enabled: isAdmin,
    staleTime: 60_000,
    retry: 1,
  });

  const overview = data?.overview;

  const topSources = useMemo(() => (data?.events_by_source ?? []).slice(0, 8), [data]);
  const topCategories = useMemo(() => (data?.events_by_category ?? []).slice(0, 8), [data]);
  const topSubscriptions = useMemo(() => (data?.subscriptions_by_category ?? []).slice(0, 8), [data]);

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
          <button
            onClick={() => { haptic('selection'); refetch(); }}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-body text-foreground hover:border-primary/30 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
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
              <StatCard title="Пользователи" value={overview.total_users} subtitle={`DAU ${overview.dau} • WAU ${overview.wau} • MAU ${overview.mau}`} icon={Users} />
              <StatCard title="WebApp" value={overview.webapp_total} subtitle={`DAU ${overview.webapp_dau} • WAU ${overview.webapp_wau} • MAU ${overview.webapp_mau}`} icon={Globe} />
              <StatCard title="Подписки" value={overview.subscribers_count} subtitle={`Всего подписок ${overview.subscriptions_total} • Flash ${overview.flash_total}`} icon={Bell} />
              <StatCard title="База событий" value={overview.events_count} subtitle={`Новых юзеров сегодня ${overview.new_today}`} icon={Database} />
              <StatCard title="Очередь модерации" value={overview.pending_count} subtitle={`Сабмитов за период ${overview.submitted_period}`} icon={Clock3} />
              <StatCard title="Одобрено" value={overview.approved_total} subtitle={`Отклонено ${overview.rejected_total}`} icon={CheckCircle2} />
              <StatCard title="Действия" value={overview.total_actions} subtitle={`Сегодня ${overview.actions_today} • Проекту ${overview.days_alive} дн`} icon={RefreshCw} />
              <StatCard title="Flash-уведомления" value={overview.flash_notified_users_30d} subtitle={`Новых flash за 30д ${overview.flash_new_30d}`} icon={Bell} />
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Дневная активность</CardTitle>
                  <CardDescription>Пользователи, действия и WebApp за последние {data?.period_days} дней</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[280px] w-full">
                    <LineChart data={data?.daily_chart}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="day" tickFormatter={formatDayLabel} minTickGap={24} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="users" stroke="var(--color-users)" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey="actions" stroke="var(--color-actions)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="webapp_users" stroke="var(--color-webapp_users)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Сабмиты по дням</CardTitle>
                  <CardDescription>Пользовательские отправки событий за последние {data?.period_days} дней</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[280px] w-full">
                    <BarChart data={data?.daily_chart}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="day" tickFormatter={formatDayLabel} minTickGap={24} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="submissions" fill="var(--color-submissions)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Месячная динамика</CardTitle>
                  <CardDescription>Пользователи и действия по месяцам</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[260px] w-full">
                    <AreaChart data={data?.monthly_chart}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="month" tickFormatter={formatMonthLabel} minTickGap={20} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="users" stroke="var(--color-users)" fill="var(--color-users)" fillOpacity={0.18} />
                      <Area type="monotone" dataKey="actions" stroke="var(--color-actions)" fill="var(--color-actions)" fillOpacity={0.12} />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Воронка действий за 30 дней</CardTitle>
                  <CardDescription>Быстрый срез по ключевым сценариям</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    ['start', 'start'],
                    ['webapp_ping', 'webapp_ping'],
                    ['filter_category', 'filter_category'],
                    ['open_category', 'open_category'],
                    ['subscribe', 'subscribe'],
                    ['web_flash_subscribe', 'web_flash_subscribe'],
                    ['submit_event_sent', 'submit_event_sent'],
                    ['web_submit_event', 'web_submit_event'],
                  ].map(([key, label]) => (
                    <div key={key} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-[11px] font-body text-muted-foreground">{label}</div>
                      <div className="mt-1 text-xl font-display font-bold">{data?.funnel[key] ?? 0}</div>
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
