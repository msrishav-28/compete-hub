import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrophyIcon, FlagIcon, AcademicCapIcon, CalendarIcon, FireIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { fetchCompetitions, fetchUpcomingWeek, fetchStats, fetchUserAnalytics } from '../api/competitions';
import { useCompetitionStore } from '../store/useCompetitionStore';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import TextScramble from '../components/ui/TextScramble';
import ResumeExport from '../components/ResumeExport';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import { getDaysUntil } from '../utils';

// Variants for Staggered Animation
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function DashboardPage() {
  const { data: competitions } = useQuery(['competitions'], () => fetchCompetitions());
  const { data: upcomingWeek } = useQuery(['upcoming-week'], fetchUpcomingWeek);
  const { data: stats } = useQuery(['stats'], fetchStats);
  const { data: analytics } = useQuery(['analytics'], () => fetchUserAnalytics());
  const { savedCompetitions } = useCompetitionStore();

  const saved = competitions?.filter(c => savedCompetitions.includes(c.id)) || [];
  const upcoming = upcomingWeek || [];

  // Panic Room Logic: Saved items ending < 48h (placeholder logic: assuming < 7 days is panic for now or check data)
  const panicItems = saved.filter(c => getDaysUntil(c.startDate) < 5); // Example threshold

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

  return (
    <div className="min-h-screen pt-24 pb-20 bg-black text-white relative overflow-hidden">
      {/* Ambient Gradient */}
      <div className="absolute top-0 right-0 h-[500px] w-[500px] bg-brand-lime/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-black uppercase font-display tracking-tight text-white mb-1">
            <TextScramble text="COMMAND" className="text-white" duration={600} />
            <span className="text-neon-limit ml-3 drop-shadow-[0_0_10px_rgba(163,230,53,0.5)]">
              <TextScramble text="CENTER" className="text-neon-limit" duration={600} delay={150} />
            </span>
          </h1>
          <p className="text-gray-500 font-mono text-sm tracking-widest uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neon-limit animate-pulse" />
            System Status: Online
          </p>
        </motion.div>

        {/* BENTO GRID LAYOUT */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-min"
        >

          {/* BLOCK 1: LIVE STATUS (STREAK) - Large */}
          <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-2 row-span-1">
            <Card glass className="h-full bg-white/5 border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                <FireIcon className="h-32 w-32 text-neon-limit" />
              </div>
              <CardContent className="flex flex-col justify-between h-full p-8">
                <div>
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Active Streak</h2>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black text-white font-display">4</span>
                    <span className="text-xl text-brand-lime font-bold">DAYS</span>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-gray-400 max-w-sm">
                    You are synced. Log in tomorrow to maintain your <span className="text-white font-bold">Combat Rhythm</span>.
                  </p>
                </div>
                {/* Progress Bar Visual */}
                <div className="w-full h-1 bg-white/10 mt-6 rounded-full overflow-hidden">
                  <div className="h-full bg-neon-limit w-[60%] shadow-[0_0_10px_rgba(163,230,53,0.8)]" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* BLOCK 2: PANIC ROOM - Warning State */}
          <motion.div variants={itemVariants} className="md:col-span-1 lg:col-span-1 row-span-1">
            <Card glass className="h-full bg-gradient-to-br from-signal-red/10 to-transparent border-signal-red/20 relative overflow-hidden hover:border-signal-red/50 transition-colors">
              <div className="absolute inset-0 opacity-20 bg-grid-pattern bg-grid-size" />
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-signal-red uppercase tracking-widest flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    Panic Room
                  </h2>
                  <div className="h-2 w-2 rounded-full bg-signal-red animate-pulse" />
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                  {panicItems.length > 0 ? panicItems.slice(0, 3).map(item => (
                    <Link key={item.id} to={`/competitions/${item.id}`}>
                      <div className="p-3 rounded bg-black/40 border border-signal-red/20 hover:border-signal-red/60 transition-colors cursor-pointer group">
                        <div className="text-xs text-signal-red font-bold mb-1 group-hover:text-white transition-colors">{getDaysUntil(item.startDate)} days left</div>
                        <div className="text-sm font-medium text-white line-clamp-1">{item.title}</div>
                      </div>
                    </Link>
                  )) : (
                    <div className="text-gray-500 text-xs italic text-center mt-8">No critical deadlines. Good hunting.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* BLOCK 3: QUICK STATS - Compact */}
          <motion.div variants={itemVariants} className="md:col-span-1 lg:col-span-1 row-span-1 space-y-6">
            {/* Total Competitions */}
            <Card glass className="bg-white/5 border-white/5 p-4 flex items-center justify-between hover:bg-white/10 transition-colors cursor-default">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Total</p>
                <p className="text-2xl font-black text-white">{stats?.total_competitions || 0}</p>
              </div>
              <TrophyIcon className="h-8 w-8 text-white/20" />
            </Card>
            {/* Saved */}
            <Card glass className="bg-white/5 border-white/5 p-4 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer">
              <Link to="/saved" className="w-full flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Saved</p>
                  <p className="text-2xl font-black text-neon-limit">{saved.length}</p>
                </div>
                <FlagIcon className="h-8 w-8 text-neon-limit/20" />
              </Link>
            </Card>
            {/* Win Rate */}
            <Card glass className="bg-white/5 border-white/5 p-4 flex items-center justify-between hover:bg-white/10 transition-colors cursor-default">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Win Rate</p>
                <p className="text-2xl font-black text-white">{analytics?.win_rate.toFixed(0)}%</p>
              </div>
              <AcademicCapIcon className="h-8 w-8 text-white/20" />
            </Card>
          </motion.div>

          {/* BLOCK 4: UPCOMING EVENTS (List) - Tall */}
          <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-2 md:row-span-2">
            <Card glass className="h-full bg-white/5 border-white/5">
              <CardHeader className="border-b border-white/5 py-4 px-6 flex justify-between items-center">
                <h2 className="font-bold text-white font-display uppercase tracking-wider">Mission Board (This Week)</h2>
                <Badge variant="lime">{upcoming.length} Active</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                  {upcoming.length > 0 ? upcoming.slice(0, 5).map((comp) => (
                    <Link key={comp.id} to={`/competitions/${comp.id}`}>
                      <div className="p-4 hover:bg-white/5 transition-colors group flex items-center gap-4 cursor-pointer">
                        <div className="h-12 w-12 rounded bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-neon-limit group-hover:scale-110 transition-all">
                          <CalendarIcon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-white text-sm group-hover:text-neon-limit transition-colors">{comp.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <span>{comp.platform}</span>
                            <span>•</span>
                            <span className={getDaysUntil(comp.startDate) < 3 ? 'text-signal-amber' : 'text-gray-500'}>
                              Starts in {getDaysUntil(comp.startDate)} days
                            </span>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Badge variant="default" className="text-xs">VIEW</Badge>
                        </div>
                      </div>
                    </Link>
                  )) : (
                    <div className="p-8 text-center text-gray-500 italic">No missions scheduled.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* BLOCK 5: ANALYTICS (Charts) - Wide */}
          <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-2 md:row-span-2">
            <Card glass className="h-full bg-white/5 border-white/5 flex flex-col">
              {/* Tabs for charts could go here, for now stacked */}
              <div className="flex-1 p-6 border-b border-white/5">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Skill Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={difficultyChartData}>
                    <XAxis dataKey="name" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#050505', borderColor: '#333', borderRadius: '4px' }}
                      itemStyle={{ color: '#fff' }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar dataKey="count" fill="#a3e635" radius={[2, 2, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 p-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Category Intel</h3>
                <div className="flex items-center h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {categoryChartData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#050505', borderColor: '#333' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend */}
                  <div className="flex-1 pl-4 space-y-2 overflow-y-auto max-h-[150px] custom-scrollbar">
                    {categoryChartData.map((entry, i) => (
                      <div key={i} className="flex items-center text-xs text-gray-400">
                        <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="truncate">{entry.name}</span>
                        <span className="ml-auto font-bold text-white">{String(entry.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* BLOCK 6: RESUME EXPORT / CAREER INVENTORY */}
          <motion.div variants={itemVariants} className="md:col-span-1 lg:col-span-2">
            <Card glass className="h-full bg-white/5 border-white/5">
              <CardContent className="p-6">
                <ResumeExport />
              </CardContent>
            </Card>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
