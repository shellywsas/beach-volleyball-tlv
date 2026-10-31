import React, { useState } from 'react';
import { Tournament, FirebaseConfig } from '../types';
import { getSavedFirebaseConfig, saveFirebaseConfig, initFirebaseService } from '../services/firebase';
import { X, Share2, Copy, Check, Cloud, CloudOff, Smartphone, Laptop, Sparkles, MessageCircle } from 'lucide-react';

interface ShareSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  isCloudConnected: boolean;
  onConfigUpdated: () => void;
}

export const ShareSyncModal: React.FC<ShareSyncModalProps> = ({
  isOpen,
  onClose,
  tournament,
  isCloudConnected,
  onConfigUpdated,
}) => {
  if (!isOpen) return null;

  const currentConfig = getSavedFirebaseConfig() || {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  };

  const [config, setConfig] = useState<FirebaseConfig>(currentConfig);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(!isCloudConnected && !currentConfig.projectId);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const shareUrl = `${window.location.origin}${window.location.pathname}?t=${tournament.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(tournament.id);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = `🏐 שלום! הנה קישור חי לטורניר "${tournament.title}" של מועדון כ"ח תל אביב:\n${shareUrl}\n\nקוד טורניר: ${tournament.id}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.projectId) {
      alert('נא להזין לפחות Project ID');
      return;
    }

    saveFirebaseConfig(config);
    const db = initFirebaseService(config);

    if (db) {
      setSaveStatus('החיבור לפיירבייס הוגדר בהצלחה!');
      onConfigUpdated();
      setTimeout(() => setSaveStatus(null), 3000);
    } else {
      setSaveStatus('ההגדרות נשמרו, אך ייתכן שיש שגיאה בפרטי הפרויקט.');
    }
  };

  const handlePasteConfigJson = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const parsed = JSON.parse(e.target.value);
      if (parsed.projectId || parsed.apiKey) {
        setConfig({
          apiKey: parsed.apiKey || '',
          authDomain: parsed.authDomain || '',
          projectId: parsed.projectId || '',
          storageBucket: parsed.storageBucket || '',
          messagingSenderId: parsed.messagingSenderId || '',
          appId: parsed.appId || '',
        });
      }
    } catch {
      // ignore invalid json while typing
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-tlv-navy text-tlv-teal flex items-center justify-center shadow-md">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-tlv-navy">סנכרון בין מכשירים ושיתוף</h3>
              <p className="text-xs text-slate-500">
                צפייה ועדכון תוצאות בו-זמנית מהטלפון ומהמחשב
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 mt-5">
          {/* Quick Share Link & WhatsApp */}
          <div className="bg-gradient-to-br from-pink-50 to-teal-50 rounded-2xl p-4 border border-tlv-pink/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-tlv-navy flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-tlv-pink" />
                קישור ישיר לצפייה וסנכרון:
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                קוד: <b className="text-tlv-navy">{tournament.id}</b>
              </span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full text-xs font-mono bg-white px-3 py-2 rounded-xl border border-slate-300 text-slate-700 select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1 bg-tlv-pink hover:bg-tlv-pinkHover text-white px-3.5 py-2 rounded-xl text-xs font-black shadow-sm transition-all flex-shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'הועתק!' : 'העתק קישור'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>שיתוף ישיר לשחקנים ולשופטים בוואטסאפ 📱</span>
            </button>
          </div>

          {/* Firebase Cloud Status */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isCloudConnected ? (
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Cloud className="w-5 h-5 animate-pulse" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <CloudOff className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="text-xs font-black text-slate-800">
                    סטטוס פיירבייס: {isCloudConnected ? '🟢 מחובר לענן' : '🟡 שמירה במכשיר בלבד'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {isCloudConnected
                      ? 'כל שינוי בטלפון מתעדכן אוטומטית במחשב ולהפך!'
                      : 'הנתונים נשמרים בדפדפן. חברו פיירבייס לסנכרון בין כל המכשירים.'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowConfigForm(!showConfigForm)}
                className="text-xs font-bold text-tlv-pink hover:underline"
              >
                {showConfigForm ? 'סגור הגדרות' : 'הגדר פיירבייס'}
              </button>
            </div>

            {saveStatus && (
              <div className="p-2 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 text-center mt-2">
                {saveStatus}
              </div>
            )}
          </div>

          {/* Firebase Configuration Form */}
          {showConfigForm && (
            <form onSubmit={handleSaveFirebaseConfig} className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="text-xs font-black text-tlv-navy mb-1">
                הגדרת חיבור Firebase (Google Cloud Firestore):
              </div>
              <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                ניתן להדביק כאן את ה-JSON של קובץ ההגדרות מה-Firebase Console (או למלא את השדות):
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  הדבקה מהירה של אובייקט firebaseConfig (JSON):
                </label>
                <textarea
                  rows={2}
                  onChange={handlePasteConfigJson}
                  placeholder='{"apiKey": "...", "projectId": "...", ...}'
                  className="w-full text-xs font-mono p-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-tlv-pink"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Project ID *</label>
                  <input
                    type="text"
                    required
                    value={config.projectId}
                    onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
                    placeholder="my-volleyball-tlv"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">API Key</label>
                  <input
                    type="text"
                    value={config.apiKey}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    placeholder="AIzaSy..."
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Auth Domain</label>
                  <input
                    type="text"
                    value={config.authDomain}
                    onChange={(e) => setConfig({ ...config, authDomain: e.target.value })}
                    placeholder="...firebaseapp.com"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">App ID</label>
                  <input
                    type="text"
                    value={config.appId}
                    onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                    placeholder="1:12345:web:..."
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-tlv-navy hover:bg-tlv-navyLight text-white px-4 py-2 rounded-xl text-xs font-black shadow-md transition-all"
                >
                  שמור ובדוק חיבור פיירבייס 🚀
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
