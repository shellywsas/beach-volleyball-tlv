import React, { useState } from 'react';
import { Group, Team, Tournament, ScheduleMode, TournamentFormat } from '../types';
import {
  generateMatchesForFormat,
  generateFinalsForFormat,
} from '../utils/scheduler';
import {
  Users,
  Plus,
  Trash2,
  Sparkles,
  ArrowLeft,
  Shield,
  Play,
  Trophy,
  Crown,
  Flame,
  Award,
  Zap,
} from 'lucide-react';

interface SetupTabProps {
  tournament: Tournament;
  onSaveTournament: (updated: Tournament) => void;
  onNavigateToMatches: () => void;
}

const HEBREW_GROUP_LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י'];

const TOURNAMENT_FORMATS: {
  id: TournamentFormat;
  title: string;
  badge: string;
  desc: string;
  icon: any;
  color: string;
}[] = [
  {
    id: 'pools_playoffs',
    title: 'שלב בתים + פלייאוף (קלאסי)',
    badge: 'הכי פופולרי',
    desc: 'סבב בתים מלא, מקומות 1-2 עולים לחצי גמר, גמר ומקום 3. מתאים ל-6 עד 12 זוגות.',
    icon: Trophy,
    color: 'from-tlv-navy to-tlv-navyLight',
  },
  {
    id: 'gold_silver',
    title: 'פלייאוף כפול: בית זהב ובית כסף',
    badge: 'מומלץ למועדון',
    desc: 'כולם ממשיכים לשחק! מקומות 1-2 עולים לגמר זהב, מקומות 3-4 עולים לגמר כסף (תנחומים).',
    icon: Award,
    color: 'from-amber-600 to-yellow-600',
  },
  {
    id: 'round_robin',
    title: 'סבב ליגה מלא (כולם מול כולם)',
    badge: 'ללא בתים',
    desc: 'טבלה אחת גדולה שבה כל זוג פוגש את כל הזוגות בטורניר, עם משחק גמר בסיום.',
    icon: Flame,
    color: 'from-tlv-pink to-rose-600',
  },
  {
    id: 'king_of_the_beach',
    title: 'מלך / מלכת החוף (אישי)',
    badge: 'חברתי וכיפי',
    desc: 'רישום שחקנים בודדים (4 בבית). בכל משחק מחליפים שותף וצוברים נקודות אישיות בטבלה!',
    icon: Crown,
    color: 'from-purple-600 to-indigo-700',
  },
  {
    id: 'double_elimination',
    title: 'הפסד כפול (Double Elimination)',
    badge: 'מקצועי AVP',
    desc: 'מודחים רק אחרי 2 הפסדים! מסלול מנצחים ומסלול מפסידים (קרב הישרדות עד הגמר).',
    icon: Shield,
    color: 'from-blue-600 to-cyan-700',
  },
  {
    id: 'single_elimination',
    title: 'נוק-אאוט ישיר (הדחה מהירה)',
    badge: 'זמן קצר',
    desc: 'משחקי הכרעה ישירים: רבעי גמר, חצאי גמר, משחק על מקום 3 והגמר הגדול.',
    icon: Zap,
    color: 'from-emerald-600 to-teal-700',
  },
];

