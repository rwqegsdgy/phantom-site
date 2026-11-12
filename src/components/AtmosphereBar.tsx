import { VisualScene } from '../data/profile';
import { useFrostTilt } from '../hooks/useFrostTilt';
import { SnowLevel } from './AtmosphereCanvas';

interface AtmosphereBarProps {
  snowLevel: SnowLevel;
  onSnowLevelChange: (level: SnowLevel) => void;
  scenes: VisualScene[];
  activeSceneId: string;
  onSelectScene: (id: string) => void;
}

const SNOW_OPTIONS: { value: SnowLevel; label: string }[] = [
  { value: 'light', label: 'Лёгкий снег' },
  { value: 'calm', label: 'Снегопад' },
  { value: 'blizzard', label: 'Метель' },
];

export function AtmosphereBar({
  snowLevel,
  onSnowLevelChange,
  scenes,
  activeSceneId,
  onSelectScene,
}: AtmosphereBarProps) {
  const tilt = useFrostTilt<HTMLDivElement>({ maxDeg: 4.5 });
  const activeSnowIdx = Math.max(
    0,
    SNOW_OPTIONS.findIndex((opt) => opt.value === snowLevel)
  );

  return (
    <section
      aria-label="Настройки фона и снега"
      className="relative z-20 mx-auto max-w-[1000px] px-5 pt-10 pb-4 sm:px-8"
    >
      <div
        ref={tilt.ref}
        onPointerMove={tilt.onPointerMove}
        onPointerLeave={tilt.onPointerLeave}
        style={{ willChange: 'transform' }}
        className="flex flex-col gap-5 rounded-[28px] border border-[#dceefa]/22 bg-[#0a0f18]/34 p-5 sm:p-6 backdrop-blur-[2px] shadow-[0_0_24px_rgba(192,218,238,0.08),0_14px_32px_rgba(0,0,0,0.22)]"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-[#f4f8fd]">
              Выбор фона и снега
            </h2>
            <p className="mt-0.5 text-xs text-[#b7c7d9]">
              Настройка атмосферы страницы
            </p>
          </div>

          <div className="relative grid grid-cols-3 rounded-xl border border-[#ffffff]/18 bg-[#ffffff]/[0.07] p-1 w-full sm:w-auto">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-1 bottom-1 left-1 rounded-lg bg-[#d4ebff] shadow-[0_0_16px_rgba(174,223,255,0.35)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                width: 'calc((100% - 8px) / 3)',
                transform: `translate3d(${activeSnowIdx * 100}%, 0, 0)`,
              }}
            />
            {SNOW_OPTIONS.map((opt) => {
              const active = snowLevel === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSnowLevelChange(opt.value)}
                  className={`relative z-10 min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bd0ff] ${
                    active
                      ? 'text-[#070a0f] font-semibold'
                      : 'text-[#d4e0ec] hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {scenes.map((scene) => {
            const active = scene.id === activeSceneId;
            return (
              <button
                key={scene.id}
                type="button"
                onClick={() => onSelectScene(scene.id)}
                className={`group flex min-h-[46px] items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-left transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bd0ff] ${
                  active
                    ? 'border-[#d4ebff]/65 bg-[#d4ebff]/20 text-[#ffffff] shadow-[0_0_20px_rgba(174,223,255,0.22)]'
                    : 'border-[#ffffff]/18 bg-[#ffffff]/[0.07] text-[#dce7f3] hover:border-[#cfe6ff]/45 hover:bg-[#ffffff]/[0.15] hover:shadow-[0_0_16px_rgba(174,223,255,0.2)]'
                }`}
              >
                <span className="truncate text-xs font-semibold transition-transform duration-200 group-hover:translate-x-0.5">
                  {scene.index}. {scene.title}
                </span>
                <span
                  className={`text-[11px] shrink-0 transition-all duration-200 ${
                    active
                      ? 'font-semibold text-[#dff3ff] scale-105'
                      : 'text-[#9eb5cc] group-hover:text-[#cfe4f7]'
                  }`}
                >
                  {active ? 'Выбран' : 'Выбрать'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
