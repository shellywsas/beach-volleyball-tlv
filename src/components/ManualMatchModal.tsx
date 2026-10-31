import React, { useState } from 'react';
import { Tournament, Match, Group, Team } from '../types';
import { X, Plus, Shield } from 'lucide-react';

interface ManualMatchModalProps {
  tournament: Tournament;
  isOpen: boolean;
  onClose: () => void;
  onAddMatch: (match: Match) => void;
}

export const ManualMatchModal: React.FC<ManualMatchModalProps> = ({
  tournament,
  isOpen,
  onClose,
  onAddMatch,
}) => {
  if (!isOpen) return null;

  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    tournament.groups[0]?.id || ''
  );

  const currentGroup = tournament.groups.find((g) => g.id === selectedGroupId) || tournament.groups[0];
  const teams = currentGroup?.teams || [];

  const [team1Id, setTeam1Id] = useState<string>(teams[0]?.id || '');
  const [team2Id, setTeam2Id] = useState<string>(teams[1]?.id || '');
  const [court, setCourt] = useState<string>('מגרש 1');

  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    const grp = tournament.groups.find((g) => g.id === groupId);
    if (grp && grp.teams.length >= 2) {
      setTeam1Id(grp.teams[0].id);
      setTeam2Id(grp.teams[1].id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!team1Id || !team2Id || team1Id === team2Id) {
      alert('יש לבחור שני זוגות שונים למשחק!');
      return;
    }

    const nextMatchNumber = tournament.matches.length + 1;

    const newMatch: Match = {
      id: `manual_m_${Date.now()}`,
      groupId: currentGroup.id,
      groupName: currentGroup.name,
      matchNumber: nextMatchNumber,
      team1Id,
      team2Id,
      score1: null,
      score2: null,
      isFinished: false,
      court: court.trim() || undefined,
    };

    onAddMatch(newMatch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-tlv-pink/20 text-tlv-pink flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-tlv-navy">הוספת משחק ידני</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Select Group */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              בחר בית:
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => handleGroupChange(e.target.value)}
              className="w-full text-sm font-bold px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:border-tlv-pink focus:outline-none"
            >
              {tournament.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.teams.length} זוגות)
                </option>
              ))}
            </select>
          </div>

          {/* Select Team 1 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              זוג ראשון (קבוצה 1):
            </label>
            <select
              value={team1Id}
              onChange={(e) => setTeam1Id(e.target.value)}
              className="w-full text-sm font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-tlv-pink focus:outline-none"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  זוג {t.number}: {[t.player1, t.player2].filter(Boolean).join(' ו-') || 'ללא שמות'}
                </option>
              ))}
            </select>
          </div>

          {/* Select Team 2 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              זוג שני (קבוצה 2):
            </label>
            <select
              value={team2Id}
              onChange={(e) => setTeam2Id(e.target.value)}
              className="w-full text-sm font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-tlv-pink focus:outline-none"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id} disabled={t.id === team1Id}>
                  זוג {t.number}: {[t.player1, t.player2].filter(Boolean).join(' ו-') || 'ללא שמות'}
                  {t.id === team1Id ? ' (נבחר כזוג ראשון)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Court */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              מגרש (אופציונלי):
            </label>
            <input
              type="text"
              value={court}
              onChange={(e) => setCourt(e.target.value)}
              placeholder="לדוגמה: מגרש 1, מגרש מרכזי"
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-tlv-pink focus:outline-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-tlv-pink hover:bg-tlv-pinkHover text-white shadow-md transition-all"
            >
              הוסף משחק ללוח
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
