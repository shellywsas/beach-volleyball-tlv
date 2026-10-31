import { Group, Match, GroupStanding } from '../types';

export function calculateGroupStandings(group: Group, matches: Match[]): GroupStanding[] {
  const groupMatches = matches.filter(
    (m) => m.groupId === group.id && m.isFinished && m.score1 !== null && m.score2 !== null
  );

  const standingsMap: Record<string, GroupStanding> = {};

  // Initialize standings for each team in the group
  group.teams.forEach((team) => {
    const playerNames = [team.player1.trim(), team.player2.trim()].filter(Boolean).join(' ו-') || `זוג ${team.number}`;
    standingsMap[team.id] = {
      teamId: team.id,
      teamNumber: team.number,
      playerNames,
      customName: team.customName,
      played: 0,
      won: 0,
      lost: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDiff: 0,
      tablePoints: 0,
    };
  });

  // Calculate results from finished matches
  groupMatches.forEach((match) => {
    const t1 = standingsMap[match.team1Id];
    const t2 = standingsMap[match.team2Id];

    if (!t1 || !t2) return;

    const s1 = match.score1 ?? 0;
    const s2 = match.score2 ?? 0;

    t1.played += 1;
    t2.played += 1;

    t1.pointsFor += s1;
    t1.pointsAgainst += s2;
    t2.pointsFor += s2;
    t2.pointsAgainst += s1;

    if (s1 > s2) {
      t1.won += 1;
      t1.tablePoints += 2; // Standard beach volleyball: 2 pts for win
      t2.lost += 1;
      t2.tablePoints += 1; // 1 pt for played loss
    } else if (s2 > s1) {
      t2.won += 1;
      t2.tablePoints += 2;
      t1.lost += 1;
      t1.tablePoints += 1;
    }
  });

  // Calculate point diffs
  const standings = Object.values(standingsMap).map((item) => ({
    ...item,
    pointDiff: item.pointsFor - item.pointsAgainst,
  }));

  // Sort: 1. Wins (desc), 2. Point Differential (desc), 3. Points For (desc)
  standings.sort((a, b) => {
    if (b.won !== a.won) {
      return b.won - a.won;
    }
    if (b.pointDiff !== a.pointDiff) {
      return b.pointDiff - a.pointDiff;
    }
    return b.pointsFor - a.pointsFor;
  });

  // Assign ranks
  return standings.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}
