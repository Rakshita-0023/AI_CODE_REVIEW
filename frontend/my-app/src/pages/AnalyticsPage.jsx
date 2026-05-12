import { useEffect, useState } from 'react';
import { ChartBarIcon, CodeBracketIcon, ClockIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { historyAPI, projectAPI } from '../services/api';
import { getLocalActivityMap } from '../utils/activityTracker';

const HEATMAP_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

const MINUTES_BY_ACTIVITY = {
  workspace_open: 3,
  chat: 4,
  review: 8,
  debug: 8,
  approaches: 8,
  optimize: 8,
  project: 6,
  scratchpad: 5,
  default: 5
};

const formatDayKey = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startOfDay = (dateLike) => {
  const date = new Date(dateLike);
  date.setHours(0, 0, 0, 0);
  return date;
};

const isSameDay = (left, right) => formatDayKey(left) === formatDayKey(right);

const formatMinutes = (minutes) => {
  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (hours === 0) return `${remainingMinutes}m`;
  return `${hours}h ${remainingMinutes}m`;
};

const createEmptyActivityDay = (date) => ({
  key: formatDayKey(date),
  date,
  count: 0,
  minutes: 0,
  workspaceOpened: false,
  analyses: 0,
  chats: 0,
  trackedActions: 0
});

const createEmptyActivityMapEntry = () => ({
  workspaceOpened: false,
  analyses: 0,
  chats: 0,
  trackedActions: 0,
  count: 0,
  minutes: 0
});

const ensureActivityEntry = (activityMap, key) => {
  if (!activityMap.has(key)) {
    activityMap.set(key, createEmptyActivityMapEntry());
  }

  return activityMap.get(key);
};

const mergeActivityEntry = (target, incoming) => {
  target.workspaceOpened = target.workspaceOpened || Boolean(incoming.workspaceOpened);
  target.analyses += incoming.analyses || 0;
  target.chats += incoming.chats || 0;
  target.trackedActions += incoming.trackedActions || 0;
  target.count = Math.max(target.count, 0) + (incoming.count || 0);
  target.minutes = Math.max(target.minutes || 0, incoming.minutes || 0);
};

const buildRecentDays = (count, activityMap) => {
  const today = startOfDay(new Date());
  const days = [];

  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(today.getTime() - index * DAY_MS);
    const key = formatDayKey(date);
    const entry = activityMap.get(key);
    days.push(entry ? { key, date, ...entry } : createEmptyActivityDay(date));
  }

  return days;
};

const getEntryMinutes = (entry) => Math.max(0, Math.round(entry?.minutes || 0));

const getEngagementScore = (entry) => {
  if (!entry) return 0;

  const minutes = getEntryMinutes(entry);
  const actionBonus = Math.max(0, (entry.count || 0) - 1) * 4;
  const analysisBonus = (entry.analyses || 0) * 4;
  const chatBonus = (entry.chats || 0) * 2;
  const workspaceBonus = entry.workspaceOpened ? 2 : 0;

  return minutes + actionBonus + analysisBonus + chatBonus + workspaceBonus;
};

const getHeatLevel = (entry) => {
  const minutes = getEntryMinutes(entry);
  if (minutes === 0 && !(entry?.count > 0)) return 0;
  const engagementScore = getEngagementScore(entry);

  if (engagementScore < 8) return 1;
  if (engagementScore <= 18) return 2;
  if (engagementScore <= 34) return 3;
  return 4;
};

const getHeatClasses = (level) => {
  switch (level) {
    case 1:
      return 'border-[#2a3145]';
    case 2:
      return 'border-[#313955]';
    case 3:
      return 'border-[#394261]';
    case 4:
      return 'border-[#465070]';
    default:
      return 'border-[#20283a]';
  }
};

const getHeatStyle = (level, isToday) => {
  const stylesByLevel = {
    0: {
      background: 'rgba(16, 23, 37, 0.9)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
    },
    1: {
      background: 'linear-gradient(135deg, rgba(64, 56, 92, 0.7), rgba(47, 58, 86, 0.72))',
      boxShadow: 'none'
    },
    2: {
      background: 'linear-gradient(135deg, rgba(78, 70, 112, 0.82), rgba(59, 72, 108, 0.84))',
      boxShadow: 'none'
    },
    3: {
      background: 'linear-gradient(135deg, rgba(92, 84, 130, 0.9), rgba(69, 84, 124, 0.92))',
      boxShadow: 'none'
    },
    4: {
      background: 'linear-gradient(135deg, rgba(109, 102, 150, 0.94), rgba(82, 98, 142, 0.96))',
      boxShadow: 'none'
    }
  };

  return {
    ...stylesByLevel[level],
    outline: isToday ? '1px solid rgba(182, 176, 214, 0.7)' : 'none',
    outlineOffset: isToday ? '1px' : '0px'
  };
};

