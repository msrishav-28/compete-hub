import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrophyIcon, FlagIcon, AcademicCapIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { fetchCompetitions, fetchUpcomingWeek, fetchStats, fetchUserAnalytics } from '../api/competitions';
import { useCompetitionStore } from '../store/useCompetitionStore';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import { getDaysUntil } from '../utils';

export default function DashboardPage() {
  const { data: competitions } = useQuery(['competitions'], () => fetchCompetitions());
  const { data: upcomingWeek } = useQuery(['upcoming-week'], fetchUpcomingWeek);
  const { data: stats } = useQuery(['stats'], fetchStats);
  const { data: analytics } = useQuery(['analytics'], () => fetchUserAnalytics());
  const { savedCompetitions } = useCompetitionStore();

  const saved = competitions?.filter(c => savedCompetitions.includes(c.id)) || [];
  const upcoming = upcomingWeek || [];

  // Analytics data from backend
  const categoryChartData = stats?.by_category ?
    Object.entries(stats.by_category).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value,
    })) : [];

  const difficultyChartData = stats?.by_difficulty ?
    Object.entries(stats.by_difficulty).map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count,
    })) : [];

  const COLORS = ['#a3e635', '#ffffff', '#525252', '#262626', '#171717'];

  const statCards = [
    {
      title: 'Total Competitions',
      value: stats?.total_competitions || 0,
      icon: TrophyIcon,
      color: 'text-brand-lime',
      borderColor: 'border-brand-lime/20',
    },
    {
      title: 'Saved',
      value: saved.length,
      icon: FlagIcon,
      color: 'text-white',
      borderColor: 'border-white/20',
    },
    {
      title: 'This Week',
      value: upcoming.length,
      icon: CalendarIcon,
      color: 'text-gray-400',
      borderColor: 'border-gray-700',
    },
    {
      title: 'Win Rate',
      value: analytics ? `${analytics.win_rate.toFixed(1)}%` : '0%',
      icon: AcademicCapIcon,
      color: 'text-brand-lime',
      borderColor: 'border-brand-lime/20',
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-20 bg-black text-white relative overflow-hidden">
      {/* Ambient Gradient */}
      <div className="absolute top-0 right-0 h-[500px] w-[500px] bg-brand-lime/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase font-display tracking-tight">
            Your <span className="text-brand-lime">Dashboard</span>
          </h1>
          <p className="text-gray-400 text-lg">Real-time metrics on your competitive performance.</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card glass className={`border-white/5 bg-white/5 hover:bg-white/10 transition-colors`}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400 mb-1 font-semibold">{stat.title}</p>
                      <p className="text-3xl font-bold text-white font-display">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl bg-white/5 border border-white/5`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Category Distribution */}
          <Card glass className="bg-white/5 border-white/5">
            <CardHeader>
              <h2 className="text-lg font-bold text-white font-display uppercase tracking-wide">Category Split</h2>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryChartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', padding: '8px 12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    cursor={false}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Difficulty Distribution */}
          <Card glass className="bg-white/5 border-white/5">
            <CardHeader>
              <h2 className="text-lg font-bold text-white font-display uppercase tracking-wide">Difficulty Curve</h2>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={difficultyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} strokeOpacity={0.2} />
                  <XAxis
                    dataKey="name"
                    stroke="#666"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#666"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', padding: '8px 12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#a1a1aa', fontSize: '10px', marginBottom: '4px' }}
                  />
                  <Bar dataKey="count" fill="#a3e635" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming This Week */}
        <Card glass className="bg-white/5 border-white/5">
          <CardHeader className="border-b border-white/5 pb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white font-display uppercase tracking-wide">Upcoming This Week</h2>
              <Badge variant="info" className="bg-brand-lime/10 text-brand-lime border-brand-lime/20">{upcoming.length} events</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {upcoming.length > 0 ? (
              <div className="space-y-4">
                {upcoming.slice(0, 5).map((comp) => (
                  <Link key={comp.id} to={`/competitions/${comp.id}`}>
                    <motion.div
                      whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.08)' }}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 transition-all"
                    >
                      <div className="flex-1">
                        <h3 className="font-bold text-white mb-1">{comp.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          <span className="text-brand-lime">{comp.platform}</span>
                          <span className="text-gray-600">•</span>
                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            {getDaysUntil(comp.startDate)} days to start
                          </span>
                        </div>
                      </div>
                      <Badge variant={comp.difficulty === 'beginner' ? 'success' : comp.difficulty === 'intermediate' ? 'info' : 'warning'}>
                        {comp.difficulty}
                      </Badge>
                    </motion.div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No competitions starting soon.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saved Competitions */}
        {saved.length > 0 && (
          <Card glass className="mt-8 bg-white/5 border-white/5">
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white font-display uppercase tracking-wide">Saved Competitions</h2>
                <Link to="/saved">
                  <div className="text-sm font-bold text-brand-lime hover:text-white transition-colors cursor-pointer">View All →</div>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {saved.slice(0, 3).map((comp) => (
                  <Link key={comp.id} to={`/competitions/${comp.id}`}>
                    <motion.div
                      whileHover={{ y: -4 }}
                      className="p-5 rounded-xl bg-black/40 border border-white/10 hover:border-brand-lime/30 transition-all group"
                    >
                      <h3 className="font-bold text-white mb-2 line-clamp-1 group-hover:text-brand-lime transition-colors">{comp.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <TrophyIcon className="h-4 w-4" />
                        <span>{comp.platform}</span>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
