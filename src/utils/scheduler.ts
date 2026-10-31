import { Group, Match, Team } from '../types';

/**
 * Generate match schedule for groups
 *
 * For a 3-pair group (as specifically requested by the user):
 * Match 1: Pair 1 vs Pair 3
 * Match 2: Pair 2 vs Pair 3
 * Match 3: Pair 1 vs Pair 2
 *
 * For a 4-pair group (or other size):
 * Round-robin so all pairs play against each other
 */
export function generateGroupMatches(group: Group, startingMatchNumber: number): Match[] {
  const teams = group.teams;
  const n = teams.length;
  const matches: Match[] = [];

  if (n < 2) return matches;

  let currentNumber = startingMatchNumber;

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
      team1Id: t1,
      team2Id: t3,
      score1: null,
      score2: null,
      isFinished: false,
    });

    // Game 2: 2 vs 3
    matches.push({
      id: `${group.id}_m2_${Date.now()}_2`,
      groupId: group.id,
      groupName: group.name,
      matchNumber: currentNumber++,
      team1Id: t2,
      team2Id: t3,
      score1: null,
      score2: null,
      isFinished: false,
    });

    // Game 3: 1 vs 2
    matches.push({
      id: `${group.id}_m3_${Date.now()}_3`,
      groupId: group.id,
      groupName: group.name,
      matchNumber: currentNumber++,
      team1Id: t1,
      team2Id: t2,
      score1: null,
      score2: null,
      isFinished: false,
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
        team1Id: teamA,
        team2Id: teamB,
        score1: null,
        score2: null,
        isFinished: false,
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
        team1Id: teams[i].id,
        team2Id: teams[j].id,
        score1: null,
        score2: null,
        isFinished: false,
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

  for (const group of groups) {
    const groupMatches = generateGroupMatches(group, currentNum);
    allMatches = [...allMatches, ...groupMatches];
    currentNum += groupMatches.length;
  }

  return allMatches;
}