export const SetupTab: React.FC<SetupTabProps> = ({
  tournament,
  onSaveTournament,
  onNavigateToMatches,
}) => {
  const [format, setFormat] = useState<TournamentFormat>(tournament.format || 'pools_playoffs');
  const [title, setTitle] = useState(tournament.title || 'טורניר כדורעף חופים כ"ח ת"א');
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>(tournament.scheduleMode || 'auto');
  const [groups, setGroups] = useState<Group[]>(
    tournament.groups.length > 0
      ? tournament.groups
      : [createDefaultGroup(0, 3), createDefaultGroup(1, 3)]
  );

  function createDefaultGroup(index: number, teamCount: number = 3): Group {
    const letter = HEBREW_GROUP_LETTERS[index] || `${index + 1}`;
    const teams: Team[] = [];
    for (let i = 1; i <= teamCount; i++) {
      teams.push({
        id: `team_${Date.now()}_${index}_${i}`,
        number: i,
        player1: '',
        player2: '',
        customName: '',
      });
    }
    return {
      id: `group_${Date.now()}_${index}`,
      name: `בית ${letter}'`,
      teams,
    };
  }

  // Handle Format Change
  const handleFormatChange = (newFormat: TournamentFormat) => {
    setFormat(newFormat);

    if (newFormat === 'round_robin') {
      // 1 single group with all teams
      const allTeams = groups.flatMap((g) => g.teams).map((t, idx) => ({ ...t, number: idx + 1 }));
      setGroups([
        {
          id: `group_league_${Date.now()}`,
          name: 'ליגה ראשית (סבב מלא)',
          teams: allTeams.length >= 2 ? allTeams : [
            { id: `t1_${Date.now()}`, number: 1, player1: 'דני לוי', player2: 'יוסי כהן' },
            { id: `t2_${Date.now()}`, number: 2, player1: 'עומר שמש', player2: 'רועי בר' },
            { id: `t3_${Date.now()}`, number: 3, player1: 'גיא אלון', player2: 'תומר פז' },
            { id: `t4_${Date.now()}`, number: 4, player1: 'אלון רון', player2: 'ניר שגב' },
          ],
        },
      ]);
    } else if (newFormat === 'king_of_the_beach') {
      // 4 individual players per group
      setGroups([
        {
          id: `group_king_0_${Date.now()}`,
          name: "בית א' (מלך החוף)",
          teams: [
            { id: `p1_${Date.now()}`, number: 1, player1: 'דני לוי', player2: '' },
            { id: `p2_${Date.now()}`, number: 2, player1: 'יוסי כהן', player2: '' },
            { id: `p3_${Date.now()}`, number: 3, player1: 'עומר שמש', player2: '' },
            { id: `p4_${Date.now()}`, number: 4, player1: 'רועי בר', player2: '' },
          ],
        },
      ]);
    } else if (groups.length === 1 && newFormat !== 'round_robin') {
      // Revert from round robin to 2 groups
      setGroups([createDefaultGroup(0, 3), createDefaultGroup(1, 3)]);
    }
  };

  const handleGroupCountChange = (newCount: number) => {
    if (newCount < 1 || newCount > 10) return;
    if (newCount > groups.length) {
      const added: Group[] = [];
      for (let i = groups.length; i < newCount; i++) {
        added.push(createDefaultGroup(i, 3));
      }
      setGroups([...groups, ...added]);
    } else if (newCount < groups.length) {
      if (confirm(`האם להסיר את ${groups[groups.length - 1].name}?`)) {
        setGroups(groups.slice(0, newCount));
      }
    }
  };

  const handleSetTeamCountInGroup = (groupIndex: number, newCount: number) => {
    if (newCount < 2 || newCount > 8) return;
    const updated = [...groups];
    const group = { ...updated[groupIndex] };
    const currentTeams = [...group.teams];

    if (newCount > currentTeams.length) {
      for (let i = currentTeams.length + 1; i <= newCount; i++) {
        currentTeams.push({
          id: `team_${Date.now()}_${groupIndex}_${i}`,
          number: i,
          player1: '',
          player2: '',
        });
      }
    } else {
      currentTeams.splice(newCount);
    }

    group.teams = currentTeams.map((t, idx) => ({ ...t, number: idx + 1 }));
    updated[groupIndex] = group;
    setGroups(updated);
  };

  const handleAddTeam = (groupIndex: number) => {
    handleSetTeamCountInGroup(groupIndex, groups[groupIndex].teams.length + 1);
  };

  const handleRemoveTeam = (groupIndex: number, teamId: string) => {
    const updated = [...groups];
    const group = { ...updated[groupIndex] };
    if (group.teams.length <= 2) {
      alert('בבית חייבים להיות לפחות 2 זוגות!');
      return;
    }
    group.teams = group.teams
      .filter((t) => t.id !== teamId)
      .map((t, idx) => ({ ...t, number: idx + 1 }));
    updated[groupIndex] = group;
    setGroups(updated);
  };

  const handleUpdatePlayer = (
    groupIndex: number,
    teamId: string,
    field: 'player1' | 'player2',
    value: string
  ) => {
    const updated = [...groups];
    const group = { ...updated[groupIndex] };
    group.teams = group.teams.map((t) => {
      if (t.id === teamId) {
        return { ...t, [field]: value };
      }
      return t;
    });
    updated[groupIndex] = group;
    setGroups(updated);
  };

  const handleQuickFillSample = () => {
    if (format === 'king_of_the_beach') {
      const samplePlayers = ['דני לוי', 'יוסי כהן', 'רועי שחר', 'תומר אלון', 'מתן פז', 'עומר בר', 'איתי מור', 'אלון רון'];
      let idx = 0;
      const updated = groups.map((g) => ({
        ...g,
        teams: g.teams.map((t) => {
          const pName = samplePlayers[idx % samplePlayers.length];
          idx++;
          return { ...t, player1: t.player1 || pName, player2: '' };
        }),
      }));
      setGroups(updated);
      return;
    }

    const samplePairs = [
      ['יוסי כהן', 'דני לוי'],
      ['עומר שמש', 'רועי בר'],
      ['גיא אלון', 'תומר פז'],
      ['אלון רון', 'ניר שגב'],
      ['מתן שדה', 'איתי מור'],
      ['גלעד קורן', 'עמית שחר'],
    ];

    let pairIdx = 0;
    const updated = groups.map((g) => ({
      ...g,
      teams: g.teams.map((t) => {
        const pair = samplePairs[pairIdx % samplePairs.length];
        pairIdx++;
        return {
          ...t,
          player1: t.player1 || pair[0],
          player2: t.player2 || pair[1],
        };
      }),
    }));
    setGroups(updated);
  };

  const handleCreateAndStart = () => {
    const generatedMatches = generateMatchesForFormat(format, groups);
    const generatedFinals = generateFinalsForFormat(format, groups, generatedMatches.length + 1);

    const updatedTournament: Tournament = {
      ...tournament,
      title: title.trim() || 'טורניר כדורעף חופים כ"ח ת"א',
      format,
      scheduleMode,
      groups,
      matches: generatedMatches,
      finals: generatedFinals,
      updatedAt: Date.now(),
    };

    onSaveTournament(updatedTournament);
    onNavigateToMatches();
  };

  const totalParticipants =
    format === 'king_of_the_beach'
      ? groups.reduce((sum, g) => sum + g.teams.length, 0)
      : groups.reduce((sum, g) => sum + g.teams.length, 0);

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Intro Hero Card */}
      <div className="bg-gradient-to-r from-tlv-navy to-tlv-navyLight text-white rounded-3xl p-6 shadow-xl border border-tlv-teal/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tlv-pink/20 text-tlv-pink border border-tlv-pink/30 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              הקמה ובחירת שיטת הטורניר
            </div>
            <h2 className="text-2xl md:text-3xl font-black">הגדרת הטורניר וסוג הפורמט</h2>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              בחרו את שיטת הטורניר הרצויה, כמות הבתים והזוגות. כל לוח המשחקים ושלבי הגמר יופקו אוטומטית!
            </p>
          </div>

          <button
            onClick={handleQuickFillSample}
            type="button"
            className="self-start md:self-auto flex items-center gap-2 bg-white/10 hover:bg-white/20 text-tlv-yellow border border-tlv-yellow/30 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
            title="ממלא שמות בדיקה בלחיצה אחת"
          >
            <Sparkles className="w-4 h-4" />
            מילוי שמות מהיר (לבדיקה)
          </button>
        </div>
      </div>

      {/* Step 1: Tournament Format Selection */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <label className="block text-sm font-black text-tlv-navy mb-1 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-tlv-pink text-white flex items-center justify-center text-xs">1</span>
          בחירת שיטת הטורניר (פורמט המשחקים)
        </label>
        <p className="text-xs text-slate-500 mb-4">
          בחרו את הפורמט המתאים ביותר לפי כמות המשתתפים וזמן הטורניר:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {TOURNAMENT_FORMATS.map((fmt) => {
            const Icon = fmt.icon;
            const isSelected = format === fmt.id;
            return (
              <div
                key={fmt.id}
                onClick={() => handleFormatChange(fmt.id)}
                className={`cursor-pointer rounded-2xl p-4 border-2 transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-tlv-pink bg-pink-50/50 shadow-md ring-2 ring-tlv-pink/20 scale-[1.01]'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-r ${fmt.color} text-white flex items-center justify-center shadow-xs`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-tlv-navy">{fmt.title}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {fmt.desc}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                  <span className={`font-bold px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-tlv-pink text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {fmt.badge}
                  </span>
                  {isSelected && <span className="font-black text-tlv-pink">נבחר ✓</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 2: Tournament Title */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <label className="block text-sm font-black text-tlv-navy mb-2 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-tlv-pink text-white flex items-center justify-center text-xs">2</span>
          שם וכותרת הטורניר
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={'לדוגמה: טורניר שישי כ"ח ת"א - חוף פרישמן'}
          className="w-full text-lg font-bold px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-tlv-pink focus:outline-none transition-all shadow-inner"
        />
      </div>

      {/* Step 3: Groups & Participants */}
      <div className="space-y-4">
        {format !== 'round_robin' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="text-sm font-black text-tlv-navy flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-tlv-pink text-white flex items-center justify-center text-xs">3</span>
                כמות הבתים
              </label>
              <p className="text-xs text-slate-500 mt-0.5">
                {format === 'king_of_the_beach'
                  ? 'כמה מגרשים / בתי "מלך החוף" (4 שחקנים בכל מגרש)?'
                  : 'ניתן להגדיר כמות זוגות שונה בכל בית (אופציה לבית חריג)'}
              </p>
            </div>

            <div className="flex items-center gap-1.5 self-center">
              {[1, 2, 3, 4].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => handleGroupCountChange(count)}
                  className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${
                    groups.length === count
                      ? 'bg-tlv-pink text-white shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Groups Cards */}
        {groups.map((group, groupIdx) => (
          <div
            key={group.id}
            className="bg-white rounded-3xl p-5 shadow-sm border-2 border-slate-200 hover:border-tlv-teal/50 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-tlv-navy text-tlv-yellow font-black text-base flex items-center justify-center shadow">
                  {group.name.replace('בית ', '').replace("'", '')}
                </div>
                <div>
                  <h3 className="text-base font-black text-tlv-navy">{group.name}</h3>
                  <p className="text-xs text-slate-500">
                    {format === 'king_of_the_beach'
                      ? `${group.teams.length} שחקנים בודדים`
                      : `${group.teams.length} זוגות בבית זה`}
                  </p>
                </div>
              </div>

              {format !== 'king_of_the_beach' && (
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-600 px-2">זוגות בבית:</span>
                  {[3, 4, 5].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => handleSetTeamCountInGroup(groupIdx, cnt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                        group.teams.length === cnt
                          ? 'bg-tlv-teal text-tlv-navy shadow'
                          : 'bg-white hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddTeam(groupIdx)}
                    className="p-1 rounded-lg bg-white hover:bg-tlv-pink hover:text-white text-slate-700"
                    title="הוסף עוד זוג"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Teams / Players Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {group.teams.map((team) => (
                <div
                  key={team.id}
                  className="bg-slate-50 rounded-2xl p-3 border border-slate-200 hover:border-tlv-pink/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-tlv-pink bg-pink-100 px-2 py-0.5 rounded-md">
                      {format === 'king_of_the_beach' ? `שחקן/ית ${team.number}` : `זוג ${team.number}`}
                    </span>
                    {group.teams.length > 2 && format !== 'king_of_the_beach' && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTeam(groupIdx, team.id)}
                        className="text-slate-400 hover:text-red-500 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={team.player1}
                      onChange={(e) =>
                        handleUpdatePlayer(groupIdx, team.id, 'player1', e.target.value)
                      }
                      placeholder={
                        format === 'king_of_the_beach'
                          ? `שם מלא של שחקן ${team.number}`
                          : 'שחקן/ית 1 (שם מלא)'
                      }
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-tlv-pink focus:outline-none shadow-sm"
                    />

                    {format !== 'king_of_the_beach' && (
                      <input
                        type="text"
                        value={team.player2}
                        onChange={(e) =>
                          handleUpdatePlayer(groupIdx, team.id, 'player2', e.target.value)
                        }
                        placeholder="שחקן/ית 2 (שם מלא)"
                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-tlv-pink focus:outline-none shadow-sm"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Start Button */}
      <div className="sticky bottom-4 z-30 pt-2">
        <button
          type="button"
          onClick={handleCreateAndStart}
          className="w-full bg-gradient-to-r from-tlv-pink via-pink-600 to-tlv-pinkHover hover:brightness-110 text-white font-black text-lg py-4 px-6 rounded-2xl shadow-2xl flex items-center justify-center gap-3 active:scale-[0.99] transition-all border-2 border-white/40"
        >
          <Play className="w-6 h-6 fill-current" />
          <span>יצירת לוח המשחקים לפי הפורמט הנבחר 🏐</span>
        </button>
      </div>
    </div>
  );
};
