import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { fetchCompetitions } from '../api/competitions';
import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Link } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

export default function CalendarPage() {
  const { data: competitions } = useQuery(['competitions'], () => fetchCompetitions());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group competitions by date
  const competitionsByDate = useMemo(() => {
    if (!competitions) return {};
    
    return competitions.reduce((acc, comp) => {
      const date = format(new Date(comp.startDate), 'yyyy-MM-dd');
      if (!acc[date]) acc[date] = [];
      acc[date].push(comp);
      return acc;
    }, {} as Record<string, typeof competitions>);
  }, [competitions]);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const selectedComps = selectedDate 
    ? competitionsByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Calendar</h1>
          <p className="text-gray-600 dark:text-gray-400">View competitions by date</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card>
              {/* Month Navigator */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {format(currentMonth, 'MMMM yyyy')}
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentMonth(new Date())}
                    >
                      Today
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Calendar Grid */}
              <CardContent className="p-4">
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {daysInMonth.map((day) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const hasComps = competitionsByDate[dateKey]?.length > 0;
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, new Date());

                    return (
                      <motion.button
                        key={day.toString()}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedDate(day)}
                        className={`
                          aspect-square p-2 rounded-lg text-sm font-medium transition-all
                          ${!isSameMonth(day, currentMonth) ? 'text-gray-300 dark:text-gray-600' : ''}
                          ${isToday ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''}
                          ${isSelected ? 'ring-2 ring-blue-500' : ''}
                          ${hasComps && !isToday ? 'bg-purple-50 dark:bg-purple-900/20' : ''}
                          ${!hasComps && !isToday && !isSelected ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : ''}
                        `}
                      >
                        <div>{format(day, 'd')}</div>
                        {hasComps && (
                          <div className="flex justify-center gap-0.5 mt-1">
                            {competitionsByDate[dateKey].slice(0, 3).map((_, i) => (
                              <div
                                key={i}
                                className="h-1 w-1 rounded-full bg-purple-600"
                              />
                            ))}
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Date Details */}
          <div>
            <Card>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <CalendarIcon className="h-5 w-5" />
                  <h3 className="font-bold">
                    {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
                  </h3>
                </div>
              </div>
              <CardContent className="p-4">
                {selectedComps.length > 0 ? (
                  <div className="space-y-3">
                    {selectedComps.map((comp) => (
                      <Link key={comp.id} to={`/competitions/${comp.id}`}>
                        <motion.div
                          whileHover={{ x: 4 }}
                          className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                            {comp.title}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span>{comp.platform}</span>
                            <Badge variant="info" size="sm">
                              {comp.difficulty}
                            </Badge>
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                ) : selectedDate ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No competitions on this date</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">Select a date to view competitions</p>
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
