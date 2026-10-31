import { Group, Match, TournamentFinals, Team } from '../types';

function formatMatchTime(baseHour: number, baseMinute: number, matchIndex: number): string {
  const totalMinutes = baseHour * 60 + baseMinute + matchIndex * 30;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Generate match schedule for groups
 *
 * For a 3-pair group (as specifically requested by user):
 * Match 1: Pair 1 vs Pair 3
 * Match 2: Pair 2 vs Pair 3
 * Match 3: Pair 1 vs Pair 2
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
    const t1 = teams[0].id;
    const t2 = teams[1].id;
    const t3 = teams[2].id;

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

  // Exact 4 teams format
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

  // General Round Robin for any number of teams
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
 * Generate all matches across all groups
 */
export function generateAllTournamentMatches(groups: Group[]): Match[] {
  let allMatches: Match[] = [];
  let currentNum = 1;
  let timeIdx = 0;

  for (const group of groups) {
    const groupMatches = generateGroupMatches(group, currentNum, timeIdx);
    allMatches = [...allMatches, ...groupMatches];
    currentNum += groupMatches.length;
    timeIdx += groupMatches.length;
  }

  return allMatches;
}

/**
 * Generate Finals Stage Matches (חצי גמר, מקום 3, גמר)
 */
export function generateDefaultFinals(
  groups: Group[],
  startingMatchNumber: number,
  baseTimeMinutes: number = 720 // 12:00
): TournamentFinals {
  const matches: Match[] = [];
  let num = startingMatchNumber;

  if (groups.length >= 2) {
    // 2+ groups: Semifinal 1, Semifinal 2, 3rd place, Grand Final
    const groupA = groups[0];
    const groupB = groups[1];

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
  } else {
    // 1 group: 3rd place and Final
    matches.push({
      id: `finals_third_${Date.now()}`,
      groupId: 'finals',
      groupName: 'שלב הגמר',
      matchNumber: num++,
      stage: 'third_place',
      stageName: 'משחק על מקום 3 🥉',
      team1Id: groups[0]?.teams[2]?.id || '',
      team2Id: groups[0]?.teams[3]?.id || '',
      team1Label: 'מקום 3 בבית',
      team2Label: 'מקום 4 בבית',
      score1: null,
      score2: null,
      isFinished: false,
      time: '12:30',
      court: 'מגרש 2',
    });

    matches.push({
      id: `finals_final_${Date.now()}`,
      groupId: 'finals',
      groupName: 'שלב הגמר',
      matchNumber: num++,
      stage: 'final',
      stageName: 'משחק הגמר הגדול 🏆',
      team1Id: groups[0]?.teams[0]?.id || '',
      team2Id: groups[0]?.teams[1]?.id || '',
      team1Label: 'מקום 1 בבית',
      team2Label: 'מקום 2 בבית',
      score1: null,
      score2: null,
      isFinished: false,
      time: '13:00',
      court: 'מגרש מרכזי',
    });

    return {
      hasFinals: true,
      format: 'top2',
      matches,
    };
  }
}