const formatTooltipLabel = (date, entry) => {
  const label = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  if (!entry || entry.count <= 0) {
    return `${label}: No activity`;
  }

  const parts = [];
  if (entry.workspaceOpened) parts.push('Opened workspace');
  if (entry.analyses > 0) parts.push(`${entry.analyses} ${entry.analyses === 1 ? 'analysis' : 'analyses'}`);
  if (entry.chats > 0) parts.push(`${entry.chats} ${entry.chats === 1 ? 'chat' : 'chats'}`);

  const otherActions = entry.trackedActions;
  if (otherActions > 0) parts.push(`${otherActions} tracked ${otherActions === 1 ? 'action' : 'actions'}`);

  return `${label}: ${parts.join(', ')}, ${getEntryMinutes(entry)} min`;
};

const getTodaySummary = (entry) => {
  if (!entry || entry.count <= 0) {
    return { value: '0', suffix: 'activities', detail: '0 min today' };
  }

  if (entry.workspaceOpened && entry.analyses === 0 && entry.chats === 0 && entry.trackedActions === 0) {
    return { value: 'Active', suffix: 'today', detail: `${getEntryMinutes(entry)} min` };
  }

  if (entry.analyses > 0) {
    return {
      value: `${entry.analyses}`,
      suffix: entry.analyses === 1 ? 'analysis' : 'analyses',
      detail: `${getEntryMinutes(entry)} min`
    };
  }

  return {
    value: 'Active',
    suffix: 'today',
    detail: `${getEntryMinutes(entry)} min`
  };
};

const calculateStreaks = (activityMap) => {
  const activeKeys = Array.from(activityMap.entries())
    .filter(([, entry]) => entry.count > 0 || entry.workspaceOpened)
    .map(([key]) => key)
    .sort();

  if (activeKeys.length === 0) {
    return { totalActiveDays: 0, currentStreak: 0, longestStreak: 0 };
  }

  let longestStreak = 0;
  let runningStreak = 0;
  let previousDate = null;

  activeKeys.forEach((key) => {
    const currentDate = startOfDay(new Date(`${key}T00:00:00`));
    if (!previousDate) {
      runningStreak = 1;
    } else {
      const diffInDays = Math.round((currentDate - previousDate) / DAY_MS);
      runningStreak = diffInDays === 1 ? runningStreak + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, runningStreak);
    previousDate = currentDate;
  });

  const today = startOfDay(new Date());
  let currentStreak = 0;
  let cursor = today;

  while (true) {
    const key = formatDayKey(cursor);
    const entry = activityMap.get(key);
    if (!entry || (!entry.workspaceOpened && entry.count <= 0)) break;
    currentStreak += 1;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }

  return { totalActiveDays: activeKeys.length, currentStreak, longestStreak };
};

const groupIntoWeeks = (days) => {
  const weeks = [];
  days.forEach((day, index) => {
    const weekIndex = Math.floor(index / 7);
    if (!weeks[weekIndex]) weeks[weekIndex] = [];
    weeks[weekIndex].push(day);
  });
  return weeks;
};

const addTimedActivity = (entry, activityType, processingTime) => {
  const derivedMinutesFromProcessing = Math.ceil((Number(processingTime) || 0) / 60000);
  const heuristicMinutes = MINUTES_BY_ACTIVITY[activityType] || MINUTES_BY_ACTIVITY.default;
  entry.minutes = Math.max(entry.minutes || 0, Math.max(heuristicMinutes, derivedMinutesFromProcessing));
  entry.count += 1;
};

