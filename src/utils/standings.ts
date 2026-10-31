import { Group, Match, GroupStanding, IndividualKingPlayer } from '../types';

export function calculateGroupStandings(group: Group, matches: Match[]): GroupStanding[] {
  const groupMatches = matches.filter(
    (m) => m.groupId === group.id && m.isFinished && m.score1 !== null && m.score2 !== null
  );

  const standingsMap: Record<string, GroupStanding> = {};

  group.teams.forEach((team) => {
    const playerNames =
      [team.player1.trim(), team.player2.trim()].filter(Boolean).join(' ו-') ||
      `זוג ${team.number}`;
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
      t1.tablePoints += 2;
      t2.lost += 1;
      t2.tablePoints += 1;
    } else if (s2 > s1) {
      t2.won += 1;
      t2.tablePoints += 2;
      t1.lost += 1;
      t1.tablePoints += 1;
    }
  });

  const standings = Object.values(standingsMap).map((item) => ({
    ...item,
    pointDiff: item.pointsFor - item.pointsAgainst,
  }));

  standings.sort((a, b) => {
    if (b.won !== a.won) {
      return b.won - a.won;
    }
    if (b.pointDiff !== a.pointDiff) {
      return b.pointDiff - a.pointDiff;
    }
    return b.pointsFor - a.pointsFor;
  });

  return standings.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}

/**
 * Calculate Individual Leaderboard for King of the Beach
 */
export function calculateKingStandings(group: Group, matches: Match[]): IndividualKingPlayer[] {
  const kingMatches = matches.filter((m) => m.groupId === group.id && m.stage === 'king_round' && m.isFinished);
  const playerStats: Record<string, IndividualKingPlayer> = {};

  group.teams.forEach((t) => {
    playerStats[t.id] = {
      id: t.id,
      name: t.player1 || `שחקן ${t.number}`,
      played: 0,
      won: 0,
      lost: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDiff: 0,
    };
  });

  kingMatches.forEach((m) => {
    const s1 = m.score1 ?? 0;
    const s2 = m.score2 ?? 0;
    const t1Players = m.kingPlayerIds?.team1 || [m.team1Id];
    const t2Players = m.kingPlayerIds?.team2 || [m.team2Id];

    t1Players.forEach((pid) => {
      const st = playerStats[pid];
      if (st) {
        st.played += 1;
        st.pointsFor += s1;
        st.pointsAgainst += s2;
        if (s1 > s2) st.won += 1;
        else if (s2 > s1) st.lost += 1;
      }
    });

    t2Players.forEach((pid) => {
      const st = playerStats[pid];
      if (st) {
        st.played += 1;
        st.pointsFor += s2;
        st.pointsAgainst += s1;
        if (s2 > s1) st.won += 1;
        else if (s1 > s2) st.lost += 1;
      }
    });
  });

  const list = Object.values(playerStats).map((p) => ({
    ...p,
    pointDiff: p.pointsFor - p.pointsAgainst,
  }));

  list.sort((a, b) => {
    if (b.won !== a.won) return b.won - a.won;
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    return b.pointsFor - a.pointsFor;
  });

  return list.map((p, idx) => ({ ...p, rank: idx + 1 }));
}
