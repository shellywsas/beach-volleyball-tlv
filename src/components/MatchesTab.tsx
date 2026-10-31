import React, { useState } from 'react';
import { Tournament, Match, Group, Team, TournamentFinals } from '../types';
import { calculateGroupStandings } from '../utils/standings';
import {
  Trophy,
  CheckCircle2,
  RotateCcw,
  Plus,
  Trash2,
  Clock,
  FileText,
  Flame,
  Medal,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MatchesTabProps {
  tournament: Tournament;
  onUpdateMatch: (match: Match) => void;
  onUpdateFinalsMatch: (match: Match) => void;
  onAddMatch: (match: Match) => void;
  onDeleteMatch: (matchId: string) => void;
  onOpenManualModal: () => void;
  onOpenReportModal: () => void;
  onSyncFinalsTeams: () => void;
}

export const MatchesTab: React.FC<MatchesTabProps> = ({
  tournament,
  onUpdateMatch,
  onUpdateFinalsMatch,
  onAddMatch,
  onDeleteMatch,
  onOpenManualModal,
  onOpenReportModal,
  onSyncFinalsTeams,
}) => {
  const [activeStageFilter, setActiveStageFilter] = useState<'groups' | 'finals'>('groups');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');

  const groupsMap = new Map<string, Group>();
  const teamsMap = new Map<string, { team: Team; groupName: string }>();

  tournament.groups.forEach((g) => {
    groupsMap.set(g.id, g);
    g.teams.forEach((t) => {
      teamsMap.set(t.id, { team: t, groupName: g.name });
    });
  });

  const getTeamDisplay = (teamId: string, fallbackLabel?: string) => {
    if (!teamId) {
      return {
        number: '',
        names: fallbackLabel || 'טרם נקבע',
        groupName: '',
      };
    }
    const data = teamsMap.get(teamId);
    if (!data) {
      return {
        number: '',
        names: fallbackLabel || 'טרם נקבע',
        groupName: '',
      };
    }
    const names = [data.team.player1, data.team.player2].filter(Boolean).join(' ו-') || 'ללא שמות';
    return {
      number: `זוג ${data.team.number}`,
      names,
      groupName: data.groupName,
    };
  };

  // Group Matches
  const filteredGroupMatches = tournament.matches.filter((m) => {
    if (selectedGroupFilter === 'all') return true;
    return m.groupId === selectedGroupFilter;
  });

  const finishedGroupMatches = tournament.matches.filter((m) => m.isFinished).length;
  const totalGroupMatches = tournament.matches.length;

  // Finals Matches
  const finalsMatches = tournament.finals?.matches || [];
  const finishedFinalsMatches = finalsMatches.filter((m) => m.isFinished).length;

  // Quick Direct Score Update: user simply writes "כמה כמה"
  const handleScoreInput = (
    match: Match,
    isFinals: boolean,
    field: 'score1' | 'score2',
    valStr: string
  ) => {
    const val = valStr === '' ? null : parseInt(valStr, 10);
    const validVal = val === null || isNaN(val) ? null : Math.max(0, val);

    const updated: Match = {
      ...match,
      [field]: validVal,
    };

    // Auto finish if both scores are entered and not equal
    if (
      updated.score1 !== null &&
      updated.score2 !== null &&
      updated.score1 !== updated.score2
    ) {
      updated.isFinished = true;
    } else if (updated.score1 === null || updated.score2 === null) {
      updated.isFinished = false;
    }

    if (isFinals) {
      onUpdateFinalsMatch(updated);
    } else {
      onUpdateMatch(updated);
    }
  };

  // Quick update match time
  const handleTimeChange = (match: Match, isFinals: boolean, newTime: string) => {
    const updated: Match = {
      ...match,
      time: newTime,
    };
    if (isFinals) {
      onUpdateFinalsMatch(updated);
    } else {
      onUpdateMatch(updated);
    }
  };

  // Quick preset score buttons (21-15, 21-18, 21-19, 15-13)
  const handleSetPresetScore = (
    match: Match,
    isFinals: boolean,
    s1: number,
    s2: number
  ) => {
    const updated: Match = {
      ...match,
      score1: s1,
      score2: s2,
      isFinished: true,
    };

    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#E91E63', '#22C8D6', '#FFDF00'],
    });

    if (isFinals) {
      onUpdateFinalsMatch(updated);
    } else {
      onUpdateMatch(updated);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Top Banner with Direct Action for PDF Report */}
      <div className="bg-gradient-to-r from-tlv-navy to-tlv-navyLight text-white rounded-3xl p-5 shadow-xl border border-tlv-teal/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-tlv-pink px-2.5 py-0.5 rounded-full text-xs font-black">
                עדכון תוצאות מהיר
              </span>
              <span className="text-xs text-tlv-teal font-semibold">
                כותבים רק "כמה-כמה" והטבלה מתעדכנת מיד!
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black">
              לוח משחקים, שעות ותוצאות
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenReportModal}
              className="flex items-center gap-2 bg-gradient-to-r from-tlv-pink to-pink-600 hover:brightness-110 text-white px-4 py-2.5 rounded-2xl text-xs md:text-sm font-black shadow-lg transition-all active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>הפקת דוח PDF והכתרת מנצחים 🏆</span>
            </button>
          </div>
        </div>

        {/* Stage Tabs (שלב הבתים / שלב הגמר) */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => setActiveStageFilter('groups')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeStageFilter === 'groups'
                ? 'bg-tlv-pink text-white shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <span>שלב הבתים</span>
            <span className="bg-black/20 px-2 py-0.5 rounded-full text-[11px]">
              {finishedGroupMatches}/{totalGroupMatches}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStageFilter('finals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeStageFilter === 'finals'
                ? 'bg-amber-400 text-slate-900 shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>שלב הגמר והפלייאוף</span>
            <span className="bg-black/20 px-2 py-0.5 rounded-full text-[11px]">
              {finishedFinalsMatches}/{finalsMatches.length}
            </span>
          </button>
        </div>
      </div>

      {/* VIEW 1: GROUPS STAGE MATCHES */}
      {activeStageFilter === 'groups' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-3 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              <button
                onClick={() => setSelectedGroupFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                  selectedGroupFilter === 'all'
                    ? 'bg-tlv-navy text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                כל הבתים ({tournament.matches.length})
              </button>
              {tournament.groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupFilter(group.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                    selectedGroupFilter === group.id
                      ? 'bg-tlv-pink text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {group.name}
                </button>
              ))}
            </div>

            <button
              onClick={onOpenManualModal}
              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>הוסף משחק +</span>
            </button>
          </div>

          {/* Group Matches Cards List */}
          {filteredGroupMatches.map((match) => {
            const team1 = getTeamDisplay(match.team1Id, match.team1Label);
            const team2 = getTeamDisplay(match.team2Id, match.team2Label);

            const isTeam1Winner = match.isFinished && (match.score1 ?? 0) > (match.score2 ?? 0);
            const isTeam2Winner = match.isFinished && (match.score2 ?? 0) > (match.score1 ?? 0);

            return (
              <div
                key={match.id}
                className={`bg-white rounded-3xl p-4 sm:p-5 shadow-sm border-2 transition-all ${
                  match.isFinished
                    ? 'border-emerald-300 bg-emerald-50/15'
                    : 'border-slate-200 hover:border-tlv-teal/50'
                }`}
              >
                {/* Match Top Bar: Number, Group, Court & Editable Time */}
                <div className="flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black bg-tlv-navy text-tlv-yellow px-2.5 py-1 rounded-xl">
                      משחק {match.matchNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
                      {match.groupName}
                    </span>
                    {match.court && (
                      <span className="text-xs font-semibold text-tlv-tealDark bg-teal-50 px-2 py-0.5 rounded-lg hidden sm:inline">
                        {match.court}
                      </span>
                    )}
                  </div>

                  {/* Time field (editable on the fly) */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-500">שעה:</span>
                      <input
                        type="time"
                        value={match.time || '09:00'}
                        onChange={(e) => handleTimeChange(match, false, e.target.value)}
                        className="bg-transparent text-xs font-mono font-bold text-slate-800 focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={() => onDeleteMatch(match.id)}
                      className="text-slate-300 hover:text-red-500 p-1 transition-colors"
                      title="מחק משחק"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Score Row: Direct "כמה כמה" entry */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* Team 1 Box */}
                  <div
                    className={`md:col-span-5 p-3 rounded-2xl border-2 transition-all ${
                      isTeam1Winner
                        ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-black text-tlv-navy bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {team1.number}
                      </span>
                      {isTeam1Winner && (
                        <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          ניצחון!
                        </span>
                      )}
                    </div>
                    <div className="font-black text-base text-tlv-navy line-clamp-1">
                      {team1.names}
                    </div>
                  </div>

                  {/* Center: "כמה כמה" score inputs */}
                  <div className="md:col-span-2 flex flex-col items-center justify-center py-1">
                    <span className="text-[11px] font-bold text-slate-400 mb-1">תוצאה (כמה-כמה):</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="0"
                        value={match.score1 ?? ''}
                        onChange={(e) => handleScoreInput(match, false, 'score1', e.target.value)}
                        className="w-14 h-12 text-center text-xl font-black rounded-xl bg-white border-2 border-slate-300 focus:border-tlv-pink focus:outline-none shadow-inner"
                      />
                      <span className="text-xl font-black text-slate-400">:</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={match.score2 ?? ''}
                        onChange={(e) => handleScoreInput(match, false, 'score2', e.target.value)}
                        className="w-14 h-12 text-center text-xl font-black rounded-xl bg-white border-2 border-slate-300 focus:border-tlv-pink focus:outline-none shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Team 2 Box */}
                  <div
                    className={`md:col-span-5 p-3 rounded-2xl border-2 transition-all ${
                      isTeam2Winner
                        ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-black text-tlv-navy bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {team2.number}
                      </span>
                      {isTeam2Winner && (
                        <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          ניצחון!
                        </span>
                      )}
                    </div>
                    <div className="font-black text-base text-tlv-navy line-clamp-1">
                      {team2.names}
                    </div>
                  </div>
                </div>

                {/* Bottom Quick Preset Scores & Status */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <span>תוצאות נפוצות:</span>
                    <button
                      type="button"
                      onClick={() => handleSetPresetScore(match, false, 21, 18)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-mono"
                    >
                      21-18
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPresetScore(match, false, 21, 15)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-mono"
                    >
                      21-15
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPresetScore(match, false, 21, 19)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-mono"
                    >
                      21-19
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPresetScore(match, false, 15, 13)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-mono"
                    >
                      15-13
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {match.isFinished ? (
                      <span className="text-emerald-700 font-black text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        תוצאה נשמרה
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">הקלד תוצאה לסיום</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: FINALS STAGE (חצי גמר, מקום 3, גמר) */}
      {activeStageFilter === 'finals' && (
        <div className="space-y-4">
          {/* Finals Header Action */}
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-amber-950 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-600" />
                שלב הפלייאוף והגמר הגדול
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                תוכלו למלא תוך כדי שהמשחקים מתקיימים, או לסנכרן אוטומטית את העולים מהבתים בלחיצה:
              </p>
            </div>

            <button
              type="button"
              onClick={onSyncFinalsTeams}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black px-3.5 py-2 rounded-xl text-xs shadow-sm transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>סנכרון עולים מהבתים לגמר 🔄</span>
            </button>
          </div>

          {/* Finals Matches List */}
          {finalsMatches.map((match) => {
            const team1 = getTeamDisplay(match.team1Id, match.team1Label);
            const team2 = getTeamDisplay(match.team2Id, match.team2Label);

            const isTeam1Winner = match.isFinished && (match.score1 ?? 0) > (match.score2 ?? 0);
            const isTeam2Winner = match.isFinished && (match.score2 ?? 0) > (match.score1 ?? 0);

            const isGrandFinal = match.stage === 'final';

            return (
              <div
                key={match.id}
                className={`bg-white rounded-3xl p-4 sm:p-5 shadow-md border-2 transition-all ${
                  isGrandFinal
                    ? 'border-amber-400 bg-amber-50/20 ring-2 ring-amber-300/40'
                    : 'border-slate-200'
                }`}
              >
                {/* Match Header */}
                <div className="flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-black text-xs px-3 py-1 rounded-xl shadow-xs ${
                        isGrandFinal
                          ? 'bg-amber-400 text-slate-900 font-black'
                          : 'bg-tlv-navy text-tlv-teal'
                      }`}
                    >
                      {match.stageName || match.groupName}
                    </span>
                    {match.court && (
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                        {match.court}
                      </span>
                    )}
                  </div>

                  {/* Time field */}
                  <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500">שעה:</span>
                    <input
                      type="time"
                      value={match.time || '12:00'}
                      onChange={(e) => handleTimeChange(match, true, e.target.value)}
                      className="bg-transparent text-xs font-mono font-bold text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Score Input Row */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* Team 1 Side */}
                  <div
                    className={`md:col-span-5 p-3 rounded-2xl border-2 transition-all ${
                      isTeam1Winner
                        ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-500">
                        {match.team1Label || 'זוג 1'}
                      </span>
                      {isTeam1Winner && (
                        <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          ניצחון!
                        </span>
                      )}
                    </div>
                    <div className="font-black text-base text-tlv-navy line-clamp-1">
                      {team1.names}
                    </div>
                  </div>

                  {/* Center "כמה כמה" inputs */}
                  <div className="md:col-span-2 flex flex-col items-center justify-center py-1">
                    <span className="text-[11px] font-bold text-slate-400 mb-1">תוצאה:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="0"
                        value={match.score1 ?? ''}
                        onChange={(e) => handleScoreInput(match, true, 'score1', e.target.value)}
                        className="w-14 h-12 text-center text-xl font-black rounded-xl bg-white border-2 border-slate-300 focus:border-tlv-pink focus:outline-none shadow-inner"
                      />
                      <span className="text-xl font-black text-slate-400">:</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={match.score2 ?? ''}
                        onChange={(e) => handleScoreInput(match, true, 'score2', e.target.value)}
                        className="w-14 h-12 text-center text-xl font-black rounded-xl bg-white border-2 border-slate-300 focus:border-tlv-pink focus:outline-none shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Team 2 Side */}
                  <div
                    className={`md:col-span-5 p-3 rounded-2xl border-2 transition-all ${
                      isTeam2Winner
                        ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-500">
                        {match.team2Label || 'זוג 2'}
                      </span>
                      {isTeam2Winner && (
                        <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          ניצחון!
                        </span>
                      )}
                    </div>
                    <div className="font-black text-base text-tlv-navy line-clamp-1">
                      {team2.names}
                    </div>
                  </div>
                </div>

                {/* Bottom Presets */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <span>תוצאות נפוצות:</span>
                    <button
                      type="button"
                      onClick={() => handleSetPresetScore(match, true, 21, 18)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-mono"
                    >
                      21-18
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPresetScore(match, true, 21, 15)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-mono"
                    >
                      21-15
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPresetScore(match, true, 21, 19)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-mono"
                    >
                      21-19
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {match.isFinished ? (
                      <span className="text-emerald-700 font-black text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        תוצאה נשמרה
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">הקלד תוצאה לסיום</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