const AnalyticsPage = () => {
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    avgQualityScore: 0,
    totalTimeSpent: '0h 0m',
    currentStreak: 0,
    longestStreak: 0,
    totalActiveDays: 0,
    todaySummary: { value: '0', suffix: 'activities', detail: '0 min today' },
    languageBreakdown: [],
    activityDays: buildRecentDays(HEATMAP_DAYS, new Map())
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [historyResult, projectsResult] = await Promise.allSettled([
        historyAPI.getHistory({ limit: 500 }),
        projectAPI.getProjects({ limit: 500, sortBy: 'lastOpened' })
      ]);

      const history = historyResult.status === 'fulfilled'
        ? historyResult.value.data.history || []
        : [];
      const projects = projectsResult.status === 'fulfilled'
        ? projectsResult.value.data.projects || []
        : [];
      const localActivity = getLocalActivityMap();

      const totalAnalyses = history.length;
      const avgQualityScore = history.length > 0
        ? Math.round(history.reduce((sum, item) => sum + (item.result?.qualityScore || 0), 0) / history.length)
        : 0;

      const languageCount = {};
      const activityMap = new Map();

      history.forEach((item) => {
        const language = item.language || 'Unknown';
        languageCount[language] = (languageCount[language] || 0) + 1;

        const timestamp = item.createdAt || item.updatedAt;
        if (!timestamp) return;

        const key = formatDayKey(startOfDay(timestamp));
        const entry = ensureActivityEntry(activityMap, key);
        const itemType = item.type || 'default';

        if (itemType === 'chat') {
          entry.chats += 1;
        } else if (['review', 'debug', 'approaches', 'optimize'].includes(itemType)) {
          entry.analyses += 1;
        } else {
          entry.trackedActions += 1;
        }

        addTimedActivity(entry, itemType, item.result?.processingTime);
      });

      projects.forEach((project) => {
        if (!project.lastOpenedAt) return;
        const key = formatDayKey(startOfDay(project.lastOpenedAt));
        const entry = ensureActivityEntry(activityMap, key);
        entry.workspaceOpened = true;
        entry.count = Math.max(entry.count, 1);
        entry.minutes = Math.max(entry.minutes || 0, MINUTES_BY_ACTIVITY.workspace_open);
      });

      Object.entries(localActivity).forEach(([key, localEntry]) => {
        const entry = ensureActivityEntry(activityMap, key);
        mergeActivityEntry(entry, localEntry);
      });

      const languageBreakdown = Object.entries(languageCount)
        .map(([language, count]) => ({
          language,
          count,
          percentage: totalAnalyses > 0 ? Math.round((count / totalAnalyses) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      const streakStats = calculateStreaks(activityMap);
      const activityDays = buildRecentDays(HEATMAP_DAYS, activityMap);
      const totalDerivedMinutes = activityDays.reduce((sum, day) => sum + getEntryMinutes(day), 0);
      const todayEntry = activityMap.get(formatDayKey(startOfDay(new Date())));

      setStats({
        totalAnalyses,
        avgQualityScore,
        totalTimeSpent: formatMinutes(totalDerivedMinutes),
        currentStreak: streakStats.currentStreak,
        longestStreak: streakStats.longestStreak,
        totalActiveDays: streakStats.totalActiveDays,
        todaySummary: getTodaySummary(todayEntry),
        languageBreakdown,
        activityDays
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setStats({
        totalAnalyses: 0,
        avgQualityScore: 0,
        totalTimeSpent: '0h 0m',
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
        todaySummary: { value: '0', suffix: 'activities', detail: '0 min today' },
        languageBreakdown: [],
        activityDays: buildRecentDays(HEATMAP_DAYS, new Map())
      });
    } finally {
      setLoading(false);
    }
  };

  const heatmapWeeks = groupIntoWeeks(stats.activityDays);
  const hasActivity = stats.activityDays.some((day) => day.workspaceOpened || day.count > 0);

  return (
    <div className="h-full bg-black text-white relative">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
      <div className="relative z-10 h-full overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-gray-400">Track your coding progress and insights</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 animate-pulse">
                  <div className="h-8 bg-gray-700 rounded mb-4" />
                  <div className="h-4 bg-gray-700 rounded mb-2" />
                  <div className="h-3 bg-gray-700 rounded w-2/3" />
                </div>
              ))
            ) : (
              <>
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <ChartBarIcon className="w-8 h-8 text-blue-400" />
                    <span className="text-2xl font-bold">{stats.totalAnalyses}</span>
                  </div>
                  <h3 className="font-semibold">Total Analyses</h3>
                  <p className="text-sm text-gray-400">All time</p>
                </div>

                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <TrophyIcon className="w-8 h-8 text-yellow-400" />
                    <span className="text-2xl font-bold">{stats.avgQualityScore}</span>
                  </div>
                  <h3 className="font-semibold">Avg Quality Score</h3>
                  <p className="text-sm text-gray-400">Last 30 days</p>
                </div>

                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <ClockIcon className="w-8 h-8 text-green-400" />
                    <span className="text-2xl font-bold">{stats.totalTimeSpent}</span>
                  </div>
                  <h3 className="font-semibold">Time Spent</h3>
                  <p className="text-sm text-gray-400">Derived activity time</p>
                </div>

                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <CodeBracketIcon className="w-8 h-8 text-purple-400" />
                    <span className="text-2xl font-bold">{stats.currentStreak}</span>
                  </div>
                  <h3 className="font-semibold">Current Streak</h3>
                  <p className="text-sm text-gray-400">Keep it up!</p>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.45fr] gap-8">
            {loading ? (
              <>
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 animate-pulse">
                  <div className="h-6 bg-gray-700 rounded mb-6 w-1/3" />
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="h-4 bg-gray-700 rounded w-1/4" />
                        <div className="h-2 bg-gray-700 rounded w-1/3" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 animate-pulse">
                  <div className="h-6 bg-gray-700 rounded mb-6 w-1/3" />
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-20 bg-gray-800 rounded-2xl" />
                    ))}
                  </div>
                  <div className="h-40 bg-gray-800 rounded-2xl" />
                </div>
              </>
            ) : (
              <>
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-xl font-semibold mb-6">Language Breakdown</h2>
                  <div className="space-y-4">
                    {stats.languageBreakdown.length > 0 ? stats.languageBreakdown.map((lang, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600" />
                          <span className="font-medium">{lang.language}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-24 bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                              style={{ width: `${lang.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-400 w-12">{lang.count}</span>
                        </div>
                      </div>
                    )) : (
                      <p className="text-gray-400 text-center py-8">No language data available</p>
                    )}
                  </div>
                </div>

                <div className="bg-[linear-gradient(180deg,rgba(17,24,39,0.88),rgba(7,10,18,0.96))] backdrop-blur-xl border border-white/8 rounded-[28px] p-6 md:p-7 shadow-[0_20px_80px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-white/12 hover:shadow-[0_24px_90px_rgba(76,29,149,0.18)]">
                  <div className="flex items-start justify-between gap-6 mb-6">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight">Total Active Days</h2>
                      <p className="text-sm text-slate-400 mt-1">Track your coding consistency</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Longest streak</p>
                      <p className="text-lg font-semibold text-slate-100">{stats.longestStreak} days</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
                      {[
                        { label: 'Total Active Days', value: stats.totalActiveDays, suffix: 'days', detail: 'Unique active days' },
                        { label: 'Current Streak', value: stats.currentStreak, suffix: 'days', detail: 'Continuous active days' },
                        { label: 'Longest Streak', value: stats.longestStreak, suffix: 'days', detail: 'Best run so far' },
                        { label: 'Today', value: stats.todaySummary.value, suffix: stats.todaySummary.suffix, detail: stats.todaySummary.detail }
                      ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-4 transition-colors duration-300 hover:bg-white/[0.05]"
                      >
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-2">{item.label}</p>
                        <div className="flex items-end gap-2 flex-wrap">
                          <span className="text-2xl font-semibold text-slate-50">{item.value}</span>
                          <span className="text-xs text-slate-500 pb-1">{item.suffix}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">{item.detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="overflow-x-auto pb-2">
                    <div className="inline-flex gap-[6px] min-w-full">
                      {heatmapWeeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="flex flex-col gap-[6px]">
                          {week.map((day) => {
                            const isToday = isSameDay(day.date, new Date());
                            const level = getHeatLevel(day);
                            return (
                              <div key={day.key} className="relative group">
                                <div
                                  title={formatTooltipLabel(day.date, day)}
                                  style={getHeatStyle(level, isToday)}
                                  className={[
                                    'h-4 w-4 rounded-[6px] border transition-all duration-200',
                                    getHeatClasses(level),
                                    isToday
                                      ? 'scale-[1.03]'
                                      : 'group-hover:scale-105 group-hover:border-[#56617f]'
                                  ].join(' ')}
                                />
                                <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#0b1020]/95 px-2.5 py-1.5 text-xs text-slate-200 shadow-2xl group-hover:block">
                                  {formatTooltipLabel(day.date, day)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {!hasActivity && (
                    <p className="mt-4 text-sm text-slate-400">
                      Start analyzing code to build your streak. <span className="text-violet-300/80">Run your first analysis today</span>
                    </p>
                  )}

                  <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/6 pt-4 text-xs text-slate-500">
                    <span>Last {HEATMAP_DAYS} days</span>
                    <div className="flex items-center gap-2">
                      <span>Less activity</span>
                      {[0, 1, 2, 3, 4].map((level) => (
                        <span
                          key={level}
                          className={`h-3.5 w-3.5 rounded-[4px] border ${getHeatClasses(level)}`}
                        />
                      ))}
                      <span>More activity</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-8 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-6">Recent Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <TrophyIcon className="w-8 h-8 text-yellow-400" />
                <div>
                  <h3 className="font-semibold">Code Quality Master</h3>
                  <p className="text-sm text-gray-400">Achieved 90+ quality score</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <ChartBarIcon className="w-8 h-8 text-blue-400" />
                <div>
                  <h3 className="font-semibold">Analysis Streak</h3>
                  <p className="text-sm text-gray-400">{stats.currentStreak > 0 ? `${stats.currentStreak} days in a row` : 'Build your first streak'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <CodeBracketIcon className="w-8 h-8 text-purple-400" />
                <div>
                  <h3 className="font-semibold">Multi-Language</h3>
                  <p className="text-sm text-gray-400">Used {stats.languageBreakdown.length || 0}+ languages</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
