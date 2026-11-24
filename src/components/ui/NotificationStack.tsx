'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

export default function NotificationStack() {
  const game = useGameStore(s => s.game);
  const removeNotification = useGameStore(s => s.removeNotification);

  if (!game?.notifications?.length) return null;

  const bgMap: Record<string, string> = {
    success: 'bg-green-900/90 border-green-500/40',
    error: 'bg-red-900/90 border-red-500/40',
    info: 'bg-blue-900/90 border-blue-500/40',
    warning: 'bg-orange-900/90 border-orange-500/40',
    event: 'bg-purple-900/90 border-purple-500/40',
  };

  const iconMap: Record<string, string> = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
    event: '🌟',
  };

  return (
    <div className="absolute top-4 right-4 z-[100] flex w-[min(17rem,calc(100vw-2rem))] flex-col gap-1.5 pointer-events-none md:right-[21rem]">
      <AnimatePresence>
        {game.notifications.slice(-5).map(notif => (
          <motion.div
            key={notif.id}
            initial={{ y: 12, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -8, opacity: 0, scale: 0.96 }}
            className={`rounded-xl px-3 py-2.5 border backdrop-blur-sm pointer-events-auto cursor-pointer shadow-lg ${bgMap[notif.type] || bgMap.info}`}
            onClick={() => removeNotification(notif.id)}
          >
            <div className="flex items-start gap-2">
              <span className="text-base flex-shrink-0">{notif.emoji || iconMap[notif.type]}</span>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-xs leading-tight">{notif.title}</div>
                {notif.message && (
                  <div className="text-white/70 text-[11px] mt-0.5 leading-snug">{notif.message}</div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
