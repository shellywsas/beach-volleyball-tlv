export type TournamentFormat =
  | 'pools_playoffs' // שלב בתים + פלייאוף (קלאסי)
  | 'gold_silver' // פלייאוף עליון ותחתון (בית זהב ובית כסף)
  | 'round_robin' // סבב ליגה מלא (כולם מול כולם)
  | 'king_of_the_beach' // מלך ומלכת החוף (אישי, החלפת פרטנרים)
  | 'double_elimination' // הפסד כפול (מודחים רק אחרי 2 הפסדים)
  | 'single_elimination'; // נוק-אאוט ישיר

export interface Team {
  id: string;
  number: number; // 1, 2, 3...
  player1: string;
  player2: string;
  customName?: string;
}

export interface Group {
  id: string;
  name: string; // e.g., "בית א'", "בית ב'", "ליגה ראשית", "חצר 1"
  teams: Team[];
}

export type MatchStage =
  | 'group'
  | 'quarter'
  | 'semi'
  | 'third_place'
  | 'final'
  | 'gold_semi'
  | 'gold_final'
  | 'gold_third'
  | 'silver_semi'
  | 'silver_final'
  | 'silver_third'
  | 'winner_bracket'
  | 'loser_bracket'
  | 'king_round';

export interface Match {
  id: string;
  groupId: string;
  groupName: string;
  matchNumber: number; // Display number: 1, 2, 3...
  stage: MatchStage;
  stageName?: string; // e.g., "חצי גמר 1", "גמר זהב", "גמר כסף"
  team1Id: string;
  team2Id: string;
  team1Label?: string;
  team2Label?: string;
  score1: number | null;
  score2: number | null;
  isFinished: boolean;
  time?: string; // e.g. "09:00", "09:30"
  court?: string; // e.g. "מגרש 1"
  kingRoundIndex?: number;
  kingPlayerIds?: {
    team1: string[];
    team2: string[];
  };
}

export type ScheduleMode = 'auto' | 'manual';

export interface TournamentFinals {
  hasFinals: boolean;
  format: 'top2' | 'top4' | 'gold_silver' | 'bracket';
  matches: Match[];
}

export interface IndividualKingPlayer {
  id: string;
  name: string;
  played: number;
  won: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  rank?: number;
}

export interface Tournament {
  id: string;
  title: string;
  date: string;
  location?: string;
  format: TournamentFormat;
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
