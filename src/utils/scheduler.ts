import {
  Group,
  Match,
  TournamentFinals,
  TournamentFormat,
  Team,
  IndividualKingPlayer,
} from '../types';

export function formatMatchTime(baseHour: number, baseMinute: number, matchIndex: number): string {
  const totalMinutes = baseHour * 60 + baseMinute + matchIndex * 30;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * 1. Standard Group Matches (Classic & 3-pair rotation)
 */
export function generateGroupMatches(
  group: Group,
  startingMatchNumber: number,
  timeOffsetIndex: number = 0
): Match[] {
  const teams = group.teams;
  const n = teams.length;
  const matches: Match[] = [];

  if (n < 2) return matches;

  let currentNumber = startingMatchNumber;
  let timeIdx = timeOffsetIndex;

  // Exact 3 teams format
  if (n === 3) {
    const [t1, t2, t3] = teams.map((t) => t.id);

    // Game 1: 1 vs 3
    matches.push({
      id: `${group.id}_m1_${Date.now()}_1`,
      groupId: group.id,
      groupName: group.name,
      matchNumber: currentNumber++,
      stage: 'group',
      team1Id: t1,
      team2Id: t3,
      score1: null,
      score2: null,
      isFinished: false,
      time: formatMatchTime(9, 0, timeIdx++),
      court: 'מגרש 1',
    });

    // Game 2: 2 vs 3
    matches.push({
      id: `${group.id}_m2_${Date.now()}_2`,
      groupId: group.id,
      groupName: group.name,
      matchNumber: currentNumber++,
      stage: 'group',
      team1Id: t2,
      team2Id: t3,
      score1: null,
      score2: null,
      isFinished: false,
      time: formatMatchTime(9, 0, timeIdx++),
      court: 'מגרש 1',
    });

    // Game 3: 1 vs 2
    matches.push({
      id: `${group.id}_m3_${Date.now()}_3`,
      groupId: group.id,
      groupName: group.name,
      matchNumber: currentNumber++,
      stage: 'group',
      team1Id: t1,
      team2Id: t2,
      score1: null,
      score2: null,
      isFinished: false,
      time: formatMatchTime(9, 0, timeIdx++),
      court: 'מגרש 1',
    });

    return matches;
  }

  // 4 teams format
  if (n === 4) {
    const [t1, t2, t3, t4] = teams.map((t) => t.id);
    const pairs: [string, string][] = [
      [t1, t3],
      [t2, t4],
      [t1, t4],
      [t2, t3],
      [t1, t2],
      [t3, t4],
    ];

    pairs.forEach(([teamA, teamB], idx) => {
      matches.push({
        id: `${group.id}_m${idx + 1}_${Date.now()}_${idx}`,
        groupId: group.id,
        groupName: group.name,
        matchNumber: currentNumber++,
        stage: 'group',
        team1Id: teamA,
        team2Id: teamB,
        score1: null,
        score2: null,
        isFinished: false,
        time: formatMatchTime(9, 0, timeIdx++),
        court: 'מגרש 1',
      });
    });

    return matches;
  }

  // General Round Robin
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      matches.push({
        id: `${group.id}_m_${i}_${j}_${Date.now()}`,
        groupId: group.id,
        groupName: group.name,
        matchNumber: currentNumber++,
        stage: 'group',
        team1Id: teams[i].id,
        team2Id: teams[j].id,
        score1: null,
        score2: null,
        isFinished: false,
        time: formatMatchTime(9, 0, timeIdx++),
        court: 'מגרש 1',
      });
    }
  }

  return matches;
}

/**
 * 2. King of the Beach Schedule Generator
 * In King of the Beach, each group has 4 players.
 * Round 1: Player 1+2 vs 3+4
 * Round 2: Player 1+3 vs 2+4
 * Round 3: Player 1+4 vs 2+3
 */
