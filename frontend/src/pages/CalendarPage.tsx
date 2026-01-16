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
    <div className="min-h-screen pt-24 pb-20 bg-black text-white relative overflow-hidden">
      {/* Ambient Gradient */}
      <div className="absolute bottom-0 right-0 h-[500px] w-[500px] bg-brand-lime/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase font-display tracking-tight">
            Competition <span className="text-brand-lime">Calendar</span>
          </h1>
          <p className="text-gray-400 text-lg">Plan your schedule around upcoming events.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card glass className="bg-white/5 border-white/5 h-full">
              {/* Month Navigator */}
              <div className="p-8 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white font-display uppercase tracking-wide">
                    {format(currentMonth, 'MMMM yyyy')}
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                      className="border-white/10 hover:bg-white/5 text-white"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMonth(new Date())}
                      className="border-white/10 hover:bg-white/5 text-white"
                    >
                      Today
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      className="border-white/10 hover:bg-white/5 text-white"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Calendar Grid */}
              <CardContent className="p-8">
                <div className="grid grid-cols-7 gap-4 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-bold text-gray-500 uppercase tracking-widest"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-4">
                  {daysInMonth.map((day) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const hasComps = competitionsByDate[dateKey]?.length > 0;
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, new Date());

                    return (
                      <motion.button
                        key={day.toString()}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedDate(day)}
                        className={`
                          aspect-square relative rounded-xl text-sm font-medium transition-all flex items-center justify-center
                          ${!isSameMonth(day, currentMonth) ? 'text-gray-700 opacity-50' : 'text-gray-300'}
                          ${isToday ? 'bg-brand-lime text-black font-bold shadow-[0_0_20px_rgba(163,230,53,0.3)]' : ''}
                          ${isSelected && !isToday ? 'bg-white/20 text-white ring-2 ring-white/30' : ''}
                          ${!hasComps && !isToday && !isSelected ? 'hover:bg-white/5' : ''}
                          ${hasComps && !isToday && !isSelected ? 'bg-white/10 hover:bg-white/20' : ''}
                        `}
                      >
                        <div>{format(day, 'd')}</div>
                        {hasComps && (
                          <div className="absolute bottom-2 flex justify-center gap-1">
                            {competitionsByDate[dateKey].slice(0, 3).map((_, i) => (
                              <div
                                key={i}
                                className={`h-1 w-1 rounded-full ${isToday ? 'bg-black' : 'bg-brand-lime'}`}
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
            <Card glass className="bg-white/5 border-white/5 h-full">
              <div className="p-6 border-b border-white/5">
                <div className="flex items-center gap-3 text-white">
                  <CalendarIcon className="h-6 w-6 text-brand-lime" />
                  <h3 className="font-bold text-lg font-display uppercase tracking-wide">
                    {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Events List'}
                  </h3>
                </div>
              </div>
              <CardContent className="p-6">
                {selectedComps.length > 0 ? (
                  <div className="space-y-4">
                    {selectedComps.map((comp) => (
                      <Link key={comp.id} to={`/competitions/${comp.id}`}>
                        <motion.div
                          whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.08)' }}
                          className="p-4 rounded-xl bg-black/40 border border-white/10 transition-all cursor-pointer group"
                        >
                          <h4 className="font-bold text-white mb-2 line-clamp-2 group-hover:text-brand-lime transition-colors">
                            {comp.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <Badge variant="purple" size="sm" className="bg-white/5 border-white/10 text-gray-400">
                              {comp.platform}
                            </Badge>
                            <Badge variant={comp.difficulty === 'beginner' ? 'success' : comp.difficulty === 'intermediate' ? 'info' : 'warning'} size="sm">
                              {comp.difficulty}
                            </Badge>
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                ) : selectedDate ? (
                  <div className="text-center py-16 text-gray-500">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm">No competitions scheduled for this date.</p>
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-500">
                    <p className="text-sm">Select a date from the calendar to view details.</p>
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
