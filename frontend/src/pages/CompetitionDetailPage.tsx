import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchCompetition } from '../api/competitions';
import { CalendarIcon, UserGroupIcon, ClockIcon, TagIcon, ArrowTopRightOnSquareIcon, ShareIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import TextScramble from '../components/ui/TextScramble';
import MagneticButton from '../components/ui/MagneticButton';
import RecruitSquadButton from '../components/RecruitSquadButton';
import { motion } from 'framer-motion';
import { getDaysUntil } from '../utils';

export default function CompetitionDetailPage() {
  const { id } = useParams();
  const { data: competition, isLoading, error } = useQuery(
    ['competition', id],
    () => fetchCompetition(id!)
  );

  if (isLoading) return (
    <div className="flex justify-center items-center h-screen bg-black">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-lime"></div>
    </div>
  );

  if (error || !competition) return (
    <div className="flex justify-center items-center h-screen bg-black text-red-500">
      <div className="text-center">
        <p className="text-xl font-bold mb-2">Error loading competition</p>
        <Button variant="outline" onClick={() => window.history.back()}>Go Back</Button>
      </div>
    </div>
  );

  const daysLeft = getDaysUntil(competition.startDate);
  const isUrgent = daysLeft < 3;
  const isCritical = daysLeft < 1;

  return (
    <div className="min-h-screen pt-24 pb-20 bg-black text-white relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-brand-lime/10 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-neon-limit/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content (Left) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="purple" className="bg-purple-500/10 text-purple-400 border-purple-500/20">{competition.platform}</Badge>
                <Badge variant="info" className="bg-blue-500/10 text-blue-400 border-blue-500/20">{competition.category.replace('_', ' ')}</Badge>
                {competition.recruitmentPotential && (
                  <Badge variant="lime" className="flex items-center gap-1">
                    <CheckBadgeIcon className="w-3 h-3" />
                    Hiring Partner
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-5xl font-black mb-6 font-display uppercase tracking-tight leading-tight">
                <TextScramble text={competition.title} duration={800} />
              </h1>
              <div className="flex flex-wrap gap-4 text-gray-400 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-brand-lime" />
                  <span className={isCritical ? 'text-signal-red font-bold' : isUrgent ? 'text-signal-amber font-bold' : ''}>
                    {daysLeft < 0 ? 'Ended' : daysLeft === 0 ? 'Ends Today' : `${daysLeft} days left`}
                  </span>
                </div>
                {competition.teamSize && (
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="h-5 w-5 text-brand-lime" />
                    <span>Team: {competition.teamSize}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-brand-lime" />
                  <span className="capitalize">{competition.timeCommitment} commitment</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 backdrop-blur-sm" style={{
              clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)',
            }}>
              <div className="absolute top-0 right-0 w-5 h-5 bg-neon-black" 
                style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} 
              />
              <h3 className="text-sm font-bold text-gray-500 mb-4 font-display uppercase tracking-widest">About the Challenge</h3>
              <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed">
                <p>{competition.description}</p>
              </div>
            </div>

            {/* Tags */}
            {competition.tags && competition.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <TagIcon className="h-4 w-4" /> Tech Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {competition.tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1.5 bg-white/5 border border-white/10 text-gray-300 text-sm hover:border-brand-lime/30 transition-colors font-mono">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Sidebar (Right) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Action Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md sticky top-24" style={{
              clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
            }}>
              <div className="mb-6">
                <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">Prize Pool</span>
                <div className="text-3xl font-black text-brand-lime mt-1 font-display">
                  {competition.prize ? `${competition.prize.value} ${competition.prize.currency}` : 'Not Disclosed'}
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href={competition.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                  onClick={() => {
                    import('../api/competitions').then(({ enterCompetition }) => {
                      enterCompetition(competition.id).catch(console.error);
                    });
                  }}
                >
                  <MagneticButton variant="primary" className="w-full py-4">
                    Visit Official Page
                    <ArrowTopRightOnSquareIcon className="ml-2 h-5 w-5" />
                  </MagneticButton>
                </a>
                
                <RecruitSquadButton
                  competitionId={competition.id}
                  competitionTitle={competition.title}
                  prize={competition.prize}
                  size="lg"
                  className="w-full"
                />
                
                <Button 
                  variant="ghost" 
                  className="w-full text-gray-400"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                  }}
                >
                  <ShareIcon className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Difficulty</span>
                  <span className={`font-bold capitalize ${competition.difficulty === 'beginner' ? 'text-green-400' :
                    competition.difficulty === 'intermediate' ? 'text-blue-400' :
                      competition.difficulty === 'advanced' ? 'text-yellow-400' :
                        'text-red-400'
                    }`}>{competition.difficulty}</span>
                </div>
                {competition.endDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Deadline</span>
                    <span className="text-gray-300">{new Date(competition.endDate).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Start Date</span>
                  <span className="text-gray-300">{new Date(competition.startDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