export function generateKingOfTheBeachMatches(
  group: Group,
  startingMatchNumber: number,
  timeOffsetIndex: number = 0
): Match[] {
  const matches: Match[] = [];
  const teams = group.teams;
  let num = startingMatchNumber;
  let timeIdx = timeOffsetIndex;

  if (teams.length >= 4) {
    const p1 = teams[0].id;
    const p2 = teams[1].id;
    const p3 = teams[2].id;
    const p4 = teams[3].id;

    // Game 1: 1+2 vs 3+4
    matches.push({
      id: `${group.id}_king_1_${Date.now()}`,
      groupId: group.id,
      groupName: group.name,
      matchNumber: num++,
      stage: 'king_round',
      stageName: 'סיבוב 1 (1+2 נגד 3+4)',
      team1Id: p1,
      team2Id: p3,
      team1Label: `${teams[0].player1 || 'שחקן 1'} ו-${teams[1].player1 || 'שחקן 2'}`,
      team2Label: `${teams[2].player1 || 'שחקן 3'} ו-${teams[3].player1 || 'שחקן 4'}`,
      score1: null,
      score2: null,
      isFinished: false,
      time: formatMatchTime(9, 0, timeIdx++),
      court: 'מגרש מרכזי',
      kingRoundIndex: 1,
      kingPlayerIds: { team1: [p1, p2], team2: [p3, p4] },
    });

    // Game 2: 1+3 vs 2+4
    matches.push({
      id: `${group.id}_king_2_${Date.now()}`,
      groupId: group.id,
      groupName: group.name,
      matchNumber: num++,
      stage: 'king_round',
      stageName: 'סיבוב 2 (1+3 נגד 2+4)',
      team1Id: p1,
      team2Id: p2,
      team1Label: `${teams[0].player1 || 'שחקן 1'} ו-${teams[2].player1 || 'שחקן 3'}`,
      team2Label: `${teams[1].player1 || 'שחקן 2'} ו-${teams[3].player1 || 'שחקן 4'}`,
      score1: null,
      score2: null,
      isFinished: false,
      time: formatMatchTime(9, 0, timeIdx++),
      court: 'מגרש מרכזי',
      kingRoundIndex: 2,
      kingPlayerIds: { team1: [p1, p3], team2: [p2, p4] },
    });

    // Game 3: 1+4 vs 2+3
    matches.push({
      id: `${group.id}_king_3_${Date.now()}`,
      groupId: group.id,
      groupName: group.name,
      matchNumber: num++,
      stage: 'king_round',
      stageName: 'סיבוב 3 (1+4 נגד 2+3)',
      team1Id: p1,
      team2Id: p2,
      team1Label: `${teams[0].player1 || 'שחקן 1'} ו-${teams[3].player1 || 'שחקן 4'}`,
      team2Label: `${teams[1].player1 || 'שחקן 2'} ו-${teams[2].player1 || 'שחקן 3'}`,
      score1: null,
      score2: null,
      isFinished: false,
      time: formatMatchTime(9, 0, timeIdx++),
      court: 'מגרש מרכזי',
      kingRoundIndex: 3,
      kingPlayerIds: { team1: [p1, p4], team2: [p2, p3] },
    });
  }

  return matches;
}

/**
 * 3. Double Elimination Matches Generator
 */
export function generateDoubleEliminationMatches(teams: Team[]): Match[] {
  const matches: Match[] = [];
  let num = 1;
  let timeIdx = 0;

  const tCount = Math.min(teams.length, 4);
  if (tCount < 2) return matches;

  // Round 1 Winner Bracket
  matches.push({
    id: `de_w1_${Date.now()}`,
    groupId: 'double_elim',
    groupName: 'מסלול מנצחים',
    matchNumber: num++,
    stage: 'winner_bracket',
    stageName: 'סיבוב 1 - משחק א׳',
    team1Id: teams[0]?.id || '',
    team2Id: teams[1]?.id || '',
    score1: null,
    score2: null,
    isFinished: false,
    time: formatMatchTime(9, 0, timeIdx++),
    court: 'מגרש 1',
  });

  if (tCount >= 4) {
    matches.push({
      id: `de_w2_${Date.now()}`,
      groupId: 'double_elim',
      groupName: 'מסלול מנצחים',
      matchNumber: num++,
      stage: 'winner_bracket',
      stageName: 'סיבוב 1 - משחק ב׳',
      team1Id: teams[2]?.id || '',
      team2Id: teams[3]?.id || '',
      score1: null,
      score2: null,
      isFinished: false,
      time: formatMatchTime(9, 0, timeIdx++),
      court: 'מגרש 1',
    });
  }

  // Loser Bracket
  matches.push({
    id: `de_l1_${Date.now()}`,
    groupId: 'double_elim',
    groupName: 'מסלול מפסידים',
    matchNumber: num++,
    stage: 'loser_bracket',
    stageName: 'מסלול מפסידים (קרב הישרדות)',
    team1Id: '',
    team2Id: '',
    team1Label: 'מפסיד משחק א׳',
    team2Label: 'מפסיד משחק ב׳',
    score1: null,
    score2: null,
    isFinished: false,
    time: formatMatchTime(9, 0, timeIdx++),
    court: 'מגרש 2',
  });

  // Winner Final
  matches.push({
    id: `de_wf_${Date.now()}`,
    groupId: 'double_elim',
    groupName: 'מסלול מנצחים',
    matchNumber: num++,
    stage: 'winner_bracket',
    stageName: 'גמר מסלול מנצחים',
    team1Id: '',
    team2Id: '',
    team1Label: 'מנצח משחק א׳',
    team2Label: 'מנצח משחק ב׳',
    score1: null,
    score2: null,
    isFinished: false,
    time: formatMatchTime(9, 0, timeIdx++),
    court: 'מגרש 1',
  });

  // Grand Final
  matches.push({
    id: `de_gf_${Date.now()}`,
    groupId: 'double_elim',
    groupName: 'שלב הגמר',
    matchNumber: num++,
    stage: 'final',
    stageName: 'הגמר הגדול 🏆',
    team1Id: '',
    team2Id: '',
    team1Label: 'מנצח מסלול מנצחים',
    team2Label: 'מנצח מסלול מפסידים',
    score1: null,
    score2: null,
    isFinished: false,
    time: formatMatchTime(9, 0, timeIdx++),
    court: 'מגרש מרכזי',
  });

  return matches;
}

