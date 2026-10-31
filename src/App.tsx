import React, { useState, useEffect } from 'react';
import { Tournament, Match, Group, Team } from './types';
import { Header } from './components/Header';
import { SetupTab } from './components/SetupTab';
import { MatchesTab } from './components/MatchesTab';
import { StandingsTab } from './components/StandingsTab';
import { ShareSyncModal } from './components/ShareSyncModal';
import { ManualMatchModal } from './components/ManualMatchModal';
import {
  loadLocalTournament,
  saveLocalTournament,
  syncTournamentToCloud,
  subscribeToTournamentCloud,
  initFirebaseService,
  getSavedFirebaseConfig,
} from './services/firebase';
import { generateAllTournamentMatches } from './utils/scheduler';
import { Trophy, Calendar, Users, Settings, Smartphone, Award, Flame } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'setup' | 'matches' | 'standings'>('setup');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(false);

  // Initialize tournament
  const [tournament, setTournament] = useState<Tournament>(() => {
    // 1. Try URL tournament id
    const urlParams = new URLSearchParams(window.location.search);
    const urlTourId = urlParams.get('t');

    // 2. Try LocalStorage
    const local = loadLocalTournament();
    if (local && (!urlTourId || local.id === urlTourId)) {
      return local;
    }

    // 3. Fallback to fresh initial tournament
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

    return {
      id: newId,
      title: 'טורניר כדורעף חופים כ"ח ת"א',
      date: new Date().toISOString().split('T')[0],
      scheduleMode: 'auto',
      targetScore: 21,
      groups: initialGroups,
      matches: initialMatches,
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

  // Match updates
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

  // Create brand new tournament
  const handleNewTournament = () => {
    if (
      !confirm(
        'האם לפתוח טורניר חדש? הנתונים הנוכחיים יוחלפו בלוח ריק (מומלץ לוודא ששמרתם או גיביתם קודם).'
      )
    ) {
      return;
    }

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

    const freshTournament: Tournament = {
      id: newId,
      title: 'טורניר כדורעף חופים כ"ח ת"א',
      date: new Date().toISOString().split('T')[0],
      scheduleMode: 'auto',
      targetScore: 21,
      groups: blankGroups,
      matches: [],
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
        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-1 w-full max-w-md">
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
              <span>1. הגדרת בתים</span>
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
              <span>2. לוח משחקים</span>
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
            onAddMatch={handleAddManualMatch}
            onDeleteMatch={handleDeleteMatch}
            onOpenManualModal={() => setIsManualModalOpen(true)}
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
          <span>הגדרות</span>
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
          <span>משחקים</span>
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
