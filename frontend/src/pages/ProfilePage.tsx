import { motion } from 'framer-motion';
import { TrophyIcon, AcademicCapIcon, FlagIcon, Cog6ToothIcon, ArrowTrendingUpIcon, UserIcon } from '@heroicons/react/24/outline';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useCompetitionStore } from '../store/useCompetitionStore';
import { useQuery } from '@tanstack/react-query';
import { fetchCompetitions } from '../api/competitions';

export default function ProfilePage() {
  const { savedCompetitions } = useCompetitionStore();
  const { data: competitions } = useQuery(['competitions'], () => fetchCompetitions());

  const saved = competitions?.filter(c => savedCompetitions.includes(c.id)) || [];

  // Calculate stats
  const categoriesInterested = Array.from(new Set(saved.map(c => c.category)));
  const platformsUsed = Array.from(new Set(saved.map(c => c.platform)));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Profile</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage your competition journey</p>
            </div>
            <Button variant="outline">
              <Cog6ToothIcon className="h-5 w-5" />
              Settings
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="text-center pt-8">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <AcademicCapIcon className="h-12 w-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  Competitor
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Engineering Student
                </p>
                
                <div className="space-y-4 text-left">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrophyIcon className="h-6 w-6 text-blue-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Saved</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-gray-100">{saved.length}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FlagIcon className="h-6 w-6 text-pink-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Categories</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-gray-100">{categoriesInterested.length}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ArrowTrendingUpIcon className="h-5 w-5 text-pink-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Platforms</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-gray-100">{platformsUsed.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interests */}
            <Card>
              <CardHeader>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Your Interests</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Categories
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {categoriesInterested.length > 0 ? (
                        categoriesInterested.map((cat) => (
                          <Badge key={cat} variant="info">
                            {cat.replace('_', ' ')}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Start saving competitions to see your interests
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Platforms
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {platformsUsed.length > 0 ? (
                        platformsUsed.map((platform) => (
                          <Badge key={platform} variant="purple">
                            {platform}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No platforms tracked yet
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recent Activity</h3>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <ArrowTrendingUpIcon className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p>No recent activity</p>
                  <p className="text-sm mt-1">Start participating in competitions to see your activity</p>
                </div>
              </CardContent>
            </Card>

            {/* Connected Profiles */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Connected Profiles</h3>
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <UserIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Connect your Codeforces, LeetCode, GitHub, and other profiles</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
