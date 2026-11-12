import { useState } from 'react';
import { Expand, Image as ImageIcon } from 'lucide-react';
import { VisualScene } from '../data/profile';

interface VisualGalleryProps {
  scenes: VisualScene[];
  activeSceneId: string;
  onSelectBackdrop: (sceneId: string) => void;
  onOpenLightbox: (index: number) => void;
}

export function VisualGallery({
  scenes,
  activeSceneId,
  onSelectBackdrop,
  onOpenLightbox,
}: VisualGalleryProps) {
  const [failedIds, setFailedIds] = useState<Record<string, boolean>>({});

  return (
    <section
      id="gallery"
      className="relative z-20 mx-auto max-w-[1220px] px-5 pt-14 pb-8 sm:px-8"
    >
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-[#95abc1]">
            Визуальная коллекция · 4 сцены
          </p>
          <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-[#f4f8fd] sm:text-3xl">
            Атмосфера и кадры
          </h2>
        </div>
        <p className="max-w-md text-sm text-[#9cb2c9]">
          Нажмите на любой кадр, чтобы открыть полноэкранный просмотр, или сделайте сцену живым фоном сайта.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {scenes.map((scene, idx) => {
          const isWide = scene.aspect === 'wide';
          const isBackdrop = scene.id === activeSceneId;
          const hasError = failedIds[scene.id];

          return (
            <article
              key={scene.id}
              className={`group relative overflow-hidden rounded-2xl border transition-colors duration-200 ${
                isWide ? 'md:col-span-7' : 'md:col-span-5'
              } ${
                isBackdrop
                  ? 'border-[#cfe6ff]/40 bg-[#0d141f]'
                  : 'border-[#cfe6ff]/14 bg-[#0b1018]'
              }`}
            >
              <div className="relative h-72 w-full overflow-hidden sm:h-80 lg:h-[340px]">
                {hasError ? (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#162131] to-[#080c12] px-6 text-center">
                    <ImageIcon className="h-8 w-8 text-[#8ea4bc]" />
                    <span className="text-sm font-medium text-[#d4e5f7]">
                      {scene.title}
                    </span>
                  </div>
                ) : (
                  <img
                    src={scene.imageUrl}
                    alt={scene.title}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFailedIds((prev) => ({ ...prev, [scene.id]: true }))
                    }
                    draggable={false}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                )}

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05070b]/92 via-[#05070b]/35 to-transparent"
                />

                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-5 sm:p-6">
                  <div>
                    <p className="text-xs text-[#a5bbd1] tabular-nums">
                      {scene.index} · {scene.location}
                    </p>
                    <h3 className="mt-1 font-display text-xl font-semibold text-[#f4f8fd]">
                      {scene.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-[#c3d3e3]">
                      {scene.caption}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => onOpenLightbox(idx)}
                      className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-[#cfe6ff]/22 bg-[#0b1018]/80 px-3.5 py-2 text-xs font-medium text-[#eef6ff] backdrop-blur-md whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-[#cfe6ff]/45 hover:bg-[#141d2b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bd0ff]"
                    >
                      <Expand className="h-3.5 w-3.5" />
                      Открыть
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectBackdrop(scene.id)}
                      className={`min-h-[40px] rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bd0ff] ${
                        isBackdrop
                          ? 'bg-[#d4ebff] text-[#070a0f]'
                          : 'border border-[#cfe6ff]/20 bg-[#0b1018]/75 text-[#d4e7fa] hover:border-[#cfe6ff]/40 hover:bg-[#141d2b]'
                      }`}
                    >
                      {isBackdrop ? 'Установлен фоном' : 'Сделать фоном'}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
