import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trophy, RefreshCw } from 'lucide-react';
import { getTopLearners, LeaderboardEntry } from '@/lib/leaderboard';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { useLearning } from '@/contexts/LearningContext';
import { getApiUrl } from '@/lib/api';

interface LeaderboardProps {
  className?: string;
}

type League = 'amateur' | 'silver' | 'gold' | 'diamond';

interface LeagueGroup {
  league: League;
  name: string;
  color: string;
  ringColor: string;
  entries: LeaderboardEntry[];
}

// League utility functions
const getLeague = (xp: number): League => {
  if (xp >= 30000) return 'diamond';
  if (xp >= 20000) return 'gold';
  if (xp >= 10000) return 'silver';
  return 'amateur';
};

const getLeagueName = (league: League): string => {
  const names: Record<League, string> = {
    amateur: "Amateur's Bronze",
    silver: 'Silver',
    gold: 'Gold',
    diamond: 'Diamond',
  };
  return names[league];
};

const getLeagueColor = (league: League): string => {
  const colors: Record<League, string> = {
    amateur: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800',
    silver: 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800',
    gold: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800',
    diamond: 'bg-cyan-50 dark:bg-cyan-950 border-cyan-200 dark:border-cyan-800',
  };
  return colors[league];
};

const getLeagueRingColor = (league: League): string => {
  const ringColors: Record<League, string> = {
    amateur: 'ring-amber-500',
    silver: 'ring-gray-400',
    gold: 'ring-yellow-500',
    diamond: 'ring-cyan-400',
  };
  return ringColors[league];
};

export default function Leaderboard({ className }: LeaderboardProps) {
  const { user } = useAuth();
  const { progress } = useLearning();
  const [allLearners, setAllLearners] = useState<LeaderboardEntry[]>([]);
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
      // Get all users with XP (no limit)
      const allLearners = await getTopLearners();
      console.log(`📊 Retrieved ${allLearners.length} learners with XP`);

      if (allLearners.length > 0) {
        console.log('✅ Leaderboard entries:', allLearners.map(e => ({ name: e.userName, xp: e.xp })));
        setAllLearners(allLearners);
      } else {
        console.warn('⚠️ No leaderboard entries found');
        setAllLearners([]);
      }
    } catch (err) {
      console.error('❌ Failed to load leaderboard', err);
      setAllLearners([]);
    } finally {
      setLoading(false);
    }
  };

  // Group learners by league
  const leagueGroups = useMemo((): LeagueGroup[] => {
    const groups: Record<League, LeaderboardEntry[]> = {
      amateur: [],
      silver: [],
      gold: [],
      diamond: [],
    };

    // Group users by league
    allLearners.forEach(learner => {
      const league = getLeague(learner.xp);
      groups[league].push(learner);
    });

    // Sort each league by XP (descending)
    Object.keys(groups).forEach(league => {
      groups[league as League].sort((a, b) => {
        if (b.xp !== a.xp) {
          return b.xp - a.xp;
        }
        return a.userName.localeCompare(b.userName);
      });
    });

    // Return in order: Diamond, Gold, Silver, Amateur
    return [
      {
        league: 'diamond',
        name: getLeagueName('diamond'),
        color: getLeagueColor('diamond'),
        ringColor: getLeagueRingColor('diamond'),
        entries: groups.diamond,
      },
      {
        league: 'gold',
        name: getLeagueName('gold'),
        color: getLeagueColor('gold'),
        ringColor: getLeagueRingColor('gold'),
        entries: groups.gold,
      },
      {
        league: 'silver',
        name: getLeagueName('silver'),
        color: getLeagueColor('silver'),
        ringColor: getLeagueRingColor('silver'),
        entries: groups.silver,
      },
      {
        league: 'amateur',
        name: getLeagueName('amateur'),
        color: getLeagueColor('amateur'),
        ringColor: getLeagueRingColor('amateur'),
        entries: groups.amateur,
      },
    ];
  }, [allLearners]);

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


  return (
    <Card className={className}>
      <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
              Leaderboard
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Compete across four leagues: Amateur's Bronze, Silver, Gold, and Diamond
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
      <CardContent className="p-4 sm:p-6 pt-0 space-y-6">
        {loading ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Loading leaderboard...
          </div>
        ) : allLearners.length === 0 ? (
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
          leagueGroups.map((leagueGroup) => {
            if (leagueGroup.entries.length === 0) return null;

            return (
              <div key={leagueGroup.league} className="space-y-3">
                {/* League Header */}
                <div className={`flex items-center justify-between p-3 rounded-lg border ${leagueGroup.color}`}>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm sm:text-base">{leagueGroup.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {leagueGroup.entries.length} {leagueGroup.entries.length === 1 ? 'player' : 'players'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {leagueGroup.league === 'amateur' && '0 - 9,999 XP'}
                    {leagueGroup.league === 'silver' && '10,000 - 19,999 XP'}
                    {leagueGroup.league === 'gold' && '20,000 - 29,999 XP'}
                    {leagueGroup.league === 'diamond' && '30,000+ XP'}
                  </div>
                </div>

                {/* League Entries */}
                <div className="space-y-2">
                  {leagueGroup.entries.map((learner) => {
                    const isCurrentUser = user && learner.userId === user.id;
                    const league = getLeague(learner.xp);

                    return (
                      <div
                        key={learner.userId}
                        className={`flex items-center justify-between p-2 sm:p-3 rounded-md border ${leagueGroup.color} ${isCurrentUser ? 'ring-2 ring-primary' : ''}`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <Avatar className={`h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 ring-2 ${getLeagueRingColor(league)}`}>
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
                              <span>Level {learner.level} • {learner.xp.toLocaleString()} XP</span>
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
                  })}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