/**
 * 4. Single Elimination (נוק-אאוט ישיר)
 */
export function generateSingleEliminationMatches(teams: Team[]): Match[] {
  const matches: Match[] = [];
  let num = 1;
  let timeIdx = 0;

  if (teams.length <= 4) {
    // Semifinals -> 3rd place -> Final
    matches.push({
      id: `se_semi1_${Date.now()}`,
      groupId: 'single_elim',
      groupName: 'נוק-אאוט',
      matchNumber: num++,
      stage: 'semi',
      stageName: 'חצי גמר 1',
      team1Id: teams[0]?.id || '',
      team2Id: teams[1]?.id || '',
      score1: null,
      score2: null,
      isFinished: false,
      time: formatMatchTime(9, 30, timeIdx++),
      court: 'מגרש 1',
    });

    matches.push({
      id: `se_semi2_${Date.now()}`,
      groupId: 'single_elim',
      groupName: 'נוק-אאוט',
      matchNumber: num++,
      stage: 'semi',
      stageName: 'חצי גמר 2',
      team1Id: teams[2]?.id || '',
      team2Id: teams[3]?.id || '',
      score1: null,
      score2: null,
      isFinished: false,
      time: formatMatchTime(9, 30, timeIdx++),
      court: 'מגרש 2',
    });

    matches.push({
      id: `se_third_${Date.now()}`,
      groupId: 'single_elim',
      groupName: 'שלב הגמר',
      matchNumber: num++,
      stage: 'third_place',
      stageName: 'משחק על מקום 3 🥉',
      team1Id: '',
      team2Id: '',
      team1Label: 'מפסיד חצי גמר 1',
      team2Label: 'מפסיד חצי גמר 2',
      score1: null,
      score2: null,
      isFinished: false,
      time: formatMatchTime(9, 30, timeIdx++),
      court: 'מגרש 2',
    });

    matches.push({
      id: `se_final_${Date.now()}`,
      groupId: 'single_elim',
      groupName: 'שלב הגמר',
      matchNumber: num++,
      stage: 'final',
      stageName: 'הגמר הגדול 🏆',
      team1Id: '',
      team2Id: '',
      team1Label: 'מנצח חצי גמר 1',
      team2Label: 'מנצח חצי גמר 2',
      score1: null,
      score2: null,
      isFinished: false,
      time: formatMatchTime(9, 30, timeIdx++),
      court: 'מגרש מרכזי',
    });
  }

  return matches;
}

/**
 * Master Schedule Dispatcher by Format
 */
