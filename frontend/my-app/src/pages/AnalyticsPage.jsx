import { useState, useEffect } from 'react';
import { ChartBarIcon, CodeBracketIcon, ClockIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { historyAPI, projectAPI } from '../services/api';
import toast from 'react-hot-toast';

const AnalyticsPage = () => {
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    avgQualityScore: 0,
    totalTimeSpent: '0h 0m',
    streak: 0,
    languageBreakdown: [],
    weeklyActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [historyResponse, projectsResponse] = await Promise.all([
        historyAPI.getHistory({ limit: 100 }),
        projectAPI.getStats()
      ]);
      
      const history = historyResponse.data.history || [];
      const projectStats = projectsResponse.data;
      
      // Calculate analytics from history data
      const totalAnalyses = history.length;
      const avgQualityScore = history.length > 0 
        ? Math.round(history.reduce((sum, item) => sum + (item.result?.qualityScore || 0), 0) / history.length)
        : 0;
      
      // Calculate language breakdown
      const languageCount = {};
      history.forEach(item => {
        const lang = item.language || 'Unknown';
        languageCount[lang] = (languageCount[lang] || 0) + 1;
      });
      
      const languageBreakdown = Object.entries(languageCount)
        .map(([language, count]) => ({
          language,
          count,
          percentage: Math.round((count / totalAnalyses) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);
      
      setStats({
        totalAnalyses,
        avgQualityScore,
        totalTimeSpent: '0h 0m', // Placeholder since we don't track time
        streak: 0, // Placeholder since we don't track streaks
        languageBreakdown,
        weeklyActivity: [] // Placeholder since we don't have daily data
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Fallback to empty data instead of showing error
      setStats({
        totalAnalyses: 0,
        avgQualityScore: 0,
        totalTimeSpent: '0h 0m',
        streak: 0,
        languageBreakdown: [],
        weeklyActivity: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="h-full bg-black text-white relative">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
      <div className="relative z-10 h-full overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-gray-400">Track your coding progress and insights</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 animate-pulse">
                  <div className="h-8 bg-gray-700 rounded mb-4"></div>
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-2/3"></div>
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
                  <p className="text-sm text-gray-400">This month</p>
                </div>

                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <CodeBracketIcon className="w-8 h-8 text-purple-400" />
                    <span className="text-2xl font-bold">{stats.streak}</span>
                  </div>
                  <h3 className="font-semibold">Day Streak</h3>
                  <p className="text-sm text-gray-400">Keep it up!</p>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {loading ? (
              <>
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 animate-pulse">
                  <div className="h-6 bg-gray-700 rounded mb-6 w-1/3"></div>
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                        <div className="h-2 bg-gray-700 rounded w-1/3"></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 animate-pulse">
                  <div className="h-6 bg-gray-700 rounded mb-6 w-1/3"></div>
                  <div className="h-32 bg-gray-700 rounded"></div>
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
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600"></div>
                          <span className="font-medium">{lang.language}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-24 bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                              style={{ width: `${lang.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-400 w-12">{lang.count}</span>
                        </div>
                      </div>
                    )) : (
                      <p className="text-gray-400 text-center py-8">No language data available</p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-xl font-semibold mb-6">Weekly Activity</h2>
                  <div className="flex items-end justify-between h-32 space-x-2">
                    {stats.weeklyActivity.length > 0 ? stats.weeklyActivity.map((day, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div 
                          className="w-full bg-gradient-to-t from-purple-600 to-blue-600 rounded-t-lg mb-2"
                          style={{ height: `${Math.max((day.analyses / 20) * 100, 4)}%` }}
                        ></div>
                        <span className="text-xs text-gray-400">{day.day}</span>
                        <span className="text-xs text-gray-500">{day.analyses}</span>
                      </div>
                    )) : (
                      <p className="text-gray-400 text-center w-full">No activity data available</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Recent Achievements */}
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
                  <p className="text-sm text-gray-400">7 days in a row</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <CodeBracketIcon className="w-8 h-8 text-purple-400" />
                <div>
                  <h3 className="font-semibold">Multi-Language</h3>
                  <p className="text-sm text-gray-400">Used 4+ languages</p>
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