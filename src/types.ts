export interface Team {
  id: string;
  number: number; // 1, 2, 3...
  player1: string;
  player2: string;
  customName?: string;
}

export interface Group {
  id: string;
  name: string; // e.g., "בית א'", "בית ב'"
  teams: Team[];
}

export type MatchStage = 'group' | 'quarter' | 'semi' | 'third_place' | 'final';

export interface Match {
  id: string;
  groupId: string;
  groupName: string;
  matchNumber: number; // Display number: 1, 2, 3...
  stage: MatchStage;
  stageName?: string; // e.g., "חצי גמר 1", "גמר גדול"
  team1Id: string;
  team2Id: string;
  team1Label?: string; // e.g. "מקום 1 בית א'" if team not yet assigned
  team2Label?: string; // e.g. "מקום 2 בית ב'"
  score1: number | null;
  score2: number | null;
  isFinished: boolean;
  time?: string; // e.g. "09:00", "09:30"
  court?: string; // e.g. "מגרש 1"
}

export type ScheduleMode = 'auto' | 'manual';

export interface TournamentFinals {
  hasFinals: boolean;
  format: 'top2' | 'top4'; // top 2 = direct final, top 4 = semis + 3rd place + final
  matches: Match[];
}

export interface Tournament {
  id: string;
  title: string;
  date: string;
  location?: string;
  scheduleMode: ScheduleMode;
  targetScore: number;
  groups: Group[];
  matches: Match[];
  finals?: TournamentFinals;
  updatedAt: number;
}

export interface GroupStanding {
  teamId: string;
  teamNumber: number;
  playerNames: string;
  customName?: string;
  played: number;
  won: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  tablePoints: number;
  rank?: number;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}
