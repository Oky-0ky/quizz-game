'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

export default function InventoryModal({ onClose }: { onClose: () => void }) {
  const game = useGameStore(s => s.game);
  const applyItem = useGameStore(s => s.useItem);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  if (!game) return null;

  const currentTeam = game.teams[game.currentTeamIndex];
  const otherTeams = game.teams.filter(t => t.id !== currentTeam.id);
  const selectedItem = currentTeam.inventory.find(i => i.itemId === selectedItemId);

  const handleUse = () => {
    if (!selectedItemId) return;
    if (selectedItem?.item.requiresTarget && !selectedTargetId) {
      setMessage('Pilih target terlebih dahulu!');
      return;
    }
    const success = applyItem(currentTeam.id, selectedItemId, selectedTargetId || undefined);
    if (success) {
      setMessage(`${selectedItem?.item.name} berhasil digunakan!`);
      setSelectedItemId(null);
      setSelectedTargetId(null);
    } else {
      setMessage(`Item ${selectedItem?.item.name} gagal digunakan. Periksa target dan inventaris.`);
    }
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col border border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800/50 to-indigo-800/50 p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl text-white">🎒 Inventaris</h2>
            <p className="text-white/60 text-sm">{currentTeam.name} · {currentTeam.coins} koin</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {currentTeam.inventory.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <div className="text-5xl mb-3">🎒</div>
              <div>Inventaris kosong. Beli item di Toko!</div>
            </div>
          ) : (
            currentTeam.inventory.map(inv => (
              <motion.div
                key={inv.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedItemId(inv.itemId === selectedItemId ? null : inv.itemId)}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedItemId === inv.itemId
                    ? 'bg-blue-600/20 border-blue-500'
                    : 'bg-gray-800 border-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="text-3xl w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
                  {inv.item.emoji}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white">{inv.item.name}</div>
                  <div className="text-white/60 text-sm">{inv.item.description}</div>
                  <div className="text-white/40 text-xs mt-1">
                    Tersisa: {inv.item.usageLimit - inv.usedCount}/{inv.item.usageLimit} penggunaan
                  </div>
                </div>
                <div className="text-white/60 text-sm font-bold">×{inv.quantity}</div>
              </motion.div>
            ))
          )}

          {/* Target selection */}
          {selectedItem?.item.requiresTarget && (
            <div className="mt-4 space-y-2">
              <h3 className="text-white/70 font-semibold text-sm">🎯 Pilih Target:</h3>
              {otherTeams.map(team => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTargetId(t => t === team.id ? null : team.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    selectedTargetId === team.id
                      ? 'bg-red-600/20 border-red-500'
                      : 'bg-gray-800 border-gray-700 hover:border-red-500/50'
                  }`}
                >
                  <span className="text-xl">{team.avatarEmoji}</span>
                  <span className="text-white font-semibold">{team.name}</span>
                  <span className="ml-auto text-right text-white/50 text-xs">
                    Poin {team.score} · 💰{team.coins}
                    <span className="block">Kotak #{team.position}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Cards */}
          {currentTeam.cards.length > 0 && (
            <div className="mt-4">
              <h3 className="text-white/70 font-semibold text-sm mb-2">🃏 Kartu Kejutan:</h3>
              <div className="grid grid-cols-2 gap-2">
                {currentTeam.cards.filter(c => !c.isUsed).map(card => (
                  <div key={card.id} className={`p-3 rounded-xl bg-gray-800 border border-gray-700 text-center ${card.rarity === 'legendary' ? 'border-yellow-500/50' : card.rarity === 'rare' ? 'border-purple-500/50' : ''}`}>
                    <div className="text-2xl mb-1">{card.emoji}</div>
                    <div className="text-white text-xs font-bold">{card.name}</div>
                    <div className="text-white/50 text-xs">{card.description}</div>
                    <div className={`text-xs mt-1 ${card.rarity === 'legendary' ? 'text-yellow-400' : card.rarity === 'rare' ? 'text-purple-400' : 'text-gray-400'}`}>
                      {card.rarity === 'legendary' ? '⭐ Legendaris' : card.rarity === 'rare' ? '✨ Langka' : '• Biasa'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 space-y-2">
          {message && (
            <div className="text-center text-green-400 text-sm font-semibold">{message}</div>
          )}
          {selectedItemId && (
            <button
              onClick={handleUse}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-2xl transition-all"
            >
              ✨ Gunakan {selectedItem?.item.name}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
