import React from 'react';
import { Share2, RefreshCw, Trophy, Cloud, CloudOff, PlusCircle } from 'lucide-react';

interface HeaderProps {
  tournamentTitle: string;
  isCloudConnected: boolean;
  onOpenShareModal: () => void;
  onNewTournament: () => void;
  tournamentId: string;
}

export const Header: React.FC<HeaderProps> = ({
  tournamentTitle,
  isCloudConnected,
  onOpenShareModal,
  onNewTournament,
  tournamentId,
}) => {
  return (
    <header className="bg-tlv-navy text-white shadow-xl border-b-4 border-tlv-pink sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Club branding */}
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 md:w-14 md:h-14 flex-shrink-0 bg-white rounded-full p-1 shadow-md border-2 border-tlv-teal overflow-hidden flex items-center justify-center">
              <img
                src="/assets/logo-white-bg.png"
                alt="כוח תל אביב לוגו"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                  כ"ח ת"א
                  <span className="text-tlv-teal text-sm md:text-base font-semibold px-2 py-0.5 bg-tlv-navyLight rounded-full border border-tlv-teal/30">
                    חופים
                  </span>
                </h1>
              </div>
              <p className="text-[11px] md:text-xs text-tlv-teal/90 font-medium">
                העמותה לכדורעף חופים ע"ש רועי פלס
              </p>
            </div>
          </div>

          {/* Tournament title and actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Sync Badge */}
            <button
              onClick={onOpenShareModal}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                isCloudConnected
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-400/40 hover:bg-amber-500/30'
              }`}
              title={isCloudConnected ? 'מסונכרן עם פיירבייס בענן' : 'שמור בזיכרון המכשיר בלבד'}
            >
              {isCloudConnected ? (
                <>
                  <Cloud className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                  <span>סנכרון ענן פעיל</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>שמירה מקומית</span>
                </>
              )}
            </button>

            {/* Share & Connect Button */}
            <button
              onClick={onOpenShareModal}
              className="flex items-center gap-1.5 bg-tlv-teal hover:bg-tlv-tealDark text-tlv-navy px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold shadow-md active:scale-95 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden xs:inline">סנכרון ושיתוף</span>
            </button>

            {/* New Tournament Button */}
            <button
              onClick={onNewTournament}
              className="flex items-center gap-1 bg-tlv-pink hover:bg-tlv-pinkHover text-white px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold shadow-md active:scale-95 transition-all"
              title="יצירת טורניר חדש"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">טורניר חדש</span>
            </button>
          </div>
        </div>

        {/* Tournament name subtitle if available */}
        {tournamentTitle && (
          <div className="mt-2 pt-2 border-t border-tlv-navyLight flex items-center justify-between text-xs text-slate-300">
            <span className="font-bold text-tlv-yellow text-sm truncate max-w-[280px] sm:max-w-md">
              🏐 {tournamentTitle}
            </span>
            <span className="text-[11px] bg-tlv-navyDark/60 px-2 py-0.5 rounded font-mono text-slate-300">
              קוד: {tournamentId}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
