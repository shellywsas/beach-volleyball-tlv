import React, { useState } from 'react';
import { Tournament, Match, Group, Team } from '../types';
import { Trophy, CheckCircle2, RotateCcw, Plus, Trash2, ChevronDown, Filter, Edit3 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MatchesTabProps {
  tournament: Tournament;
  onUpdateMatch: (match: Match) => void;
  onAddMatch: (match: Match) => void;
  onDeleteMatch: (matchId: string) => void;
  onOpenManualModal: () => void;
}

export const MatchesTab: React.FC<MatchesTabProps> = ({
  tournament,
  onUpdateMatch,
  onAddMatch,
  onDeleteMatch,
  onOpenManualModal,
}) => {
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [editingScores, setEditingScores] = useState<Record<string, { s1: number; s2: number }>>({});

  const groupsMap = new Map<string, Group>();
  const teamsMap = new Map<string, { team: Team; groupName: string }>();

  tournament.groups.forEach((g) => {
    groupsMap.set(g.id, g);
    g.teams.forEach((t) => {
      teamsMap.set(t.id, { team: t, groupName: g.name });
    });
  });

  const getTeamLabel = (teamId: string) => {
    const data = teamsMap.get(teamId);
    if (!data) return 'זוג לא ידוע';
    const names = [data.team.player1, data.team.player2].filter(Boolean).join(' ו-') || 'ללא שמות';
    return {
      number: data.team.number,
      names,
      groupName: data.groupName,
    };
  };

  const filteredMatches = tournament.matches.filter((m) => {
    if (selectedGroupFilter === 'all') return true;
    return m.groupId === selectedGroupFilter;
  });

  const finishedCount = tournament.matches.filter((m) => m.isFinished).length;
  const totalCount = tournament.matches.length;

  const handleScoreChange = (matchId: string, team: 1 | 2, delta: number) => {
    const match = tournament.matches.find((m) => m.id === matchId);
    if (!match) return;

    const currentS1 = editingScores[matchId]?.s1 ?? match.score1 ?? 0;
    const currentS2 = editingScores[matchId]?.s2 ?? match.score2 ?? 0;

    let newS1 = currentS1;
    let newS2 = currentS2;

    if (team === 1) {
      newS1 = Math.max(0, currentS1 + delta);
    } else {
      newS2 = Math.max(0, currentS2 + delta);
    }

    setEditingScores({
      ...editingScores,
      [matchId]: { s1: newS1, s2: newS2 },
    });
  };

  const handleSetExactScore = (matchId: string, team: 1 | 2, valStr: string) => {
    const val = parseInt(valStr, 10);
    const validVal = isNaN(val) ? 0 : Math.max(0, val);

    const match = tournament.matches.find((m) => m.id === matchId);
    if (!match) return;

    const currentS1 = editingScores[matchId]?.s1 ?? match.score1 ?? 0;
    const currentS2 = editingScores[matchId]?.s2 ?? match.score2 ?? 0;

    setEditingScores({
      ...editingScores,
      [matchId]: {
        s1: team === 1 ? validVal : currentS1,
        s2: team === 2 ? validVal : currentS2,
      },
    });
  };

  const handleFinishMatch = (match: Match) => {
    const scores = editingScores[match.id] || {
      s1: match.score1 ?? 0,
      s2: match.score2 ?? 0,
    };

    if (scores.s1 === scores.s2) {
      alert('בכדורעף חופים אין תיקו! אחד הזוגות חייב לנצח.');
      return;
    }

    const updated: Match = {
      ...match,
      score1: scores.s1,
      score2: scores.s2,
      isFinished: true,
    };

    // Trigger celebratory confetti
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#E91E63', '#22C8D6', '#FFDF00'],
    });

    onUpdateMatch(updated);
  };

  const handleReopenMatch = (match: Match) => {
    const updated: Match = {
      ...match,
      isFinished: false,
    };
    setEditingScores({
      ...editingScores,
      [match.id]: { s1: match.score1 ?? 0, s2: match.score2 ?? 0 },
    });
    onUpdateMatch(updated);
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Top Banner & Progress */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-tlv-navy flex items-center gap-2">
              🏐 לוח משחקים ותוצאות בזמן אמת
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              הזינו את תוצאות המשחקים בקלות באמצעות כפתורי ה-+/- הגדולים. הטבלה תתעדכן מעצמה!
            </p>
          </div>

          {/* Progress bar */}
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 min-w-[200px]">
            <div className="flex items-center justify-between text-xs font-black text-slate-700 mb-1.5">
              <span>התקדמות הטורניר:</span>
              <span className="text-tlv-pink">
                {finishedCount} מתוך {totalCount} משחקים
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-tlv-teal to-tlv-pink h-full transition-all duration-500 rounded-full"
                style={{
                  width: totalCount > 0 ? `${(finishedCount / totalCount) * 100}%` : '0%',
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Filter bar & Add Match */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setSelectedGroupFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                selectedGroupFilter === 'all'
                  ? 'bg-tlv-navy text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              כל הבתים ({tournament.matches.length})
            </button>
            {tournament.groups.map((group) => {
              const groupMatchesCount = tournament.matches.filter((m) => m.groupId === group.id).length;
              return (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupFilter(group.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                    selectedGroupFilter === group.id
                      ? 'bg-tlv-pink text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {group.name} ({groupMatchesCount})
                </button>
              );
            })}
          </div>

          <button
            onClick={onOpenManualModal}
            className="flex items-center gap-1.5 bg-tlv-teal/20 hover:bg-tlv-teal/30 text-tlv-navy border border-tlv-teal/40 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-tlv-tealDark" />
            <span>הוספת משחק ידני</span>
          </button>
        </div>
      </div>

      {/* Match Cards List */}
      {filteredMatches.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
          <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">אין משחקים להצגה כרגע</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            עבור ללשונית "הגדרת טורניר" ולחץ על "יצירת לוח המשחקים", או לחץ על "הוספת משחק ידני" כאן למעלה.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((match) => {
            const team1 = getTeamLabel(match.team1Id);
            const team2 = getTeamLabel(match.team2Id);

            const s1 = editingScores[match.id]?.s1 ?? match.score1 ?? 0;
            const s2 = editingScores[match.id]?.s2 ?? match.score2 ?? 0;

            const isTeam1Winner = match.isFinished && (match.score1 ?? 0) > (match.score2 ?? 0);
            const isTeam2Winner = match.isFinished && (match.score2 ?? 0) > (match.score1 ?? 0);

            return (
              <div
                key={match.id}
                className={`bg-white rounded-3xl p-4 md:p-5 shadow-sm border-2 transition-all ${
                  match.isFinished
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : 'border-slate-200 hover:border-tlv-teal/50'
                }`}
              >
                {/* Match Header Badge */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black bg-tlv-navy text-tlv-yellow px-2.5 py-1 rounded-xl">
                      משחק {match.matchNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                      {match.groupName}
                    </span>
                    {match.court && (
                      <span className="text-xs font-semibold text-tlv-tealDark bg-teal-50 px-2 py-0.5 rounded-lg">
                        {match.court}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {match.isFinished ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        הסתיים
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                        טרם שוחק
                      </span>
                    )}

                    <button
                      onClick={() => onDeleteMatch(match.id)}
                      className="text-slate-300 hover:text-red-500 p-1 transition-colors"
                      title="מחיקת משחק"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Match Teams and Scoring Grid */}
                <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
                  {/* Team 1 Side */}
                  <div
                    className={`md:col-span-5 p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                      isTeam1Winner
                        ? 'bg-emerald-50 border-emerald-400 shadow-sm ring-1 ring-emerald-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-block text-xs font-black text-tlv-navy bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        זוג מספר {team1.number}
                      </span>
                      {isTeam1Winner && (
                        <span className="flex items-center gap-1 text-xs font-black text-emerald-600 bg-white px-2 py-0.5 rounded-full shadow-xs">
                          <Trophy className="w-3.5 h-3.5 text-tlv-yellow fill-tlv-yellow" />
                          ניצחון!
                        </span>
                      )}
                    </div>

                    <div className="font-black text-base md:text-lg text-tlv-navy mb-3 line-clamp-2">
                      {team1.names}
                    </div>

                    {/* Team 1 Score Controls */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleScoreChange(match.id, 1, -1)}
                          disabled={match.isFinished}
                          className="w-9 h-9 rounded-xl bg-white hover:bg-slate-200 disabled:opacity-40 font-black text-slate-700 shadow-sm border border-slate-300 text-base active:scale-95 transition-all"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => handleScoreChange(match.id, 1, 1)}
                          disabled={match.isFinished}
                          className="w-10 h-10 rounded-xl bg-tlv-pink hover:bg-tlv-pinkHover disabled:opacity-40 font-black text-white shadow-md text-lg active:scale-95 transition-all"
                        >
                          +1
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={s1}
                          disabled={match.isFinished}
                          onChange={(e) => handleSetExactScore(match.id, 1, e.target.value)}
                          className="w-16 h-12 text-center text-2xl font-black rounded-xl bg-white border-2 border-slate-300 focus:border-tlv-pink focus:outline-none shadow-inner"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Center VS Divider */}
                  <div className="md:col-span-1 text-center py-1">
                    <span className="inline-block px-2.5 py-1 rounded-full bg-slate-200 text-slate-600 font-black text-xs">
                      נגד
                    </span>
                  </div>

                  {/* Team 2 Side */}
                  <div
                    className={`md:col-span-5 p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                      isTeam2Winner
                        ? 'bg-emerald-50 border-emerald-400 shadow-sm ring-1 ring-emerald-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-block text-xs font-black text-tlv-navy bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        זוג מספר {team2.number}
                      </span>
                      {isTeam2Winner && (
                        <span className="flex items-center gap-1 text-xs font-black text-emerald-600 bg-white px-2 py-0.5 rounded-full shadow-xs">
                          <Trophy className="w-3.5 h-3.5 text-tlv-yellow fill-tlv-yellow" />
                          ניצחון!
                        </span>
                      )}
                    </div>

                    <div className="font-black text-base md:text-lg text-tlv-navy mb-3 line-clamp-2">
                      {team2.names}
                    </div>

                    {/* Team 2 Score Controls */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleScoreChange(match.id, 2, -1)}
                          disabled={match.isFinished}
                          className="w-9 h-9 rounded-xl bg-white hover:bg-slate-200 disabled:opacity-40 font-black text-slate-700 shadow-sm border border-slate-300 text-base active:scale-95 transition-all"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => handleScoreChange(match.id, 2, 1)}
                          disabled={match.isFinished}
                          className="w-10 h-10 rounded-xl bg-tlv-pink hover:bg-tlv-pinkHover disabled:opacity-40 font-black text-white shadow-md text-lg active:scale-95 transition-all"
                        >
                          +1
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={s2}
                          disabled={match.isFinished}
                          onChange={(e) => handleSetExactScore(match.id, 2, e.target.value)}
                          className="w-16 h-12 text-center text-2xl font-black rounded-xl bg-white border-2 border-slate-300 focus:border-tlv-pink focus:outline-none shadow-inner"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Match Bottom Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  {!match.isFinished ? (
                    <button
                      type="button"
                      onClick={() => handleFinishMatch(match)}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm px-6 py-2.5 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>שמירת תוצאה וסיום משחק</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleReopenMatch(match)}
                      className="text-xs text-slate-500 hover:text-tlv-pink flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all font-bold"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>עריכת תוצאה מחדש</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
