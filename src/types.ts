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

export interface Match {
  id: string;
  groupId: string;
  groupName: string;
  matchNumber: number; // Display number: 1, 2, 3...
  team1Id: string;
  team2Id: string;
  score1: number | null;
  score2: number | null;
  isFinished: boolean;
  court?: string; // Optional court number e.g. "מגרש 1"
}

export type ScheduleMode = 'auto' | 'manual';

export interface Tournament {
  id: string;
  title: string;
  date: string;
  location?: string;
  scheduleMode: ScheduleMode;
  targetScore: number; // usually 21 or 15 points
  groups: Group[];
  matches: Match[];
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
  tablePoints: number; // 2 for win, 1 for loss or standard
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
