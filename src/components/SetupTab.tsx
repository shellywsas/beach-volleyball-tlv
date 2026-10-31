import React, { useState } from 'react';
import { Group, Team, Tournament, ScheduleMode } from '../types';
import { generateAllTournamentMatches } from '../utils/scheduler';
import { Users, Plus, Trash2, Sparkles, ArrowLeft, Shield, Calendar, MapPin, Play, Shuffle } from 'lucide-react';

interface SetupTabProps {
  tournament: Tournament;
  onSaveTournament: (updated: Tournament) => void;
  onNavigateToMatches: () => void;
}

const HEBREW_GROUP_LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י'];

export const SetupTab: React.FC<SetupTabProps> = ({
  tournament,
  onSaveTournament,
  onNavigateToMatches,
}) => {
  const [title, setTitle] = useState(tournament.title || 'טורניר כדורעף חופים כ"ח ת"א');
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>(tournament.scheduleMode || 'auto');
  const [groups, setGroups] = useState<Group[]>(
    tournament.groups.length > 0
      ? tournament.groups
      : [
          createDefaultGroup(0, 3),
          createDefaultGroup(1, 3),
        ]
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

  // Handle changing number of groups
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

  // Adjust number of teams in a specific group (supports irregular group sizes!)
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

    // Re-index numbers
    group.teams = currentTeams.map((t, idx) => ({ ...t, number: idx + 1 }));
    updated[groupIndex] = group;
    setGroups(updated);
  };

  // Add a team to a specific group
  const handleAddTeam = (groupIndex: number) => {
    handleSetTeamCountInGroup(groupIndex, groups[groupIndex].teams.length + 1);
  };

  // Remove a team from a specific group
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

  // Update player names
  const handleUpdatePlayer = (
    groupIndex: number,
    teamId: string,
    field: 'player1' | 'player2' | 'customName',
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

  // Quick fill sample data for fast testing
  const handleQuickFillSample = () => {
    const sampleNames = [
      ['יוסי כהן', 'דני לוי'],
      ['עומר שמש', 'רועי בר'],
      ['גיא אלון', 'תומר פז'],
      ['אלון רון', 'ניר שגב'],
      ['מתן שדה', 'איתי מור'],
      ['גלעד קורן', 'עמית שחר'],
    ];

    let nameIdx = 0;
    const updated = groups.map((g) => ({
      ...g,
      teams: g.teams.map((t) => {
        const pair = sampleNames[nameIdx % sampleNames.length];
        nameIdx++;
        return {
          ...t,
          player1: t.player1 || pair[0],
          player2: t.player2 || pair[1],
        };
      }),
    }));
    setGroups(updated);
  };

  // Save setup and generate matches
  const handleCreateAndStart = () => {
    // Generate matches based on scheduleMode
    let generatedMatches = tournament.matches;

    // Check if we should generate matches automatically
    if (scheduleMode === 'auto') {
      generatedMatches = generateAllTournamentMatches(groups);
    } else {
      // Manual mode: start with existing or empty manual matches for groups
      if (tournament.matches.length === 0) {
        // Generate initial round robin that user can edit manually
        generatedMatches = generateAllTournamentMatches(groups);
      }
    }

    const updatedTournament: Tournament = {
      ...tournament,
      title: title.trim() || 'טורניר כדורעף חופים כ"ח ת"א',
      scheduleMode,
      groups,
      matches: generatedMatches,
      updatedAt: Date.now(),
    };

    onSaveTournament(updatedTournament);
    onNavigateToMatches();
  };

  const totalPairs = groups.reduce((sum, g) => sum + g.teams.length, 0);

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Intro Hero Card */}
      <div className="bg-gradient-to-r from-tlv-navy to-tlv-navyLight text-white rounded-3xl p-6 shadow-xl border border-tlv-teal/20 relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-tlv-pink/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute right-0 top-0 w-36 h-36 bg-tlv-teal/15 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tlv-pink/20 text-tlv-pink border border-tlv-pink/30 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              הקמה פשוטה ומהירה של טורניר
            </div>
            <h2 className="text-2xl md:text-3xl font-black">הגדרת הטורניר ושלב הבתים</h2>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              קבעו את כותרת הטורניר, מספר הבתים, וכמה זוגות יש בכל בית (אפשר גדלים שונים לכל בית). לאחר מכן הלוח יופק אוטומטית!
            </p>
          </div>

          <button
            onClick={handleQuickFillSample}
            type="button"
            className="self-start md:self-auto flex items-center gap-2 bg-white/10 hover:bg-white/20 text-tlv-yellow border border-tlv-yellow/30 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
            title="ממלא שמות פיקטיביים כדי שתוכל לנסות את האפליקציה בשניה"
          >
            <Sparkles className="w-4 h-4" />
            מילוי שמות לדוגמה (לבדיקה)
          </button>
        </div>
      </div>

      {/* Step 1: Tournament Title */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <label className="block text-sm font-black text-tlv-navy mb-2 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-tlv-pink text-white flex items-center justify-center text-xs">1</span>
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

      {/* Step 2: Number of Groups */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <label className="block text-sm font-black text-tlv-navy flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-tlv-pink text-white flex items-center justify-center text-xs">2</span>
              כמות הבתים בטורניר
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              כמה בתים תרצו לחלק את הזוגות? (למשל: 2 בתים, 3 בתים, 4 בתים...)
            </p>
          </div>

          {/* Quick Group Count Selector */}
          <div className="flex items-center gap-1.5 self-center">
            {[1, 2, 3, 4, 6].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => handleGroupCountChange(count)}
                className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${
                  groups.length === count
                    ? 'bg-tlv-pink text-white shadow-md scale-105'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {count}
              </button>
            ))}
            <div className="w-px h-6 bg-slate-300 mx-1"></div>
            <button
              type="button"
              onClick={() => handleGroupCountChange(groups.length - 1)}
              disabled={groups.length <= 1}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 font-bold"
            >
              -
            </button>
            <span className="font-black text-base px-2 text-tlv-navy">{groups.length}</span>
            <button
              type="button"
              onClick={() => handleGroupCountChange(groups.length + 1)}
              disabled={groups.length >= 8}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 font-bold"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-tlv-tealLight/50 rounded-xl border border-tlv-teal/30 text-xs text-tlv-navy font-semibold">
          <span>ℹ️ טיפ:</span>
          <span>אין צורך שכל הבתים יהיו שווים! ניתן להגדיר בית חריג עם זוג אחד יותר או פחות. סה"כ בטורניר כרגע: <b>{totalPairs} זוגות</b>.</span>
        </div>
      </div>

      {/* Step 3: Groups and Teams details */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <label className="text-base font-black text-tlv-navy flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-tlv-pink text-white flex items-center justify-center text-xs">3</span>
            הזנת הזוגות והשחקנים בכל בית
          </label>
        </div>

        {groups.map((group, groupIdx) => (
          <div
            key={group.id}
            className="bg-white rounded-3xl p-5 shadow-sm border-2 border-slate-200 hover:border-tlv-teal/50 transition-all"
          >
            {/* Group Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-tlv-navy text-tlv-yellow font-black text-lg flex items-center justify-center shadow">
                  {group.name.replace('בית ', '').replace("'", '')}
                </div>
                <div>
                  <h3 className="text-lg font-black text-tlv-navy">{group.name}</h3>
                  <p className="text-xs text-slate-500">
                    {group.teams.length} זוגות בבית זה
                  </p>
                </div>
              </div>

              {/* Group Size Controls (Specific for each group!) */}
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 self-start sm:self-auto">
                <span className="text-xs font-bold text-slate-600 px-2">כמות זוגות בבית:</span>
                {[3, 4, 5].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => handleSetTeamCountInGroup(groupIdx, cnt)}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all ${
                      group.teams.length === cnt
                        ? 'bg-tlv-teal text-tlv-navy shadow'
                        : 'bg-white hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cnt} זוגות
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddTeam(groupIdx)}
                  className="p-1 rounded-xl bg-white hover:bg-tlv-pink hover:text-white text-slate-700 transition-all"
                  title="הוספת עוד זוג לבית זה"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Teams Grid in this Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
              {group.teams.map((team) => (
                <div
                  key={team.id}
                  className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 hover:border-tlv-pink/40 hover:bg-pink-50/20 transition-all relative group/card"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-tlv-pink bg-tlv-pinkLight px-2.5 py-0.5 rounded-full">
                      זוג {team.number}
                    </span>
                    {group.teams.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTeam(groupIdx, team.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="הסר זוג זה"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <input
                        type="text"
                        value={team.player1}
                        onChange={(e) =>
                          handleUpdatePlayer(groupIdx, team.id, 'player1', e.target.value)
                        }
                        placeholder="שחקן/ית 1 (שם מלא)"
                        className="w-full text-sm font-semibold px-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-tlv-pink focus:outline-none shadow-sm"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={team.player2}
                        onChange={(e) =>
                          handleUpdatePlayer(groupIdx, team.id, 'player2', e.target.value)
                        }
                        placeholder="שחקן/ית 2 (שם מלא)"
                        className="w-full text-sm font-semibold px-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-tlv-pink focus:outline-none shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Step 4: Schedule Mode Option 1 vs Option 2 */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <label className="block text-sm font-black text-tlv-navy mb-1 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-tlv-pink text-white flex items-center justify-center text-xs">4</span>
          שלב הבתים - בחירת אופן סידור המשחקים
        </label>
        <p className="text-xs text-slate-500 mb-4">
          בחרו כיצד תרצו לקבוע את סדר המשחקים בתוך הבתים:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option 2 (Recommended / Built-in) */}
          <div
            onClick={() => setScheduleMode('auto')}
            className={`cursor-pointer rounded-2xl p-4 border-2 transition-all relative ${
              scheduleMode === 'auto'
                ? 'border-tlv-pink bg-pink-50/40 shadow-md ring-2 ring-tlv-pink/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-black text-tlv-navy flex items-center gap-2">
                🏐 אופציה 2: מובנה (כל הזוגות מול כל הזוגות)
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                מומלץ ופשוט
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              סבב חופים מלא שבו כולם משחקים מול כולם לפי הסדר הקלאסי:
            </p>
            <div className="bg-white/80 rounded-xl p-2.5 text-xs text-slate-700 font-mono space-y-1 border border-pink-100">
              <div className="text-slate-800 font-bold">• משחק 1: זוג מספר 1 מול זוג מספר 3</div>
              <div className="text-slate-800 font-bold">• משחק 2: זוג מספר 2 מול זוג מספר 3</div>
              <div className="text-slate-800 font-bold">• משחק 3: זוג מספר 1 מול זוג מספר 2</div>
            </div>
          </div>

          {/* Option 1 (Manual Order) */}
          <div
            onClick={() => setScheduleMode('manual')}
            className={`cursor-pointer rounded-2xl p-4 border-2 transition-all relative ${
              scheduleMode === 'manual'
                ? 'border-tlv-teal bg-cyan-50/40 shadow-md ring-2 ring-tlv-teal/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-black text-tlv-navy flex items-center gap-2">
                ✍️ אופציה 1: בחירה ידנית של סדר המשחקים
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                התאמה אישית
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              שליטה מלאה על סדר המשחקים. תוכלו להוסיף, להזיז, או לשנות משחקים כרצונכם לפי זמינות מגרשים ושחקנים בשטח.
            </p>
            <div className="bg-white/80 rounded-xl p-2.5 text-xs text-slate-700 space-y-1 border border-cyan-100">
              <div>• בחירת זוגות ידנית לכל משחק</div>
              <div>• אפשרות הוספת משחקים בכל שלב</div>
              <div>• גמישות מקסימלית לשופט/מנהל הטורניר</div>
            </div>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="sticky bottom-4 z-30 pt-2">
        <button
          type="button"
          onClick={handleCreateAndStart}
          className="w-full bg-gradient-to-r from-tlv-pink via-pink-600 to-tlv-pinkHover hover:brightness-110 text-white font-black text-lg py-4 px-6 rounded-2xl shadow-2xl flex items-center justify-center gap-3 active:scale-[0.99] transition-all border-2 border-white/40"
        >
          <Play className="w-6 h-6 fill-current" />
          <span>יצירת לוח המשחקים ויציאה לדרך! 🏐</span>
        </button>
      </div>
    </div>
  );
};
