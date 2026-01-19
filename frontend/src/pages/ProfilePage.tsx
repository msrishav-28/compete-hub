import { motion } from 'framer-motion';
import { AcademicCapIcon, FlagIcon, Cog6ToothIcon, ArrowTrendingUpIcon, ArrowTopRightOnSquareIcon, ShareIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import TextScramble from '../components/ui/TextScramble';
import MagneticButton from '../components/ui/MagneticButton';
import ResumeExport from '../components/ResumeExport';
import { useCompetitionStore } from '../store/useCompetitionStore';
import { useQuery } from '@tanstack/react-query';
import { fetchCompetitions, fetchUserAnalytics, fetchRecommendations, Recommendation } from '../api/competitions';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { savedCompetitions } = useCompetitionStore();
  const { data: competitions } = useQuery(['competitions'], () => fetchCompetitions());
  const { data: analytics } = useQuery(['user-analytics'], () => fetchUserAnalytics());
  const { data: recommendations } = useQuery(['recommendations'], () => fetchRecommendations());

  const saved = competitions?.filter(c => savedCompetitions.includes(c.id)) || [];

  // Use analytics from server if available, fallback...
  const stats = analytics || {
    competitions_entered: 0,
    competitions_won: 0,
    win_rate: 0,
    skill_levels: {},
    specializations: [],
    portfolio_value: 0
  };

  const categoriesInterested = analytics?.specializations.length ? analytics.specializations : Array.from(new Set(saved.map(c => c.category)));
  const platformsUsed = Array.from(new Set(saved.map(c => c.platform)));

  return (
    <div className="min-h-screen pt-24 pb-20 relative overflow-hidden">
      {/* Ambient Gradient */}
      <div className="absolute top-20 left-0 h-[300px] w-[300px] bg-white/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header Actions */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-6"
        >
          <h1 className="text-3xl md:text-4xl font-black uppercase font-display tracking-tight">
            <TextScramble text="PILOT" className="text-white" duration={500} />
            <span className="text-neon-limit ml-2">
              <TextScramble text="PROFILE" className="text-neon-limit" duration={500} delay={100} />
            </span>
          </h1>
          <div className="flex gap-2">
            <MagneticButton variant="secondary" size="sm" className="rounded-lg">
              <ShareIcon className="h-4 w-4 mr-1" />
              Share
            </MagneticButton>
            <MagneticButton variant="ghost" size="sm" className="rounded-lg">
              <Cog6ToothIcon className="h-4 w-4" />
            </MagneticButton>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN: IDENTITY CARD (Sticky) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-4 lg:sticky lg:top-24 h-fit"
          >
            <Card glass className="bg-white/5 border-white/5 overflow-hidden relative">
              {/* Holographic header effect */}
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-neon-limit/20 to-transparent opacity-50" />

              <CardContent className="text-center pt-12 pb-8 relative z-10">
                <div className="w-32 h-32 mx-auto mb-6 rounded-full p-1 border-2 border-neon-limit shadow-[0_0_20px_rgba(163,230,53,0.3)] bg-black">
                  <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                    <AcademicCapIcon className="h-16 w-16 text-white" />
                  </div>
                </div>

                <h2 className="text-3xl font-black text-white mb-1 font-display tracking-tight uppercase">
                  Competitor
                </h2>
                <div className="flex justify-center gap-2 mb-8">
                  <Badge variant="lime" className="text-[10px] uppercase tracking-widest px-2">Level 12</Badge>
                  <Badge variant="default" className="text-[10px] uppercase tracking-widest px-2">Engineering</Badge>
                </div>

                {/* Key Stats Row */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  <div className="p-3 bg-black/40 rounded border border-white/5">
                    <div className="text-xs text-gray-500 uppercase font-bold">Win Rate</div>
                    <div className="text-xl font-bold text-white">{stats.win_rate?.toFixed(0) || 0}%</div>
                  </div>
                  <div className="p-3 bg-black/40 rounded border border-white/5">
                    <div className="text-xs text-gray-500 uppercase font-bold">Saved</div>
                    <div className="text-xl font-bold text-white">{saved.length}</div>
                  </div>
                </div>

                {/* XP Progress */}
                <div className="text-left mb-2">
                  <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
                    <span>XP PROGRESS</span>
                    <span>1,200 / 2,000</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-neon-limit w-[60%]" />
                  </div>
                </div>

              </CardContent>
            </Card>
          </motion.div>

          {/* RIGHT COLUMN: DETAILS & LOGS */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-8 space-y-6"
          >

            {/* INVENTORY / TECH STACK */}
            <Card glass className="bg-white/5 border-white/5">
              <CardHeader className="border-b border-white/5 py-4">
                <h3 className="text-sm font-bold text-white font-display uppercase tracking-widest flex items-center gap-2">
                  <FlagIcon className="h-4 w-4 text-neon-limit" />
                  Interest Inventory
                </h3>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <p className="text-xs text-gray-500 font-bold mb-3 uppercase">Class Specializations</p>
                    <div className="flex flex-wrap gap-2">
                      {categoriesInterested.length > 0 ? (
                        categoriesInterested.map((cat) => (
                          <Badge key={cat} variant="default" className="bg-white/5 border-white/10 hover:border-neon-limit/50 transition-colors py-1.5 px-3 uppercase tracking-wider text-xs">
                            {cat.replace('_', ' ')}
                          </Badge>
                        ))
                      ) : <span className="text-gray-600 text-sm italic">None equipped.</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold mb-3 uppercase">Active Platforms</p>
                    <div className="flex flex-wrap gap-2">
                      {platformsUsed.length > 0 ? (
                        platformsUsed.map((platform) => (
                          <Badge key={platform} variant="purple" className="py-1.5 px-3 uppercase tracking-wider text-xs">
                            {platform}
                          </Badge>
                        ))
                      ) : <span className="text-gray-600 text-sm italic">None detected.</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RECOMMENDED QUESTS */}
            <Card glass className="bg-white/5 border-white/5">
              <CardHeader className="border-b border-white/5 py-4 flex justify-between items-center">
                <h3 className="text-sm font-bold text-white font-display uppercase tracking-widest flex items-center gap-2">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-neon-limit" />
                  Recommended Missions
                </h3>
                <Button variant="ghost" size="sm" className="text-xs">Refine Algorithm</Button>
              </CardHeader>
              <CardContent className="p-0">
                {recommendations && recommendations.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {recommendations.slice(0, 3).map((rec: Recommendation) => (
                      <Link key={rec.competition.id} to={`/competitions/${rec.competition.id}`}>
                        <motion.div 
                          whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
                          className="p-4 flex items-center justify-between transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded bg-neon-limit/10 flex items-center justify-center text-neon-limit text-xs font-bold">
                              {rec.match_score}%
                            </div>
                            <div>
                              <h4 className="font-bold text-white group-hover:text-neon-limit transition-colors">{rec.competition.title}</h4>
                              <span className="text-xs text-gray-500">{rec.competition.platform}</span>
                            </div>
                          </div>
                          <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center gap-3">
                    <SparklesIcon className="w-8 h-8 opacity-30" />
                    <p>Save competitions to unlock personalized recommendations.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CAREER INTEL EXPORT */}
            <Card glass className="bg-white/5 border-white/5">
              <CardContent className="p-6">
                <ResumeExport />
              </CardContent>
            </Card>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
