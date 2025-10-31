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

  const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

  const statCards = [
    {
      title: 'Total Competitions',
      value: stats?.total_competitions || 0,
      icon: TrophyIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      title: 'Saved',
      value: saved.length,
      icon: FlagIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
    {
      title: 'This Week',
      value: upcoming.length,
      icon: CalendarIcon,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100 dark:bg-pink-900',
    },
    {
      title: 'Win Rate',
      value: analytics ? `${analytics.win_rate.toFixed(1)}%` : '0%',
      icon: AcademicCapIcon,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your competition journey</p>
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
                <Card hover>
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                    </div>
                    <div className={`p-4 rounded-full ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Category Distribution</h2>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryChartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Difficulty Distribution */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Difficulty Levels</h2>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={difficultyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming This Week */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Upcoming This Week</h2>
              <Badge variant="info">{upcoming.length} competitions</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {upcoming.length > 0 ? (
              <div className="space-y-4">
                {upcoming.slice(0, 5).map((comp) => (
                  <Link key={comp.id} to={`/competitions/${comp.id}`}>
                    <motion.div
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{comp.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <span>{comp.platform}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            {getDaysUntil(comp.startDate)} days
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
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No competitions starting this week</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saved Competitions */}
        {saved.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Your Saved Competitions</h2>
                <Link to="/saved">
                  <Badge variant="purple" className="cursor-pointer">View All</Badge>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {saved.slice(0, 3).map((comp) => (
                  <Link key={comp.id} to={`/competitions/${comp.id}`}>
                    <motion.div
                      whileHover={{ y: -4 }}
                      className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">{comp.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
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
