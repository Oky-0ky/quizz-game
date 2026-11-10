'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { ShopItem, ItemCategory } from '@/types/game';

const CATEGORY_LABELS: Record<ItemCategory, { label: string; emoji: string; color: string; badge: string }> = {
  help: {
    label: 'Bonus',
    emoji: '💡',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    badge: 'bg-blue-900/60 text-blue-200 border-blue-500/40'
  },
  strategy: {
    label: 'Serangan',
    emoji: '⚔️',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    badge: 'bg-amber-900/60 text-amber-200 border-amber-500/40'
  },
  defense: {
    label: 'Pertahanan',
    emoji: '🛡️',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    badge: 'bg-emerald-900/60 text-emerald-200 border-emerald-500/40'
  },
};

interface ShopItemCardProps {
  item: ShopItem;
  canAfford: boolean;
  ownedCount: number;
  onBuy: () => void;
  onBuyAndUse?: () => void;
}

function ShopItemCard({ item, canAfford, ownedCount, onBuy, onBuyAndUse }: ShopItemCardProps) {
  const cat = CATEGORY_LABELS[item.category];

  return (
    <motion.div
      whileHover={{ scale: 1.015, y: -2 }}
      className={`rounded-2xl p-4 border transition-all flex flex-col justify-between ${
        canAfford
          ? 'bg-gradient-to-b from-gray-800 to-gray-850 border-white/10 hover:border-emerald-500/40 shadow-lg hover:shadow-emerald-950/30'
          : 'bg-gray-850/80 border-white/5 opacity-80'
      }`}
    >
      <div>
        <div className="flex items-start gap-3">
          <div className="text-3xl w-13 h-13 rounded-2xl bg-gray-700/80 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-inner">
            {item.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1 mb-1">
              <h3 className="font-bold text-white text-sm leading-snug">{item.name}</h3>
              <span className={`text-[11px] px-2 py-0.5 rounded-full border flex-shrink-0 font-medium ${cat.badge}`}>
                {cat.emoji} {cat.label}
              </span>
            </div>
            <p className="text-white/70 text-xs leading-relaxed line-clamp-2">{item.description}</p>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-yellow-400">
            <span className="text-base">💰</span>
            <span className="text-sm font-mono">{item.price} koin</span>
          </div>
          <div className="flex items-center gap-2 text-white/50 text-[11px]">
            <span className={item.currentStock <= 0 ? 'text-red-400' : 'text-white/40'}>
              Stok: {item.currentStock}
            </span>
            {ownedCount > 0 && (
              <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-semibold border border-emerald-500/20">
                Milik: {ownedCount}
              </span>
            )}
            {item.requiresTarget ? (
              <span className="text-amber-400/80">🎯 Butuh Target</span>
            ) : (
              <span className="text-blue-400/80">⚡ Efek Mandiri</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onBuy}
          disabled={!canAfford || !item.isEnabled}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow ${
            canAfford && item.isEnabled
              ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-emerald-900/40'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
          }`}
        >
          {!item.isEnabled ? '🚫 Nonaktif' : item.currentStock <= 0 ? '📦 Stok Habis' : !canAfford ? '💸 Koin Kurang' : '🛒 Beli & Simpan'}
        </motion.button>

        {canAfford && item.isEnabled && !item.requiresTarget && onBuyAndUse && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onBuyAndUse}
            title="Beli dan langsung gunakan efeknya sekarang"
            className="px-3 py-2.5 rounded-xl font-bold text-xs bg-purple-600/80 hover:bg-purple-500 text-white border border-purple-400/30 transition-all flex items-center justify-center"
          >
            ⚡ Pakai
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

export default function ShopModal({ onClose }: { onClose?: () => void }) {
  const game = useGameStore(s => s.game);
  const buyItem = useGameStore(s => s.buyItem);
  const applyItem = useGameStore(s => s.useItem);
  const closeShop = useGameStore(s => s.closeShop);
  const activeShopTeamId = useGameStore(s => s.activeShopTeamId);

  const [activeCategory, setActiveCategory] = useState<ItemCategory | 'all'>('all');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(() => {
    if (activeShopTeamId) return activeShopTeamId;
    if (game && game.teams[game.currentTeamIndex]) return game.teams[game.currentTeamIndex].id;
    return game?.teams[0]?.id || '';
  });
  const [notification, setNotification] = useState<{ text: string; emoji: string } | null>(null);

  if (!game) return null;

  const currentTeam = game.teams.find(t => t.id === selectedTeamId) || game.teams[game.currentTeamIndex] || game.teams[0];
  const items = game.shopItems.filter(i => activeCategory === 'all' || i.category === activeCategory);

  const handleClose = () => {
    closeShop();
    if (onClose) onClose();
  };

  const handleBuy = (itemId: string, andUse: boolean = false) => {
    const item = game.shopItems.find(i => i.id === itemId);
    if (!item) return;
    if (item.currentStock <= 0) {
      setNotification({ text: `${item.name} sudah habis stoknya!`, emoji: '📦' });
      setTimeout(() => setNotification(null), 2500);
      return;
    }
    if (item.id === 'combined_attack' && currentTeam.score < 1000) {
      setNotification({ text: 'Serangan Gabungan butuh minimal 1000 poin tim!', emoji: '💥' });
      setTimeout(() => setNotification(null), 2800);
      return;
    }

    const success = buyItem(currentTeam.id, itemId);
    if (!success) {
      setNotification({ text: 'Koin tidak mencukupi untuk membeli item ini!', emoji: '💸' });
      setTimeout(() => setNotification(null), 2500);
      return;
    }

    if (andUse && !item.requiresTarget) {
      const applied = applyItem(currentTeam.id, itemId);
      setNotification({
        text: applied ? `${item.name} dibeli & langsung diaktifkan!` : `${item.name} tersimpan di inventaris.`,
        emoji: item.emoji,
      });
    } else if (item.requiresTarget) {
      setNotification({ text: `${item.name} tersimpan — pilih target di 🎒 Inventaris.`, emoji: '🎯' });
    } else {
      setNotification({ text: `${item.name} tersimpan di inventaris ${currentTeam.name}!`, emoji: item.emoji });
    }
    setTimeout(() => setNotification(null), 2800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-gray-900 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-emerald-500/20 shadow-2xl overflow-hidden relative"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900/90 via-teal-900/80 to-slate-900 p-4 md:p-5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-2xl shadow-inner">
                🏪
              </div>
              <div>
                <h2 className="font-display text-xl md:text-2xl text-white tracking-wide">Daftar Item Toko</h2>
                <p className="text-emerald-200/70 text-xs">Pilih item, baca efeknya, lalu beli dengan koin.</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors text-lg"
              title="Tutup Toko"
            >
              ✕
            </button>
          </div>

          {/* Team selector tabs */}
          <div className="bg-black/30 rounded-2xl p-2 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-white/60 text-xs font-medium mr-1 flex-shrink-0">Pembeli:</span>
              {game.teams.map(t => {
                const isSelected = t.id === currentTeam.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTeamId(t.id)}
                  title={`Lihat & beli item untuk ${t.name} (${t.coins} koin)`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-md border border-emerald-400/50'
                        : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/5'
                    }`}
                  >
                    <span>{t.avatarEmoji}</span>
                    <span>{t.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto bg-black/40 px-3 py-1.5 rounded-xl border border-yellow-500/20">
              <span className="text-white/60 text-xs">Saldo:</span>
              <span className="text-yellow-400 font-bold font-mono text-sm flex items-center gap-1">
                💰 {currentTeam.coins} koin
              </span>
            </div>
          </div>
        </div>

        {/* Category filter tabs */}
        <div className="flex gap-2 p-3 md:px-5 border-b border-white/10 bg-gray-900/90 overflow-x-auto flex-shrink-0">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold flex-shrink-0 transition-all flex items-center gap-1.5 ${
              activeCategory === 'all'
                ? 'bg-purple-600 text-white shadow-md border border-purple-400/40'
                : 'bg-gray-800 text-white/60 hover:text-white border border-white/5'
            }`}
          >
            <span>🛒</span> Semua ({game.shopItems.length})
          </button>
          {(Object.entries(CATEGORY_LABELS) as [ItemCategory, typeof CATEGORY_LABELS[ItemCategory]][]).map(([cat, info]) => {
            const count = game.shopItems.filter(i => i.category === cat).length;
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold flex-shrink-0 transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-md border border-purple-400/40'
                    : 'bg-gray-800 text-white/60 hover:text-white border border-white/5'
                }`}
              >
                <span>{info.emoji}</span> {info.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Items grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {items.map(item => {
              const invItem = currentTeam.inventory.find(i => i.itemId === item.id);
              const ownedCount = invItem?.quantity || 0;
              return (
                <ShopItemCard
                  key={item.id}
                  item={item}
                  canAfford={currentTeam.coins >= item.price && item.currentStock > 0 && !(item.id === 'combined_attack' && currentTeam.score < 1000)}
                  ownedCount={ownedCount}
                  onBuy={() => handleBuy(item.id, false)}
                  onBuyAndUse={() => handleBuy(item.id, true)}
                />
              );
            })}
          </div>
        </div>

        {/* Floating feedback toast */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-gray-800/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 font-semibold text-xs md:text-sm flex items-center gap-2 z-20 pointer-events-none"
            >
              <span className="text-xl">{notification.emoji}</span>
              <span>{notification.text}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
