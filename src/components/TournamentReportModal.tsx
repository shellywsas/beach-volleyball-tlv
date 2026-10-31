import React, { useRef, useState } from 'react';
import { Tournament, Match, Group, Team } from '../types';
import { calculateGroupStandings } from '../utils/standings';
import { Download, Printer, X, Trophy, Clock, Check, Share2, Sparkles } from 'lucide-react';
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

  // If finals not yet played, show current leaders from groups
  if (!championName && tournament.groups.length > 0) {
    const groupAStandings = calculateGroupStandings(tournament.groups[0], tournament.matches);
    if (groupAStandings.length > 0 && groupAStandings[0].won > 0) {
      championName = `${groupAStandings[0].playerNames} (מובילי ${tournament.groups[0].name})`;
    }
  }

  // Multi-page clean A4 PDF generation (no chopped rows!)
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);

    try {
      const pageElements = document.querySelectorAll<HTMLElement>('.print-a4-page');
      if (pageElements.length === 0) return;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i];

        // Capture page cleanly
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 1024,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }

        // Exact A4 portrait placement
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }

      const cleanTitle = (tournament.title || 'טורניר_חופים').replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, '_');
      pdf.save(`${cleanTitle}_דוח_סיכום_A4.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      // Fallback directly to native browser print
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-200 rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-300 my-4 flex flex-col max-h-[95vh] overflow-hidden">
        {/* Top Controls Bar (Never printed) */}
        <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 no-print">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-tlv-pink" />
            <div>
              <h3 className="text-base font-black text-tlv-navy">
                דוח A4 מלא: סידור הבתים, שעות, גמר והכתרת מנצחים 📄
              </h3>
              <p className="text-xs text-slate-500">
                מעוצב ומחולק בדיוק לדפי A4 תקניים – ללא חיתוך שורות וללא עיוותים
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 bg-gradient-to-r from-tlv-pink to-pink-600 hover:brightness-110 text-white px-4 py-2 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'מייצר קובץ PDF איכותי...' : 'הורדת קובץ PDF (דפי A4) 📥'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-tlv-navy hover:bg-tlv-navyLight text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>הדפסה ישירה 🖨️</span>
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
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 space-y-6">
          <div id="printable-report-root" className="space-y-6 max-w-[794px] mx-auto">
            
            {/* ======================================================== */}
            {/* 📄 עמוד 1: סידור הבתים, לוח המשחקים, השעות והתוצאות */}
            {/* ======================================================== */}
            <div
              className="print-a4-page bg-white p-8 sm:p-10 text-slate-800 rounded-2xl shadow-md border border-slate-200 mx-auto flex flex-col justify-between"
              style={{ width: '100%', maxWidth: '794px', minHeight: '1120px', boxSizing: 'border-box' }}
              dir="rtl"
            >
              <div className="space-y-5">
                {/* Official Club Header */}
                <div className="border-b-4 border-tlv-pink pb-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src="./assets/logo-white-bg.png"
                      alt={'כ"ח ת"א'}
                      className="w-16 h-16 object-contain"
                      crossOrigin="anonymous"
                    />
                    <div>
                      <h1 className="text-2xl font-black text-tlv-navy leading-none">
                        כ"ח תל אביב
                      </h1>
                      <p className="text-xs font-bold text-tlv-pink mt-1">
                        העמותה לכדורעף חופים ע"ש רועי פלס
                      </p>
                      <p className="text-[11px] text-slate-500">
                        דוח רשמי: סידור בתים ולוח זמנים
                      </p>
                    </div>
                  </div>

                  <div className="text-left font-mono text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="font-black text-sm text-tlv-navy">{tournament.title}</div>
                    <div>תאריך: <b>{tournament.date}</b></div>
                    <div>קוד טורניר: <b>{tournament.id}</b></div>
                  </div>
                </div>

                {/* Section A: סידור הבתים והזוגות */}
                <div>
                  <div className="bg-tlv-navy text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center justify-between mb-2">
                    <span>📋 חלוקת הבתים והזוגות המשתתפים:</span>
                    <span className="text-tlv-teal text-[11px]">
                      {tournament.groups.length} בתים • סה"כ{' '}
                      {tournament.groups.reduce((acc, g) => acc + g.teams.length, 0)} זוגות
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {tournament.groups.map((group) => (
                      <div key={group.id} className="border border-slate-300 rounded-xl p-2.5 bg-slate-50 text-xs">
                        <div className="font-black text-tlv-pink pb-1 mb-1 border-b border-slate-200 flex items-center justify-between">
                          <span>{group.name}</span>
                          <span className="text-slate-500 font-normal">({group.teams.length} זוגות)</span>
                        </div>
                        <ul className="space-y-1">
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

                {/* Section B: לוח המשחקים המלא, שעות ותוצאות (כמה-כמה) */}
                <div>
                  <div className="bg-tlv-navy text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center justify-between mb-2">
                    <span>🏐 שלב הבתים - לוח המשחקים, שעות ותוצאות:</span>
                    <span className="text-tlv-yellow text-[11px]">מעקב תוצאות חי</span>
                  </div>

                  <table className="w-full text-right text-xs border border-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-black border-b border-slate-300">
                        <th className="p-2 w-10 text-center">מש'</th>
                        <th className="p-2 w-16 text-center font-mono">שעה</th>
                        <th className="p-2 w-16 text-center">בית</th>
                        <th className="p-2">זוג ראשון (קבוצה 1)</th>
                        <th className="p-2 w-20 text-center bg-pink-100 text-tlv-pink font-black text-sm">
                          תוצאה
                        </th>
                        <th className="p-2">זוג שני (קבוצה 2)</th>
                        <th className="p-2 w-16 text-center">סטטוס</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {tournament.matches.map((m) => {
                        const t1Name = getTeamNames(m.team1Id, m.team1Label);
                        const t2Name = getTeamNames(m.team2Id, m.team2Label);
                        const scoreText =
                          m.score1 !== null && m.score2 !== null
                            ? `${m.score1} : ${m.score2}`
                            : '-';

                        return (
                          <tr key={m.id} className={m.isFinished ? 'bg-emerald-50/20' : ''}>
                            <td className="p-1.5 text-center font-bold text-slate-600">{m.matchNumber}</td>
                            <td className="p-1.5 text-center font-mono font-bold text-slate-800 bg-slate-50">
                              {m.time || '09:00'}
                            </td>
                            <td className="p-1.5 text-center font-bold text-slate-600">{m.groupName}</td>
                            <td className="p-1.5 font-bold text-slate-900">{t1Name}</td>
                            <td className="p-1.5 text-center font-black font-mono text-sm bg-pink-50 text-tlv-pink">
                              {scoreText}
                            </td>
                            <td className="p-1.5 font-bold text-slate-900">{t2Name}</td>
                            <td className="p-1.5 text-center">
                              {m.isFinished ? (
                                <span className="text-emerald-700 font-black text-[10px]">הסתיים</span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">טרם שוחק</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Page 1 Bottom Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 mt-auto">
                <span>כ"ח תל אביב • העמותה לכדורעף חופים ע"ש רועי פלס</span>
                <span>עמוד 1 מתוך 2 • סידור ולוח משחקים</span>
              </div>
            </div>

            {/* ======================================================== */}
            {/* 📄 עמוד 2: טבלאות דירוג סופיות, שלב הגמר והכתרת המנצחים */}
            {/* ======================================================== */}
            <div
              className="print-a4-page bg-white p-8 sm:p-10 text-slate-800 rounded-2xl shadow-md border border-slate-200 mx-auto flex flex-col justify-between"
              style={{ width: '100%', maxWidth: '794px', minHeight: '1120px', boxSizing: 'border-box' }}
              dir="rtl"
            >
              <div className="space-y-5">
                {/* Page 2 Header */}
                <div className="border-b-4 border-tlv-pink pb-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src="./assets/logo-white-bg.png"
                      alt={'כ"ח ת"א'}
                      className="w-14 h-14 object-contain"
                      crossOrigin="anonymous"
                    />
                    <div>
                      <h2 className="text-xl font-black text-tlv-navy leading-none">
                        כ"ח תל אביב - שלב ההכרעה והגמר
                      </h2>
                      <p className="text-xs font-bold text-tlv-pink mt-1">
                        העמותה לכדורעף חופים ע"ש רועי פלס
                      </p>
                    </div>
                  </div>

                  <div className="text-left font-mono text-xs text-slate-700">
                    <div className="font-black text-sm text-tlv-navy">{tournament.title}</div>
                    <div>דוח תוצאות סופי ומנצחים</div>
                  </div>
                </div>

                {/* 🏆 פודיום הכתרת המנצחים */}
                <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-2 border-amber-400 rounded-2xl p-4 text-center shadow-xs">
                  <div className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-900 font-black text-xs px-3 py-0.5 rounded-full uppercase tracking-wider mb-2">
                    <Trophy className="w-3.5 h-3.5 fill-slate-900" />
                    הכתרת מנצחי הטורניר הרשמיים
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">
                    פודיום כדורעף החופים 🏐
                  </h3>

                  <div className="grid grid-cols-3 gap-2.5 text-center pt-1">
                    {/* 2nd Place */}
                    <div className="bg-white/95 p-2.5 rounded-xl border border-slate-300 flex flex-col justify-between">
                      <div className="text-2xl mb-0.5">🥈</div>
                      <div className="text-[11px] font-black text-slate-600">מקום שני (סגני אלופים)</div>
                      <div className="text-xs font-black text-slate-900 mt-1">
                        {runnerUpName || 'ממתין לסיום הגמר'}
                      </div>
                    </div>

                    {/* 1st Place */}
                    <div className="bg-amber-100 p-3 rounded-xl border-2 border-amber-500 flex flex-col justify-between shadow-xs">
                      <div className="text-3xl mb-0.5">🥇</div>
                      <div className="text-xs font-black text-amber-900">אלופי הטורניר!</div>
                      <div className="text-sm font-black text-slate-900 mt-1">
                        {championName || 'טרם נקבע'}
                      </div>
                    </div>

                    {/* 3rd Place */}
                    <div className="bg-white/95 p-2.5 rounded-xl border border-slate-300 flex flex-col justify-between">
                      <div className="text-2xl mb-0.5">🥉</div>
                      <div className="text-[11px] font-black text-slate-600">מקום שלישי</div>
                      <div className="text-xs font-black text-slate-900 mt-1">
                        {thirdPlaceName || 'ממתין להכרעה'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section C: טבלאות דירוג סופיות של הבתים */}
                <div>
                  <div className="bg-tlv-navy text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center justify-between mb-2">
                    <span>📊 טבלאות דירוג סופיות של הבתים:</span>
                    <span className="text-tlv-teal text-[11px]">לפי ניצחונות והפרש נקודות</span>
                  </div>

                  <div className="space-y-2.5">
                    {tournament.groups.map((group) => {
                      const standings = calculateGroupStandings(group, tournament.matches);
                      return (
                        <div key={group.id} className="border border-slate-300 rounded-xl overflow-hidden">
                          <div className="bg-slate-100 text-slate-800 text-xs font-black px-3 py-1 border-b border-slate-300 flex items-center justify-between">
                            <span>{group.name}</span>
                            <span className="text-[11px] font-normal text-slate-500">
                              {standings.length} זוגות
                            </span>
                          </div>
                          <table className="w-full text-right text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px]">
                                <th className="p-1.5 w-10 text-center">מיקום</th>
                                <th className="p-1.5">זוג שחקנים</th>
                                <th className="p-1.5 w-12 text-center">משחקים</th>
                                <th className="p-1.5 w-12 text-center text-emerald-700">ניצ'</th>
                                <th className="p-1.5 w-12 text-center text-rose-600">הפס'</th>
                                <th className="p-1.5 w-16 text-center font-bold">הפרש נק'</th>
                                <th className="p-1.5 w-12 text-center font-black">נק'</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              {standings.map((st) => (
                                <tr key={st.teamId} className={st.rank === 1 ? 'bg-amber-50/50 font-bold' : ''}>
                                  <td className="p-1.5 text-center font-black">
                                    {st.rank === 1 ? '🥇 1' : st.rank === 2 ? '🥈 2' : st.rank === 3 ? '🥉 3' : st.rank}
                                  </td>
                                  <td className="p-1.5 font-bold text-slate-900">{st.playerNames}</td>
                                  <td className="p-1.5 text-center">{st.played}</td>
                                  <td className="p-1.5 text-center text-emerald-700 font-bold">{st.won}</td>
                                  <td className="p-1.5 text-center text-rose-600">{st.lost}</td>
                                  <td className="p-1.5 text-center font-mono font-bold">
                                    {st.pointDiff > 0 ? `+${st.pointDiff}` : st.pointDiff}
                                  </td>
                                  <td className="p-1.5 text-center font-black text-tlv-navy">{st.tablePoints}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section D: שלב הגמר והפלייאוף */}
                {finalsMatches.length > 0 && (
                  <div>
                    <div className="bg-tlv-navy text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center justify-between mb-2">
                      <span>🏆 שלב הפלייאוף והגמר הגדול:</span>
                      <span className="text-tlv-yellow text-[11px]">חצאי גמר, מקום 3 וגמר</span>
                    </div>

                    <table className="w-full text-right text-xs border border-slate-300 border-collapse">
                      <thead>
                        <tr className="bg-amber-100/70 text-slate-800 font-black border-b border-slate-300">
                          <th className="p-2 w-28">משחק</th>
                          <th className="p-2 w-16 text-center font-mono">שעה</th>
                          <th className="p-2">זוג ראשון</th>
                          <th className="p-2 w-20 text-center bg-amber-200 font-black text-sm">תוצאה</th>
                          <th className="p-2">זוג שני</th>
                          <th className="p-2 w-24 text-center">מנצחים</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-medium">
                        {finalsMatches.map((m) => {
                          const t1 = getTeamNames(m.team1Id, m.team1Label);
                          const t2 = getTeamNames(m.team2Id, m.team2Label);
                          const scoreText =
                            m.score1 !== null && m.score2 !== null
                              ? `${m.score1} : ${m.score2}`
                              : '-';

                          let winner = '-';
                          if (m.isFinished && m.score1 !== null && m.score2 !== null) {
                            winner = m.score1 > m.score2 ? t1 : t2;
                          }

                          return (
                            <tr key={m.id} className="bg-white">
                              <td className="p-1.5 font-black text-tlv-navy">{m.stageName || m.groupName}</td>
                              <td className="p-1.5 text-center font-mono font-bold bg-slate-50">{m.time || '12:00'}</td>
                              <td className="p-1.5 font-bold text-slate-900">{t1}</td>
                              <td className="p-1.5 text-center font-black font-mono bg-amber-50 text-slate-900 text-sm">
                                {scoreText}
                              </td>
                              <td className="p-1.5 font-bold text-slate-900">{t2}</td>
                              <td className="p-1.5 text-center font-black text-emerald-700">{winner}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Page 2 Bottom Signature & Approval */}
              <div className="pt-4 border-t-2 border-slate-300 flex items-center justify-between text-xs text-slate-500 mt-auto">
                <div>
                  <div className="font-bold text-slate-800">אישור הנהלת מועדון כ"ח תל אביב</div>
                  <div className="text-[10px]">העמותה לכדורעף חופים ע"ש רועי פלס</div>
                </div>
                <div className="border-t border-slate-400 w-36 pt-1 text-center font-mono text-[10px]">
                  חתימת שופט / מנהל הטורניר
                </div>
                <div className="text-[10px]">עמוד 2 מתוך 2</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
