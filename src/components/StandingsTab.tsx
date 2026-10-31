import React from 'react';
import { Tournament, Group } from '../types';
import { calculateGroupStandings } from '../utils/standings';
import { Trophy, Medal, Share2, Copy, Check, Info } from 'lucide-react';

interface StandingsTabProps {
  tournament: Tournament;
}

export const StandingsTab: React.FC<StandingsTabProps> = ({ tournament }) => {
  const [copiedGroup, setCopiedGroup] = React.useState<string | null>(null);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-black text-xs shadow-md border-2 border-white">
            🥇 1
          </span>
        );
      case 2:
        return (
          <span className="w-7 h-7 rounded-full bg-slate-300 text-slate-800 flex items-center justify-center font-black text-xs shadow-md border-2 border-white">
            🥈 2
          </span>
        );
      case 3:
        return (
          <span className="w-7 h-7 rounded-full bg-amber-700 text-white flex items-center justify-center font-black text-xs shadow-md border-2 border-white">
            🥉 3
          </span>
        );
      default:
        return (
          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
            {rank}
          </span>
        );
    }
  };

  const copyGroupWhatsAppSummary = (group: Group) => {
    const standings = calculateGroupStandings(group, tournament.matches);
    let text = `🏐 *כ"ח תל אביב - מצב ${group.name}* 🏐\n טורניר: ${tournament.title}\n-------------------------\n`;

    standings.forEach((st) => {
      const medal = st.rank === 1 ? '🥇' : st.rank === 2 ? '🥈' : st.rank === 3 ? '🥉' : `${st.rank}.`;
      text += `${medal} זוג ${st.teamNumber} (${st.playerNames})\n   ניצחונות: ${st.won} | הפסדים: ${st.lost} | הפרש נק': ${st.pointDiff > 0 ? '+' : ''}${st.pointDiff} | נק': ${st.tablePoints}\n`;
    });

    text += `\nמועדון כדורעף חופים כ"ח ת"א ע"ש רועי פלס 💙`;

    navigator.clipboard.writeText(text);
    setCopiedGroup(group.id);
    setTimeout(() => setCopiedGroup(null), 3000);
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Intro Header */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-tlv-navy flex items-center gap-2">
            🏆 טבלאות בתים ודירוג חי
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            הדירוג מחושב אוטומטית לפי: ניצחונות ← הפרש נקודות ← נקודות זכות
          </p>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 text-amber-900 border border-amber-200/60 px-3.5 py-2 rounded-2xl text-xs font-bold">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>מתעדכן בזמן אמת עם סיום כל משחק!</span>
        </div>
      </div>

      {/* Group Standings Tables */}
      <div className="space-y-6">
        {tournament.groups.map((group) => {
          const standings = calculateGroupStandings(group, tournament.matches);
          const groupMatches = tournament.matches.filter((m) => m.groupId === group.id);
          const finishedMatches = groupMatches.filter((m) => m.isFinished);
          const isGroupCompleted = groupMatches.length > 0 && finishedMatches.length === groupMatches.length;

          return (
            <div
              key={group.id}
              className="bg-white rounded-3xl shadow-sm border-2 border-slate-200 overflow-hidden"
            >
              {/* Group Header bar */}
              <div className="bg-gradient-to-r from-tlv-navy to-tlv-navyLight text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-tlv-pink text-white font-black text-lg flex items-center justify-center shadow-md">
                    {group.name.replace('בית ', '').replace("'", '')}
                  </div>
                  <div>
                    <h3 className="text-lg font-black">{group.name}</h3>
                    <p className="text-xs text-tlv-teal font-medium">
                      {finishedMatches.length} מתוך {groupMatches.length} משחקים הושלמו
                      {isGroupCompleted && ' • 🏁 הבית הסתיים!'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => copyGroupWhatsAppSummary(group)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all self-start sm:self-auto"
                >
                  {copiedGroup === group.id ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>הועתק לוואטסאפ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>העתק טבלה לוואטסאפ</span>
                    </>
                  )}
                </button>
              </div>

              {/* Responsive Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] md:text-xs font-black text-slate-600">
                      <th className="py-3 px-3 w-12 text-center">מיקום</th>
                      <th className="py-3 px-3">זוג ושמות השחקנים</th>
                      <th className="py-3 px-2 text-center">מש'</th>
                      <th className="py-3 px-2 text-center text-emerald-700">ניצ'</th>
                      <th className="py-3 px-2 text-center text-rose-600">הפס'</th>
                      <th className="py-3 px-2 text-center hidden md:table-cell">זכות</th>
                      <th className="py-3 px-2 text-center hidden md:table-cell">חובה</th>
                      <th className="py-3 px-2 text-center font-bold">הפרש נק'</th>
                      <th className="py-3 px-3 text-center text-tlv-navy font-black text-sm">נקודות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
                    {standings.map((st) => (
                      <tr
                        key={st.teamId}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          st.rank === 1 ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex justify-center">{getRankBadge(st.rank || 0)}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-tlv-pink bg-pink-100 px-2 py-0.5 rounded-md">
                              זוג {st.teamNumber}
                            </span>
                            <span className="font-black text-slate-800">{st.playerNames}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-2 text-center font-semibold text-slate-700">
                          {st.played}
                        </td>
                        <td className="py-3.5 px-2 text-center font-black text-emerald-600">
                          {st.won}
                        </td>
                        <td className="py-3.5 px-2 text-center font-black text-rose-500">
                          {st.lost}
                        </td>
                        <td className="py-3.5 px-2 text-center font-mono text-slate-600 hidden md:table-cell">
                          {st.pointsFor}
                        </td>
                        <td className="py-3.5 px-2 text-center font-mono text-slate-600 hidden md:table-cell">
                          {st.pointsAgainst}
                        </td>
                        <td className="py-3.5 px-2 text-center font-black font-mono">
                          <span
                            className={
                              st.pointDiff > 0
                                ? 'text-emerald-600'
                                : st.pointDiff < 0
                                ? 'text-rose-500'
                                : 'text-slate-500'
                            }
                          >
                            {st.pointDiff > 0 ? `+${st.pointDiff}` : st.pointDiff}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="font-black text-base text-tlv-navy bg-slate-100 px-2.5 py-1 rounded-xl">
                            {st.tablePoints}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
