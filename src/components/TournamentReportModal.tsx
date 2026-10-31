import React, { useRef, useState } from 'react';
import { Tournament, Match, Group, Team } from '../types';
import { calculateGroupStandings } from '../utils/standings';
import { Download, Printer, X, Trophy, Medal, Check, Clock, Calendar, Share2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface TournamentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
}

export const TournamentReportModal: React.FC<TournamentReportModalProps> = ({
  isOpen,
  onClose,
  tournament,
}) => {
  if (!isOpen) return null;

  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Teams lookup
  const teamsMap = new Map<string, { team: Team; groupName: string }>();
  tournament.groups.forEach((g) => {
    g.teams.forEach((t) => {
      teamsMap.set(t.id, { team: t, groupName: g.name });
    });
  });

  const getTeamNames = (teamId: string, fallbackLabel?: string) => {
    if (!teamId) return fallbackLabel || 'טרם נקבע';
    const data = teamsMap.get(teamId);
    if (!data) return fallbackLabel || 'טרם נקבע';
    return [data.team.player1, data.team.player2].filter(Boolean).join(' ו-') || `זוג ${data.team.number}`;
  };

  // Determine Champions from Finals if finished
  const finalsMatches = tournament.finals?.matches || [];
  const finalMatch = finalsMatches.find((m) => m.stage === 'final');
  const thirdMatch = finalsMatches.find((m) => m.stage === 'third_place');

  let championName = '';
  let runnerUpName = '';
  let thirdPlaceName = '';

  if (finalMatch && finalMatch.isFinished && finalMatch.score1 !== null && finalMatch.score2 !== null) {
    if (finalMatch.score1 > finalMatch.score2) {
      championName = getTeamNames(finalMatch.team1Id, finalMatch.team1Label);
      runnerUpName = getTeamNames(finalMatch.team2Id, finalMatch.team2Label);
    } else {
      championName = getTeamNames(finalMatch.team2Id, finalMatch.team2Label);
      runnerUpName = getTeamNames(finalMatch.team1Id, finalMatch.team1Label);
    }
  }

  if (thirdMatch && thirdMatch.isFinished && thirdMatch.score1 !== null && thirdMatch.score2 !== null) {
    if (thirdMatch.score1 > thirdMatch.score2) {
      thirdPlaceName = getTeamNames(thirdMatch.team1Id, thirdMatch.team1Label);
    } else {
      thirdPlaceName = getTeamNames(thirdMatch.team2Id, thirdMatch.team2Label);
    }
  }

  // If no finals played yet, take top teams from group standings
  if (!championName && tournament.groups.length > 0) {
    const groupAStandings = calculateGroupStandings(tournament.groups[0], tournament.matches);
    if (groupAStandings.length > 0 && groupAStandings[0].won > 0) {
      championName = `${groupAStandings[0].playerNames} (מוביל/ת ${tournament.groups[0].name})`;
    }
  }

  // Download PDF using html2canvas & jsPDF
  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width mm
      const pageHeight = 297; // A4 height mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `${tournament.title.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, '_')}_דוח_סיכום.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('Error generating PDF:', err);
      // Fallback to print
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyWhatsAppText = () => {
    let text = `🏐 *כ"ח תל אביב - דוח טורניר כדורעף חופים* 🏐\n`;
    text += `טורניר: *${tournament.title}*\nתאריך: ${tournament.date}\n`;
    text += `------------------------------------\n`;

    if (championName) {
      text += `🏆 *הכתרת המנצחים:* 🏆\n`;
      text += `🥇 מקום ראשון (אלופים): ${championName}\n`;
      if (runnerUpName) text += `🥈 מקום שני: ${runnerUpName}\n`;
      if (thirdPlaceName) text += `🥉 מקום שלישי: ${thirdPlaceName}\n`;
      text += `------------------------------------\n`;
    }

    text += `📊 *טבלאות הבתים:*\n`;
    tournament.groups.forEach((g) => {
      text += `\n*${g.name}:*\n`;
      const st = calculateGroupStandings(g, tournament.matches);
      st.forEach((s) => {
        text += `${s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : s.rank === 3 ? '🥉' : `${s.rank}.`} ${s.playerNames} | נצחונות: ${s.won} | הפרש: ${s.pointDiff > 0 ? '+' : ''}${s.pointDiff}\n`;
      });
    });

    text += `\nכ"ח ת"א - העמותה לכדורעף חופים ע"ש רועי פלס 💙`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 my-4 flex flex-col max-h-[92vh]">
        {/* Top Actions Bar (Sticky & Not in PDF export) */}
        <div className="p-4 bg-slate-100 rounded-t-3xl border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-tlv-pink" />
            <h3 className="text-base font-black text-tlv-navy">
              דוח טורניר, טבלת סיכום והכתרת מנצחים 🏆
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 bg-tlv-pink hover:bg-tlv-pinkHover text-white px-3.5 py-2 rounded-xl text-xs font-black shadow-md transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'מייצר קובץ PDF...' : 'הורדת קובץ PDF 📄'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-tlv-navy hover:bg-tlv-navyLight text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">הדפסה</span>
            </button>

            <button
              type="button"
              onClick={handleCopyWhatsAppText}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all"
            >
              {copiedText ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{copiedText ? 'הועתק!' : 'לוואטסאפ'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable PDF Area */}
        <div className="overflow-y-auto p-4 sm:p-8 flex-1 bg-white" id="printable-report">
          <div
            ref={reportRef}
            className="max-w-[760px] mx-auto bg-white p-6 sm:p-8 text-slate-800 space-y-6 border border-slate-200 rounded-2xl shadow-xs"
            dir="rtl"
          >
            {/* Report Header */}
            <div className="border-b-4 border-tlv-pink pb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/logo-white-bg.png"
                  alt={'כ"ח ת"א'}
                  className="w-16 h-16 object-contain"
                />
                <div>
                  <h1 className="text-2xl font-black text-tlv-navy leading-none">
                    כ"ח תל אביב
                  </h1>
                  <p className="text-xs font-bold text-tlv-pink mt-1">
                    העמותה לכדורעף חופים ע"ש רועי פלס
                  </p>
                  <p className="text-xs text-slate-500">
                    דוח רשמי ומעקב תוצאות טורניר
                  </p>
                </div>
              </div>

              <div className="text-left font-mono text-xs text-slate-600">
                <div className="font-black text-sm text-tlv-navy">{tournament.title}</div>
                <div>תאריך: {tournament.date}</div>
                <div>קוד: {tournament.id}</div>
              </div>
            </div>

            {/* 🏆 Crowning Champions Podium Card */}
            <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-2 border-amber-300 rounded-2xl p-5 text-center shadow-xs">
              <div className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                <Trophy className="w-4 h-4 fill-slate-900" />
                הכתרת מנצחי הטורניר
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-3">
                פודיום ואלופי כדורעף החופים 🏐
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center pt-2">
                {/* 2nd Place */}
                <div className="bg-white/90 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div className="text-2xl mb-1">🥈</div>
                  <div className="text-xs font-black text-slate-600">מקום שני (סגני אלופים)</div>
                  <div className="text-sm font-black text-slate-900 mt-1">
                    {runnerUpName || 'ממתין לסיום הגמר'}
                  </div>
                </div>

                {/* 1st Place */}
                <div className="bg-amber-100/90 p-3.5 rounded-xl border-2 border-amber-400 flex flex-col justify-between shadow-xs scale-105">
                  <div className="text-3xl mb-1">🥇</div>
                  <div className="text-xs font-black text-amber-900 uppercase">אלופי הטורניר!</div>
                  <div className="text-base font-black text-slate-900 mt-1">
                    {championName || 'טרם נקבע'}
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="bg-white/90 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div className="text-2xl mb-1">🥉</div>
                  <div className="text-xs font-black text-slate-600">מקום שלישי</div>
                  <div className="text-sm font-black text-slate-900 mt-1">
                    {thirdPlaceName || 'ממתין לסיום'}
                  </div>
                </div>
              </div>
            </div>

            {/* Table 1: Groups & Teams Structure */}
            <div>
              <h3 className="text-sm font-black text-tlv-navy mb-2 flex items-center gap-1.5 border-b pb-1">
                <span>📋</span>
                <span>סידור הבתים והזוגות המשתתפים:</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tournament.groups.map((group) => (
                  <div key={group.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                    <div className="font-black text-xs text-tlv-pink mb-1.5">
                      {group.name} ({group.teams.length} זוגות)
                    </div>
                    <ul className="text-xs space-y-1">
                      {group.teams.map((t) => (
                        <li key={t.id} className="flex items-center justify-between">
                          <span className="font-semibold text-slate-600">זוג {t.number}:</span>
                          <span className="font-bold text-slate-800">
                            {[t.player1, t.player2].filter(Boolean).join(' ו-') || 'ללא שמות'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Table 2: Matches Schedule & Scores (כמה כמה + שעות) */}
            <div>
              <h3 className="text-sm font-black text-tlv-navy mb-2 flex items-center justify-between border-b pb-1">
                <span className="flex items-center gap-1.5">
                  <span>🏐</span>
                  <span>לוח המשחקים, שעות ותוצאות (כמה כמה):</span>
                </span>
                <span className="text-[11px] font-normal text-slate-500">
                  מעקב שלב הבתים
                </span>
              </h3>

              <table className="w-full text-right text-xs border border-slate-200 border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                    <th className="p-2 w-12 text-center">מש'</th>
                    <th className="p-2 w-16 text-center">שעה</th>
                    <th className="p-2 w-16">בית</th>
                    <th className="p-2">זוג 1</th>
                    <th className="p-2 w-20 text-center bg-pink-50 font-black text-tlv-pink">תוצאה</th>
                    <th className="p-2">זוג 2</th>
                    <th className="p-2 w-16 text-center">סטטוס</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {tournament.matches.map((m) => {
                    const t1Name = getTeamNames(m.team1Id, m.team1Label);
                    const t2Name = getTeamNames(m.team2Id, m.team2Label);
                    const scoreText =
                      m.score1 !== null && m.score2 !== null
                        ? `${m.score1} - ${m.score2}`
                        : '-';

                    return (
                      <tr key={m.id} className={m.isFinished ? 'bg-emerald-50/20' : ''}>
                        <td className="p-2 text-center font-bold text-slate-600">{m.matchNumber}</td>
                        <td className="p-2 text-center font-mono font-bold text-slate-700">{m.time || '--:--'}</td>
                        <td className="p-2 font-bold text-slate-600">{m.groupName}</td>
                        <td className="p-2 font-bold text-slate-900">{t1Name}</td>
                        <td className="p-2 text-center font-black font-mono text-sm bg-pink-50/60 text-tlv-pink">
                          {scoreText}
                        </td>
                        <td className="p-2 font-bold text-slate-900">{t2Name}</td>
                        <td className="p-2 text-center">
                          {m.isFinished ? (
                            <span className="text-emerald-700 font-black text-[11px]">הסתיים</span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">ממתין</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table 3: Group Standings */}
            <div>
              <h3 className="text-sm font-black text-tlv-navy mb-2 flex items-center gap-1.5 border-b pb-1">
                <span>📊</span>
                <span>טבלאות דירוג סופיות של שלב הבתים:</span>
              </h3>

              <div className="space-y-3">
                {tournament.groups.map((group) => {
                  const standings = calculateGroupStandings(group, tournament.matches);
                  return (
                    <div key={group.id} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-tlv-navy text-white text-xs font-black px-3 py-1.5">
                        {group.name}
                      </div>
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                            <th className="p-1.5 w-10 text-center">מקום</th>
                            <th className="p-1.5">זוג</th>
                            <th className="p-1.5 w-12 text-center">מש'</th>
                            <th className="p-1.5 w-12 text-center">ניצ'</th>
                            <th className="p-1.5 w-12 text-center">הפס'</th>
                            <th className="p-1.5 w-16 text-center font-bold">הפרש נק'</th>
                            <th className="p-1.5 w-12 text-center font-black">נק'</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {standings.map((st) => (
                            <tr key={st.teamId} className={st.rank === 1 ? 'bg-amber-50/40 font-bold' : ''}>
                              <td className="p-1.5 text-center font-bold">{st.rank}</td>
                              <td className="p-1.5">{st.playerNames}</td>
                              <td className="p-1.5 text-center">{st.played}</td>
                              <td className="p-1.5 text-center text-emerald-700">{st.won}</td>
                              <td className="p-1.5 text-center text-rose-600">{st.lost}</td>
                              <td className="p-1.5 text-center font-mono font-bold">
                                {st.pointDiff > 0 ? `+${st.pointDiff}` : st.pointDiff}
                              </td>
                              <td className="p-1.5 text-center font-black">{st.tablePoints}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Table 4: Finals Stage Results */}
            {finalsMatches.length > 0 && (
              <div>
                <h3 className="text-sm font-black text-tlv-navy mb-2 flex items-center gap-1.5 border-b pb-1">
                  <span>🏆</span>
                  <span>שלב הגמר והפלייאוף:</span>
                </h3>

                <table className="w-full text-right text-xs border border-slate-200 border-collapse">
                  <thead>
                    <tr className="bg-amber-100/60 text-slate-800 font-black border-b border-slate-200">
                      <th className="p-2 w-28">שלב</th>
                      <th className="p-2 w-16 text-center">שעה</th>
                      <th className="p-2">זוג 1</th>
                      <th className="p-2 w-20 text-center bg-amber-200 font-black">תוצאה</th>
                      <th className="p-2">זוג 2</th>
                      <th className="p-2 w-24 text-center">מנצחים</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {finalsMatches.map((m) => {
                      const t1 = getTeamNames(m.team1Id, m.team1Label);
                      const t2 = getTeamNames(m.team2Id, m.team2Label);
                      const scoreText =
                        m.score1 !== null && m.score2 !== null
                          ? `${m.score1} - ${m.score2}`
                          : '-';

                      let winner = '-';
                      if (m.isFinished && m.score1 !== null && m.score2 !== null) {
                        winner = m.score1 > m.score2 ? t1 : t2;
                      }

                      return (
                        <tr key={m.id} className="bg-white">
                          <td className="p-2 font-black text-tlv-navy">{m.stageName || m.groupName}</td>
                          <td className="p-2 text-center font-mono font-bold">{m.time || '--:--'}</td>
                          <td className="p-2 font-bold">{t1}</td>
                          <td className="p-2 text-center font-black font-mono bg-amber-50 text-slate-900 text-sm">
                            {scoreText}
                          </td>
                          <td className="p-2 font-bold">{t2}</td>
                          <td className="p-2 text-center font-black text-emerald-700">{winner}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer Signature */}
            <div className="pt-4 border-t-2 border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <div>כ"ח ת"א - העמותה לכדורעף חופים ע"ש רועי פלס</div>
              <div>הופק מאפליקציית ניהול הטורנירים הרשמית</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
