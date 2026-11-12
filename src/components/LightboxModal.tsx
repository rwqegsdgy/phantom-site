import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { VisualScene } from '../data/profile';

interface LightboxModalProps {
  scenes: VisualScene[];
  activeIndex: number | null;
  activeBackdropId: string;
  onClose: () => void;
  onChangeIndex: (index: number) => void;
  onApplyBackdrop: (sceneId: string) => void;
}

export function LightboxModal({
  scenes,
  activeIndex,
  activeBackdropId,
  onClose,
  onChangeIndex,
  onApplyBackdrop,
}: LightboxModalProps) {
  useEffect(() => {
    if (activeIndex === null) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        onChangeIndex((activeIndex - 1 + scenes.length) % scenes.length);
      } else if (e.key === 'ArrowRight') {
        onChangeIndex((activeIndex + 1) % scenes.length);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeIndex, scenes.length, onClose, onChangeIndex]);

  if (activeIndex === null) return null;
  const scene = scenes[activeIndex];
  if (!scene) return null;

  const isBackdrop = scene.id === activeBackdropId;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Просмотр кадра: ${scene.title}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#04060a]/90 p-4 backdrop-blur-xl sm:p-8"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#cfe6ff]/20 bg-[#0b1018] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-[#cfe6ff]/12 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs text-[#92a7be] tabular-nums">
              {scene.index} · {scene.location}
            </p>
            <h3 className="truncate font-display text-lg font-semibold text-[#f4f8fd]">
              {scene.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onApplyBackdrop(scene.id)}
              className={`min-h-[40px] rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                isBackdrop
                  ? 'bg-[#d4ebff] text-[#070a0f]'
                  : 'border border-[#cfe6ff]/20 bg-[#121a26] text-[#e6f1fc] hover:border-[#cfe6ff]/40'
              }`}
            >
              {isBackdrop ? 'Активный фон' : 'Сделать фоном'}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть просмотр"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#cfe6ff]/15 bg-[#121a26] text-[#d8ecff] transition-colors hover:border-[#cfe6ff]/35 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative flex max-h-[70vh] items-center justify-center bg-[#06090e]">
          <img
            src={scene.imageUrl}
            alt={scene.title}
            referrerPolicy="no-referrer"
            className="max-h-[70vh] w-full object-contain"
          />

          <button
            type="button"
            onClick={() => onChangeIndex((activeIndex - 1 + scenes.length) % scenes.length)}
            aria-label="Предыдущий кадр"
            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#cfe6ff]/25 bg-[#070a0f]/75 text-white backdrop-blur-md transition-colors hover:bg-[#141e2e]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => onChangeIndex((activeIndex + 1) % scenes.length)}
            aria-label="Следующий кадр"
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#cfe6ff]/25 bg-[#070a0f]/75 text-white backdrop-blur-md transition-colors hover:bg-[#141e2e]"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="border-t border-[#cfe6ff]/12 px-5 py-3.5 text-sm text-[#b9cadb]">
          {scene.caption}
        </div>
      </div>
    </div>
  );
}
