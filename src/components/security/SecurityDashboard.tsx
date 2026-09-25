import React, { useState } from 'react';
import type { DecryptedVaultItem } from '../../types/vault';
import { useVault } from '../../contexts/VaultContext';
import { evaluatePasswordStrength } from '../../lib/passwordGenerator';
import { checkPasswordBreach } from '../../lib/breachCheck';
import {
  ShieldCheck,
  AlertTriangle,
  Copy,
  KeyRound,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldAlert,
  Flame,
  RefreshCw,
} from 'lucide-react';

interface SecurityDashboardProps {
  onEditItem: (item: DecryptedVaultItem) => void;
  onViewItem: (item: DecryptedVaultItem) => void;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  onEditItem,
  onViewItem,
}) => {
  const { items } = useVault();
  const [isAuditingBreaches, setIsAuditingBreaches] = useState(false);
  const [breachedItems, setBreachedItems] = useState<Array<{ item: DecryptedVaultItem; count: number }>>([]);
  const [hasAudited, setHasAudited] = useState(false);

  // Compute stats locally
  const passwordMap = new Map<string, DecryptedVaultItem[]>();

  let strongCount = 0;
  let weakCount = 0;
  const weakItems: DecryptedVaultItem[] = [];

  items.forEach(item => {
    const strength = evaluatePasswordStrength(item.password);
    if (strength.score >= 3) {
      strongCount++;
    } else {
      weakCount++;
      weakItems.push(item);
    }

    const existing = passwordMap.get(item.password) || [];
    existing.push(item);
    passwordMap.set(item.password, existing);
  });

  // Reused passwords
  const reusedGroups: DecryptedVaultItem[][] = [];
  let reusedCount = 0;
  passwordMap.forEach(group => {
    if (group.length > 1) {
      reusedGroups.push(group);
      reusedCount += group.length;
    }
  });

  const total = items.length;
  const healthPercent = total > 0 ? Math.round((strongCount / total) * 100) : 100;

  const handleAuditBreaches = async () => {
    setIsAuditingBreaches(true);
    const breached: Array<{ item: DecryptedVaultItem; count: number }> = [];

    try {
      for (const item of items) {
        const count = await checkPasswordBreach(item.password);
        if (count > 0) {
          breached.push({ item, count });
        }
      }
      setBreachedItems(breached);
      setHasAudited(true);
    } finally {
      setIsAuditingBreaches(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#111116] border border-[#27272F] rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#8B5CF6]" />
              <h2 className="text-lg font-bold text-[#F7F7FA]">
                Vault Security Health
              </h2>
            </div>
            <p className="text-xs text-[#A1A1AA] max-w-lg leading-relaxed">
              Analyzed locally in your browser memory. Plaintext passwords are never sent to any server for auditing.
            </p>
          </div>

          {/* Health Score & Audit CTA */}
          <div className="flex items-center gap-4 bg-[#17171D] border border-[#27272F] px-4 py-3 rounded-xl shrink-0">
            <div className="text-right">
              <span className="text-[11px] font-medium text-[#71717A] uppercase block">
                Health Score
              </span>
              <span className="text-2xl font-bold text-[#F7F7FA] font-mono">
                {healthPercent}%
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20">
              <Lock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="p-4 rounded-xl bg-[#17171D] border border-[#27272F]">
            <span className="text-xs text-[#71717A] flex items-center gap-1.5 mb-1">
              <KeyRound className="w-3.5 h-3.5 text-[#8B5CF6]" /> Total Credentials
            </span>
            <span className="text-xl font-bold text-[#F7F7FA] font-mono">
              {total}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#17171D] border border-[#27272F]">
            <span className="text-xs text-[#71717A] flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" /> Strong
            </span>
            <span className="text-xl font-bold text-[#22C55E] font-mono">
              {strongCount}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#17171D] border border-[#27272F]">
            <span className="text-xs text-[#71717A] flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" /> Weak
            </span>
            <span className="text-xl font-bold text-[#EF4444] font-mono">
              {weakCount}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#17171D] border border-[#27272F]">
            <span className="text-xs text-[#71717A] flex items-center gap-1.5 mb-1">
              <Copy className="w-3.5 h-3.5 text-amber-400" /> Reused
            </span>
            <span className="text-xl font-bold text-amber-400 font-mono">
              {reusedCount}
            </span>
          </div>
        </div>
      </div>

      {/* HaveIBeenPwned k-Anonymity Breach Scanner */}
      <div className="bg-[#111116] border border-[#27272F] rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#F7F7FA] flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Breached Password Scanner (HaveIBeenPwned)</span>
            </h3>
            <p className="text-xs text-[#71717A] mt-0.5">
              Audits against billions of exposed passwords using mathematical k-Anonymity. Zero passwords ever leave your machine.
            </p>
          </div>

          <button
            onClick={handleAuditBreaches}
            disabled={isAuditingBreaches || items.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-orange-950/40 hover:bg-orange-900/60 border border-orange-800/50 text-xs font-medium text-orange-200 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAuditingBreaches ? 'animate-spin' : ''}`} />
            <span>{isAuditingBreaches ? 'Auditing Vault...' : 'Scan Known Breaches'}</span>
          </button>
        </div>

        {hasAudited && (
          <div>
            {breachedItems.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#22C55E] bg-[#17171D]/40 rounded-xl border border-[#22C55E]/20">
                🛡️ Excellent! None of your vault passwords match known public data breaches.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-200 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  <span>
                    Warning: {breachedItems.length} {breachedItems.length === 1 ? 'password appears' : 'passwords appear'} in known public data leaks. Change immediately!
                  </span>
                </div>

                <div className="divide-y divide-[#27272F]">
                  {breachedItems.map(({ item, count }) => (
                    <div
                      key={item.id}
                      className="py-3 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="font-medium text-xs text-[#F7F7FA]">{item.website}</div>
                        <div className="text-[11px] font-mono text-[#71717A]">{item.username}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-red-950/60 border border-red-800/50 text-[10px] text-red-400 font-mono">
                          Leaked {count.toLocaleString()} times
                        </span>
                        <button
                          onClick={() => onEditItem(item)}
                          className="px-3 py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-medium transition-colors cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Weak Passwords Section */}
      <div className="bg-[#111116] border border-[#27272F] rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#F7F7FA] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
              <span>Weak Passwords ({weakItems.length})</span>
            </h3>
            <p className="text-xs text-[#71717A] mt-0.5">
              These credentials have short length or low entropy and should be strengthened.
            </p>
          </div>
        </div>

        {weakItems.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#22C55E] bg-[#17171D]/40 rounded-xl border border-[#22C55E]/20">
            ✓ No weak passwords detected! All your credentials have strong entropy.
          </div>
        ) : (
          <div className="divide-y divide-[#27272F]">
            {weakItems.map(item => (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="font-medium text-xs text-[#F7F7FA]">{item.website}</div>
                  <div className="text-[11px] font-mono text-[#71717A]">{item.username}</div>
                </div>
                <button
                  onClick={() => onEditItem(item)}
                  className="px-3 py-1.5 rounded-lg bg-[#17171D] hover:bg-[#8B5CF6] hover:text-white border border-[#27272F] text-xs font-medium text-[#A1A1AA] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Strengthen</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reused Passwords Section */}
      <div className="bg-[#111116] border border-[#27272F] rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#F7F7FA] flex items-center gap-2">
              <Copy className="w-4 h-4 text-amber-400" />
              <span>Reused Passwords ({reusedGroups.length} groups)</span>
            </h3>
            <p className="text-xs text-[#71717A] mt-0.5">
              Reusing credentials across services creates high vulnerability if one service suffers a breach.
            </p>
          </div>
        </div>

        {reusedGroups.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#22C55E] bg-[#17171D]/40 rounded-xl border border-[#22C55E]/20">
            ✓ No reused passwords found! Each account has a unique credential.
          </div>
        ) : (
          <div className="space-y-3">
            {reusedGroups.map((group, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#17171D] border border-[#27272F] space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-amber-400 text-[11px]">
                    Shared across {group.length} accounts:
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.map(item => (
                    <button
                      key={item.id}
                      onClick={() => onViewItem(item)}
                      className="px-2.5 py-1 rounded-lg bg-[#111116] border border-[#27272F] hover:border-[#8B5CF6] text-xs text-[#F7F7FA] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>{item.website}</span>
                      <span className="text-[10px] text-[#71717A]">({item.username})</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