export function generateMatchesForFormat(format: TournamentFormat, groups: Group[]): Match[] {
  switch (format) {
    case 'king_of_the_beach': {
      let allMatches: Match[] = [];
      let num = 1;
      let timeIdx = 0;
      groups.forEach((g) => {
        const gm = generateKingOfTheBeachMatches(g, num, timeIdx);
        allMatches = [...allMatches, ...gm];
        num += gm.length;
        timeIdx += gm.length;
      });
      return allMatches;
    }
    case 'double_elimination': {
      const allTeams = groups.flatMap((g) => g.teams);
      return generateDoubleEliminationMatches(allTeams);
    }
    case 'single_elimination': {
      const allTeams = groups.flatMap((g) => g.teams);
      return generateSingleEliminationMatches(allTeams);
    }
    case 'round_robin': {
      // 1 single group
      if (groups.length > 0) {
        return generateGroupMatches(groups[0], 1, 0);
      }
      return [];
    }
    case 'gold_silver':
    case 'pools_playoffs':
    default: {
      let allMatches: Match[] = [];
      let num = 1;
      let timeIdx = 0;
      groups.forEach((g) => {
        const gm = generateGroupMatches(g, num, timeIdx);
        allMatches = [...allMatches, ...gm];
        num += gm.length;
        timeIdx += gm.length;
      });
      return allMatches;
    }
  }
}

/**
 * Generate Finals Stage Matches based on Format
 */
