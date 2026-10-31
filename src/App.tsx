import React, { useState, useEffect } from 'react';
import { Tournament, Match, Group, Team, TournamentFinals } from './types';
import { Header } from './components/Header';
import { SetupTab } from './components/SetupTab';
import { MatchesTab } from './components/MatchesTab';
import { StandingsTab } from './components/StandingsTab';
import { ShareSyncModal } from './components/ShareSyncModal';
import { ManualMatchModal } from './components/ManualMatchModal';
import { TournamentReportModal } from './components/TournamentReportModal';
import {
  loadLocalTournament,
  saveLocalTournament,
  syncTournamentToCloud,
  subscribeToTournamentCloud,
  initFirebaseService,
  getSavedFirebaseConfig,
} from './services/firebase';
import { generateAllTournamentMatches, generateDefaultFinals } from './utils/scheduler';
import { calculateGroupStandings } from './utils/standings';
import { Trophy, Calendar, Users, Settings, Smartphone, Award, Flame, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'setup' | 'matches' | 'standings'>('matches');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(false);

  // Initialize tournament
  const [tournament, setTournament] = useState<Tournament>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlTourId = urlParams.get('t');

    const local = loadLocalTournament();
    if (local && (!urlTourId || local.id === urlTourId)) {
      // Ensure finals exists
      if (!local.finals) {
        local.finals = generateDefaultFinals(local.groups, (local.matches?.length || 0) + 1);
      }
      return local;
    }

    const newId = urlTourId || `TLV-${Math.floor(1000 + Math.random() * 9000)}`;
    const initialGroups: Group[] = [
      {
        id: `group_${Date.now()}_0`,
        name: "בית א'",
        teams: [
          { id: `t_${Date.now()}_1`, number: 1, player1: 'דני לוי', player2: 'יוסי כהן' },
          { id: `t_${Date.now()}_2`, number: 2, player1: 'רועי שחר', player2: 'תומר אלון' },
          { id: `t_${Date.now()}_3`, number: 3, player1: 'מתן פז', player2: 'עומר בר' },
        ],
      },
      {
        id: `group_${Date.now()}_1`,
        name: "בית ב'",
        teams: [
          { id: `t_${Date.now()}_4`, number: 1, player1: 'איתי שדה', player2: 'גלעד קורן' },
          { id: `t_${Date.now()}_5`, number: 2, player1: 'אלון מור', player2: 'ניר שגב' },
          { id: `t_${Date.now()}_6`, number: 3, player1: 'עידו לביא', player2: 'עמית נבו' },
        ],
      },
    ];

    const initialMatches = generateAllTournamentMatches(initialGroups);
    const initialFinals = generateDefaultFinals(initialGroups, initialMatches.length + 1);

    return {
      id: newId,
      title: 'טורניר כדורעף חופים כ"ח ת"א',
      date: new Date().toISOString().split('T')[0],
      scheduleMode: 'auto',
      targetScore: 21,
      groups: initialGroups,
      matches: initialMatches,
      finals: initialFinals,
      updatedAt: Date.now(),
    };
  });

  // Check and setup Firebase connection
  useEffect(() => {
    const config = getSavedFirebaseConfig();
    if (config && config.projectId) {
      const db = initFirebaseService(config);
      if (db) {
        setIsCloudConnected(true);
      }
    }
  }, []);

  // Subscribe to real-time updates from Firebase
  useEffect(() => {
    if (!tournament.id) return;

    const unsubscribe = subscribeToTournamentCloud(
      tournament.id,
      (cloudData) => {
        setTournament(cloudData);
        setIsCloudConnected(true);
      },
      () => {
        setIsCloudConnected(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [tournament.id]);

  // Handle tournament update
  const handleUpdateTournament = async (updated: Tournament) => {
    setTournament(updated);
    saveLocalTournament(updated);
    if (isCloudConnected) {
      await syncTournamentToCloud(updated);
    }
  };

  // Group Match update
  const handleUpdateMatch = async (updatedMatch: Match) => {
    const updatedMatches = tournament.matches.map((m) =>
      m.id === updatedMatch.id ? updatedMatch : m
    );
    const updatedTournament: Tournament = {
      ...tournament,
      matches: updatedMatches,
      updatedAt: Date.now(),
    };
    handleUpdateTournament(updatedTournament);
  };

  // Finals Match update
  const handleUpdateFinalsMatch = async (updatedMatch: Match) => {
    if (!tournament.finals) return;

    const currentMatches = [...tournament.finals.matches];
    const matchIndex = currentMatches.findIndex((m) => m.id === updatedMatch.id);
    if (matchIndex === -1) return;

    currentMatches[matchIndex] = updatedMatch;

    // Check if semi finals finished, propagate winners to Final and 3rd place!
    const semi1 = currentMatches.find((m) => m.stage === 'semi' && m.stageName?.includes('1'));
    const semi2 = currentMatches.find((m) => m.stage === 'semi' && m.stageName?.includes('2'));
    const finalMatch = currentMatches.find((m) => m.stage === 'final');
    const thirdMatch = currentMatches.find((m) => m.stage === 'third_place');

    if (semi1 && semi2 && finalMatch && thirdMatch) {
      if (semi1.isFinished && semi1.score1 !== null && semi1.score2 !== null) {
        const s1WinnerId = semi1.score1 > semi1.score2 ? semi1.team1Id : semi1.team2Id;
        const s1LoserId = semi1.score1 > semi1.score2 ? semi1.team2Id : semi1.team1Id;
        finalMatch.team1Id = s1WinnerId;
        thirdMatch.team1Id = s1LoserId;
      }
      if (semi2.isFinished && semi2.score1 !== null && semi2.score2 !== null) {
        const s2WinnerId = semi2.score1 > semi2.score2 ? semi2.team1Id : semi2.team2Id;
        const s2LoserId = semi2.score1 > semi2.score2 ? semi2.team2Id : semi2.team1Id;
        finalMatch.team2Id = s2WinnerId;
        thirdMatch.team2Id = s2LoserId;
      }
    }

    const updatedTournament: Tournament = {
      ...tournament,
      finals: {
        ...tournament.finals,
        matches: currentMatches,
      },
      updatedAt: Date.now(),
    };

    handleUpdateTournament(updatedTournament);
  };

  // Sync qualified teams from groups into finals
  const handleSyncFinalsTeams = () => {
    if (!tournament.finals || tournament.groups.length === 0) return;

    const currentFinalsMatches = [...tournament.finals.matches];

    if (tournament.groups.length >= 2) {
      const groupAStandings = calculateGroupStandings(tournament.groups[0], tournament.matches);
      const groupBStandings = calculateGroupStandings(tournament.groups[1], tournament.matches);

      const semi1 = currentFinalsMatches.find((m) => m.stage === 'semi' && m.stageName?.includes('1'));
      const semi2 = currentFinalsMatches.find((m) => m.stage === 'semi' && m.stageName?.includes('2'));

      if (semi1 && groupAStandings[0] && groupBStandings[1]) {
        semi1.team1Id = groupAStandings[0].teamId;
        semi1.team2Id = groupBStandings[1].teamId;
      }

      if (semi2 && groupBStandings[0] && groupAStandings[1]) {
        semi2.team1Id = groupBStandings[0].teamId;
        semi2.team2Id = groupAStandings[1].teamId;
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
      alert('העולים מהבתים סונכרנו בהצלחה לשלב חצי הגמר והפלייאוף! 🏐');
    }

    const updatedTournament: Tournament = {
      ...tournament,
      finals: {
        ...tournament.finals,
        matches: currentFinalsMatches,
      },
      updatedAt: Date.now(),
    };
    handleUpdateTournament(updatedTournament);
  };

  // Add manual match
  const handleAddManualMatch = (newMatch: Match) => {
    const updatedTournament: Tournament = {
      ...tournament,
      matches: [...tournament.matches, newMatch],
      updatedAt: Date.now(),
    };
    handleUpdateTournament(updatedTournament);
  };

  // Delete match
  const handleDeleteMatch = (matchId: string) => {
    if (!confirm('האם למחוק משחק זה מלוח המשחקים?')) return;
    const updatedMatches = tournament.matches
      .filter((m) => m.id !== matchId)
      .map((m, idx) => ({ ...m, matchNumber: idx + 1 }));

    const updatedTournament: Tournament = {
      ...tournament,
      matches: updatedMatches,
      updatedAt: Date.now(),
    };
    handleUpdateTournament(updatedTournament);
  };

  // Create fresh tournament
  const handleNewTournament = () => {
    if (!confirm('האם לפתוח טורניר חדש? הנתונים יאותחלו.')) return;

    const newId = `TLV-${Math.floor(1000 + Math.random() * 9000)}`;
    const blankGroups: Group[] = [
      {
        id: `group_${Date.now()}_0`,
        name: "בית א'",
        teams: [
          { id: `t_${Date.now()}_1`, number: 1, player1: '', player2: '' },
          { id: `t_${Date.now()}_2`, number: 2, player1: '', player2: '' },
          { id: `t_${Date.now()}_3`, number: 3, player1: '', player2: '' },
        ],
      },
      {
        id: `group_${Date.now()}_1`,
        name: "בית ב'",
        teams: [
          { id: `t_${Date.now()}_4`, number: 1, player1: '', player2: '' },
          { id: `t_${Date.now()}_5`, number: 2, player1: '', player2: '' },
          { id: `t_${Date.now()}_6`, number: 3, player1: '', player2: '' },
        ],
      },
    ];

    const freshFinals = generateDefaultFinals(blankGroups, 1);

    const freshTournament: Tournament = {
      id: newId,
      title: 'טורניר כדורעף חופים כ"ח ת"א',
      date: new Date().toISOString().split('T')[0],
      scheduleMode: 'auto',
      targetScore: 21,
      groups: blankGroups,
      matches: [],
      finals: freshFinals,
      updatedAt: Date.now(),
    };

    setTournament(freshTournament);
    saveLocalTournament(freshTournament);
    setActiveTab('setup');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col selection:bg-tlv-pink selection:text-white">
      {/* App Header */}
      <Header
        tournamentTitle={tournament.title}
        tournamentId={tournament.id}
        isCloudConnected={isCloudConnected}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onNewTournament={handleNewTournament}
      />

      {/* Main Content Tabs & Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 pt-4 md:pt-6">
        {/* Navigation Tabs Bar + PDF Report Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-1 w-full sm:max-w-md">
            <button
              type="button"
              onClick={() => setActiveTab('setup')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all ${
                activeTab === 'setup'
                  ? 'bg-tlv-navy text-tlv-teal shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>1. סידור הבתים</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('matches')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all ${
                activeTab === 'matches'
                  ? 'bg-tlv-pink text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>2. תוצאות ושעות</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('standings')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all ${
                activeTab === 'standings'
                  ? 'bg-tlv-yellow text-tlv-navy shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>3. טבלאות בתים</span>
            </button>
          </div>

          {/* Quick PDF Report Trigger Button */}
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-black px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-md transition-all active:scale-95 border border-amber-300 w-full sm:w-auto justify-center"
          >
            <Trophy className="w-4 h-4 fill-slate-900" />
            <span>הפקת דוח PDF והכתרת מנצחים 📄</span>
          </button>
        </div>

        {/* Active Tab View */}
        {activeTab === 'setup' && (
          <SetupTab
            tournament={tournament}
            onSaveTournament={handleUpdateTournament}
            onNavigateToMatches={() => setActiveTab('matches')}
          />
        )}

        {activeTab === 'matches' && (
          <MatchesTab
            tournament={tournament}
            onUpdateMatch={handleUpdateMatch}
            onUpdateFinalsMatch={handleUpdateFinalsMatch}
            onAddMatch={handleAddManualMatch}
            onDeleteMatch={handleDeleteMatch}
            onOpenManualModal={() => setIsManualModalOpen(true)}
            onOpenReportModal={() => setIsReportModalOpen(true)}
            onSyncFinalsTeams={handleSyncFinalsTeams}
          />
        )}

        {activeTab === 'standings' && <StandingsTab tournament={tournament} />}
      </main>

      {/* Mobile Sticky Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-3 shadow-lg flex items-center justify-around">
        <button
          onClick={() => setActiveTab('setup')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
            activeTab === 'setup' ? 'text-tlv-navy' : 'text-slate-400'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              activeTab === 'setup' ? 'bg-tlv-navy text-tlv-teal' : 'bg-transparent'
            }`}
          >
            <Settings className="w-5 h-5" />
          </div>
          <span>בתים</span>
        </button>

        <button
          onClick={() => setActiveTab('matches')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
            activeTab === 'matches' ? 'text-tlv-pink' : 'text-slate-400'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              activeTab === 'matches' ? 'bg-tlv-pink text-white shadow-sm' : 'bg-transparent'
            }`}
          >
            <Flame className="w-5 h-5" />
          </div>
          <span>תוצאות</span>
        </button>

        <button
          onClick={() => setActiveTab('standings')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
            activeTab === 'standings' ? 'text-tlv-navy' : 'text-slate-400'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              activeTab === 'standings' ? 'bg-tlv-yellow text-tlv-navy shadow-sm' : 'bg-transparent'
            }`}
          >
            <Trophy className="w-5 h-5" />
          </div>
          <span>טבלאות</span>
        </button>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="flex flex-col items-center gap-1 text-[11px] font-bold text-amber-600"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
            <FileText className="w-5 h-5" />
          </div>
          <span>דוח PDF</span>
        </button>
      </div>

      {/* Modals */}
      <ShareSyncModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        tournament={tournament}
        isCloudConnected={isCloudConnected}
        onConfigUpdated={() => setIsCloudConnected(true)}
      />

      <ManualMatchModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        tournament={tournament}
        onAddMatch={handleAddManualMatch}
      />

      <TournamentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        tournament={tournament}
      />

      {/* App Footer */}
      <footer className="mt-auto py-6 bg-tlv-navy text-white text-center text-xs border-t-2 border-tlv-teal/40">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-black text-tlv-yellow">כ"ח תל אביב</span>
            <span>-</span>
            <span className="text-slate-300">העמותה לכדורעף חופים ע"ש רועי פלס</span>
          </div>
          <div className="text-[11px] text-slate-400">
            אפליקציית ניהול טורנירים מותאמת לסמארטפון ולמחשב • פותחה באהבה לספורט החופים 🏐
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
