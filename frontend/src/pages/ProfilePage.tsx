import { motion } from 'framer-motion';
import { TrophyIcon, AcademicCapIcon, FlagIcon, Cog6ToothIcon, ArrowTrendingUpIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useCompetitionStore } from '../store/useCompetitionStore';
import { useQuery } from '@tanstack/react-query';
import { fetchCompetitions, fetchUserAnalytics, fetchRecommendations, Recommendation } from '../api/competitions';

export default function ProfilePage() {
  const { savedCompetitions } = useCompetitionStore();
  const { data: competitions } = useQuery(['competitions'], () => fetchCompetitions());
  const { data: analytics } = useQuery(['user-analytics'], () => fetchUserAnalytics());
  const { data: recommendations } = useQuery(['recommendations'], () => fetchRecommendations());

  const saved = competitions?.filter(c => savedCompetitions.includes(c.id)) || [];

  // Use analytics from server if available, fallback to local calculation for display
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
    <div className="min-h-screen pt-24 pb-20 bg-black text-white relative overflow-hidden">
      {/* Ambient Gradient */}
      <div className="absolute top-0 right-0 h-[500px] w-[500px] bg-brand-lime/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-black mb-2 uppercase font-display tracking-tight">
              <span className="text-white">Profile</span>
            </h1>
            <p className="text-gray-400 text-lg">Manage your identity and preferences.</p>
          </div>
          <Button variant="outline" className="border-white/10 hover:bg-white/5 text-white">
            <Cog6ToothIcon className="h-5 w-5 mr-2" />
            Settings
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card glass className="bg-white/5 border-white/5 h-full">
              <CardContent className="text-center pt-12 pb-8">
                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-brand-lime/80 to-green-500/80 p-0.5 shadow-2xl shadow-brand-lime/20">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center border-4 border-black">
                    <AcademicCapIcon className="h-14 w-14 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-1 font-display tracking-wide">
                  Competitor
                </h2>
                <p className="text-brand-lime font-medium mb-8 uppercase tracking-widest text-xs">
                  Engineering Student
                </p>

                <div className="space-y-4 text-left">
                  <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <TrophyIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-300 font-medium">Saved</span>
                    </div>
                    <span className="font-bold text-white text-lg">{saved.length}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <FlagIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-300 font-medium">Categories</span>
                    </div>
                    <span className="font-bold text-white text-lg">{stats.specializations?.length || 0}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-300 font-medium">Win Rate</span>
                    </div>
                    <span className="font-bold text-white text-lg">{stats.win_rate?.toFixed(0) || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Interests */}
            <Card glass className="bg-white/5 border-white/5">
              <CardHeader className="border-b border-white/5 pb-6">
                <h3 className="text-lg font-bold text-white font-display uppercase tracking-wide">Your Interests</h3>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="space-y-8">
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                      Categories
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {categoriesInterested.length > 0 ? (
                        categoriesInterested.map((cat) => (
                          <Badge key={cat} variant="info" className="bg-blue-500/10 text-blue-400 border-blue-500/20 py-2 px-3">
                            {cat.replace('_', ' ')}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          Start saving competitions to see your interests
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                      Platforms
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {platformsUsed.length > 0 ? (
                        platformsUsed.map((platform) => (
                          <Badge key={platform} variant="purple" className="bg-purple-500/10 text-purple-400 border-purple-500/20 py-2 px-3">
                            {platform}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          No platforms tracked yet
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card glass className="bg-white/5 border-white/5">
              <CardHeader className="border-b border-white/5 pb-6">
                <h3 className="text-lg font-bold text-white font-display uppercase tracking-wide">Recent Activity</h3>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-4">
                    <ArrowTrendingUpIcon className="h-8 w-8 text-gray-600" />
                  </div>
                  <p className="text-white font-bold text-lg mb-1">No recent activity</p>
                  <p className="text-sm text-gray-500">Participate in competitions to build your history</p>
                </div>
              </CardContent>
            </Card>

            {/* Recommended for You */}
            <Card glass className="bg-white/5 border-white/5">
              <CardHeader className="border-b border-white/5 pb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white font-display uppercase tracking-wide">Recommended For You</h3>
                  <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 text-white text-xs">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recommendations && recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {recommendations.slice(0, 3).map((rec: Recommendation) => (
                      <div key={rec.competition.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-brand-lime/30 transition-all cursor-pointer group">
                        <div>
                          <h4 className="font-bold text-white group-hover:text-brand-lime transition-colors">{rec.competition.title}</h4>
                          <span className="text-xs text-gray-500">{rec.competition.platform} • {rec.match_score}% Match</span>
                        </div>
                        <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-400 group-hover:text-brand-lime" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-4">
                      <AcademicCapIcon className="h-8 w-8 text-gray-600" />
                    </div>
                    <p className="text-gray-400 text-sm max-w-xs mx-auto">Complete your profile to get personalized recommendations.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