export function generateFinalsForFormat(
  format: TournamentFormat,
  groups: Group[],
  startingMatchNumber: number
): TournamentFinals {
  let num = startingMatchNumber;

  // Gold & Silver Format
  if (format === 'gold_silver' && groups.length >= 2) {
    const groupA = groups[0];
    const groupB = groups[1];
    const matches: Match[] = [];

    // Gold Semi 1: 1A vs 2B
    matches.push({
      id: `gold_semi1_${Date.now()}`,
      groupId: 'finals_gold',
      groupName: 'בית זהב (מקומות 1-2)',
      matchNumber: num++,
      stage: 'gold_semi',
      stageName: 'חצי גמר זהב 1 (1A נגד 2B)',
      team1Id: groupA.teams[0]?.id || '',
      team2Id: groupB.teams[1]?.id || '',
      team1Label: `מקום 1 ${groupA.name}`,
      team2Label: `מקום 2 ${groupB.name}`,
      score1: null,
      score2: null,
      isFinished: false,
      time: '12:00',
      court: 'מגרש מרכזי',
    });

    // Gold Semi 2: 1B vs 2A
    matches.push({
      id: `gold_semi2_${Date.now()}`,
      groupId: 'finals_gold',
      groupName: 'בית זהב (מקומות 1-2)',
      matchNumber: num++,
      stage: 'gold_semi',
      stageName: 'חצי גמר זהב 2 (1B נגד 2A)',
      team1Id: groupB.teams[0]?.id || '',
      team2Id: groupA.teams[1]?.id || '',
      team1Label: `מקום 1 ${groupB.name}`,
      team2Label: `מקום 2 ${groupA.name}`,
      score1: null,
      score2: null,
      isFinished: false,
      time: '12:30',
      court: 'מגרש מרכזי',
    });

    // Silver Semi 1: 3A vs 4B
    matches.push({
      id: `silver_semi1_${Date.now()}`,
      groupId: 'finals_silver',
      groupName: 'בית כסף (מקומות 3-4)',
      matchNumber: num++,
      stage: 'silver_semi',
      stageName: 'חצי גמר כסף 1 (3A נגד 4B)',
      team1Id: groupA.teams[2]?.id || '',
      team2Id: groupB.teams[3]?.id || '',
      team1Label: `מקום 3 ${groupA.name}`,
      team2Label: `מקום 4 ${groupB.name}`,
      score1: null,
      score2: null,
      isFinished: false,
      time: '12:00',
      court: 'מגרש 2',
    });

    // Silver Semi 2: 3B vs 4A
    matches.push({
      id: `silver_semi2_${Date.now()}`,
      groupId: 'finals_silver',
      groupName: 'בית כסף (מקומות 3-4)',
      matchNumber: num++,
      stage: 'silver_semi',
      stageName: 'חצי גמר כסף 2 (3B נגד 4A)',
      team1Id: groupB.teams[2]?.id || '',
      team2Id: groupA.teams[3]?.id || '',
      team1Label: `מקום 3 ${groupB.name}`,
      team2Label: `מקום 4 ${groupA.name}`,
      score1: null,
      score2: null,
      isFinished: false,
      time: '12:30',
      court: 'מגרש 2',
    });

    // Silver Final
    matches.push({
      id: `silver_final_${Date.now()}`,
      groupId: 'finals_silver',
      groupName: 'בית כסף',
      matchNumber: num++,
      stage: 'silver_final',
      stageName: 'גמר בית כסף 🥈',
      team1Id: '',
      team2Id: '',
      team1Label: 'מנצח חצי גמר כסף 1',
      team2Label: 'מנצח חצי גמר כסף 2',
      score1: null,
      score2: null,
      isFinished: false,
      time: '13:00',
      court: 'מגרש 2',
    });

    // Gold Final 🏆
    matches.push({
      id: `gold_final_${Date.now()}`,
      groupId: 'finals_gold',
      groupName: 'בית זהב',
      matchNumber: num++,
      stage: 'gold_final',
      stageName: 'הגמר הגדול - בית זהב 🏆🥇',
      team1Id: '',
      team2Id: '',
      team1Label: 'מנצח חצי גמר זהב 1',
      team2Label: 'מנצח חצי גמר זהב 2',
      score1: null,
      score2: null,
      isFinished: false,
      time: '13:30',
      court: 'מגרש מרכזי',
    });

    return {
      hasFinals: true,
      format: 'gold_silver',
      matches,
    };
  }

  // Classic Pools + Playoffs (Default)
  if (groups.length >= 2) {
    const groupA = groups[0];
    const groupB = groups[1];
    const matches: Match[] = [];

    matches.push({
      id: `finals_semi_1_${Date.now()}`,
      groupId: 'finals',
      groupName: 'שלב הגמר',
      matchNumber: num++,
      stage: 'semi',
      stageName: 'חצי גמר 1',
      team1Id: groupA.teams[0]?.id || '',
      team2Id: groupB.teams[1]?.id || '',
      team1Label: `מקום 1 ${groupA.name}`,
      team2Label: `מקום 2 ${groupB.name}`,
      score1: null,
      score2: null,
      isFinished: false,
      time: '12:00',
      court: 'מגרש מרכזי',
    });

    matches.push({
      id: `finals_semi_2_${Date.now()}`,
      groupId: 'finals',
      groupName: 'שלב הגמר',
      matchNumber: num++,
      stage: 'semi',
      stageName: 'חצי גמר 2',
      team1Id: groupB.teams[0]?.id || '',
      team2Id: groupA.teams[1]?.id || '',
      team1Label: `מקום 1 ${groupB.name}`,
      team2Label: `מקום 2 ${groupA.name}`,
      score1: null,
      score2: null,
      isFinished: false,
      time: '12:30',
      court: 'מגרש מרכזי',
    });

    matches.push({
      id: `finals_third_${Date.now()}`,
      groupId: 'finals',
      groupName: 'שלב הגמר',
      matchNumber: num++,
      stage: 'third_place',
      stageName: 'משחק על מקום 3 🥉',
      team1Id: '',
      team2Id: '',
      team1Label: 'מפסיד חצי גמר 1',
      team2Label: 'מפסיד חצי גמר 2',
      score1: null,
      score2: null,
      isFinished: false,
      time: '13:00',
      court: 'מגרש 2',
    });

    matches.push({
      id: `finals_final_${Date.now()}`,
      groupId: 'finals',
      groupName: 'שלב הגמר',
      matchNumber: num++,
      stage: 'final',
      stageName: 'משחק הגמר הגדול 🏆',
      team1Id: '',
      team2Id: '',
      team1Label: 'מנצח חצי גמר 1',
      team2Label: 'מנצח חצי גמר 2',
      score1: null,
      score2: null,
      isFinished: false,
      time: '13:30',
      court: 'מגרש מרכזי',
    });

    return {
      hasFinals: true,
      format: 'top4',
      matches,
    };
  }

  // 1 group League or King of beach finals
  const matches: Match[] = [];
  matches.push({
    id: `finals_final_${Date.now()}`,
    groupId: 'finals',
    groupName: 'שלב הגמר',
    matchNumber: num++,
    stage: 'final',
    stageName: 'משחק הגמר הגדול 🏆',
    team1Id: groups[0]?.teams[0]?.id || '',
    team2Id: groups[0]?.teams[1]?.id || '',
    team1Label: 'מקום 1 בטבלה',
    team2Label: 'מקום 2 בטבלה',
    score1: null,
    score2: null,
    isFinished: false,
    time: '12:30',
    court: 'מגרש מרכזי',
  });

  return {
    hasFinals: true,
    format: 'top2',
    matches,
  };
}
