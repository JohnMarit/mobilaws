import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, TrendingUp, User, RefreshCw } from 'lucide-react';
import { getTopLearners, getUserRankInfo, LeaderboardEntry } from '@/lib/leaderboard';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { useLearning } from '@/contexts/LearningContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faMedal, faAward } from '@fortawesome/free-solid-svg-icons';
import { getApiUrl } from '@/lib/api';

interface LeaderboardProps {
  className?: string;
}

export default function Leaderboard({ className }: LeaderboardProps) {
  const { user } = useAuth();
  const { progress } = useLearning();
  const [topLearners, setTopLearners] = useState<LeaderboardEntry[]>([]);
  const [userRankInfo, setUserRankInfo] = useState<Awaited<ReturnType<typeof getUserRankInfo>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLeaderboard = async (forcePopulate = false) => {
    if (forcePopulate) {
      setRefreshing(true);
      try {
        // Manually trigger population
        const populateUrl = getApiUrl('leaderboard/populate');
        console.log('🔄 Manually populating leaderboard...');
        await fetch(populateUrl, { method: 'POST' });
        console.log('✅ Population triggered');
      } catch (err) {
        console.error('❌ Failed to populate leaderboard', err);
      } finally {
        setRefreshing(false);
      }
    }

    setLoading(true);
    try {
      console.log('🔄 Loading leaderboard data...');
      // Get top 10 users with XP
      const topLearners = await getTopLearners(10);
      console.log(`📊 Retrieved ${topLearners.length} learners with XP`);

      if (topLearners.length > 0) {
        console.log('✅ Leaderboard entries:', topLearners.map(e => ({ name: e.userName, xp: e.xp })));
        setTopLearners(topLearners);
      } else {
        console.warn('⚠️ No leaderboard entries found');
        setTopLearners([]);
      }

      if (user) {
        const rankInfo = await getUserRankInfo(user.id);
        console.log('👤 User rank info:', rankInfo);
        setUserRankInfo(rankInfo);
      }
    } catch (err) {
      console.error('❌ Failed to load leaderboard', err);
      setTopLearners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load immediately - try to populate first time
    loadLeaderboard(true);

    // Refresh every 10 seconds to catch new users
    const interval = setInterval(() => loadLeaderboard(), 10000);

    return () => {
      clearInterval(interval);
    };
  }, [user?.id]); // Only reload when user changes

  // Also reload when XP changes (but don't populate)
  useEffect(() => {
    if (user?.id) {
      loadLeaderboard(false);
    }
  }, [progress.xp]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return <FontAwesomeIcon icon={faTrophy} className="h-4 w-4 text-yellow-500" />;
    } else if (rank === 2) {
      return <FontAwesomeIcon icon={faMedal} className="h-4 w-4 text-gray-400" />;
    } else if (rank === 3) {
      return <FontAwesomeIcon icon={faAward} className="h-4 w-4 text-amber-600" />;
    }
    return <span className="text-xs font-semibold text-muted-foreground">#{rank}</span>;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800';
    if (rank === 2) return 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800';
    if (rank === 3) return 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800';
    return 'bg-white dark:bg-gray-900';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
              Top Learners
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Top 10 learners ranked by total XP earned
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadLeaderboard(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
        {/* Top 10 List */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Loading leaderboard...
            </div>
          ) : topLearners.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <div className="text-sm text-muted-foreground">
                No learners yet. Click refresh to populate the leaderboard!
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadLeaderboard(true)}
                disabled={refreshing}
                className="flex items-center gap-2 mx-auto"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Populating...' : 'Populate Leaderboard'}
              </Button>
            </div>
          ) : (
            topLearners.map((learner, index) => {
              const rank = index + 1;
              const isCurrentUser = user && learner.userId === user.id;

              return (
                <div
                  key={learner.userId}
                  className={`flex items-center justify-between p-2 sm:p-3 rounded-md border ${getRankColor(rank)
                    } ${isCurrentUser ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-6 sm:w-8 flex items-center justify-center">
                      {getRankIcon(rank)}
                    </div>
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                      {learner.userPicture && (
                        <AvatarImage src={learner.userPicture} alt={learner.userName} />
                      )}
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {learner.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm sm:text-base font-medium truncate">
                        {learner.userName}
                        {isCurrentUser && (
                          <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                        <span>Level {learner.level} • {learner.xp} XP</span>
                        {learner.streak > 0 && (
                          <span className="flex items-center gap-1 text-orange-500">
                            🔥 {learner.streak}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* User's Progress to Top 10 */}
        {user && userRankInfo && !userRankInfo.isInTop10 && (
          <div className="pt-4 border-t space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Your Progress to Top 10</span>
              <span className="text-muted-foreground">{userRankInfo.completionRate}%</span>
            </div>
            <Progress value={userRankInfo.completionRate} className="h-2" />
            <div className="text-xs sm:text-sm text-muted-foreground">
              {userRankInfo.rank ? (
                <>
                  You're ranked #{userRankInfo.rank}. Need {userRankInfo.xpNeededForTop10} more XP to reach top 10.
                </>
              ) : (
                <>
                  Need {userRankInfo.xpNeededForTop10} XP to enter top 10.
                </>
              )}
            </div>
          </div>
        )}

        {/* User is in Top 10 */}
        {user && userRankInfo && userRankInfo.isInTop10 && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
              <Trophy className="h-4 w-4" />
              Congratulations! You're in the top 10 (Rank #{userRankInfo.rank})
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

