import { useState } from 'react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import { PROFILE, SOCIAL_LINKS } from '../data/profile';
import { useFrostTilt } from '../hooks/useFrostTilt';
import { DiscordIcon, GitHubIcon, ServerIcon, SteamIcon } from './BrandIcons';

export function ContactSection() {
  const [copied, setCopied] = useState(false);
  const tilt = useFrostTilt<HTMLDivElement>({ maxDeg: 4.2 });

  const handleCopyDiscord = async () => {
    try {
      await navigator.clipboard.writeText(PROFILE.discordTag);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore if clipboard unavailable
    }
  };

  const serverLink = SOCIAL_LINKS.find((s) => s.id === 'server');
  const discordLink = SOCIAL_LINKS.find((s) => s.id === 'discord');
  const steamLink = SOCIAL_LINKS.find((s) => s.id === 'steam');
  const githubLink = SOCIAL_LINKS.find((s) => s.id === 'github');

  return (
    <section
      id="contacts"
      className="relative z-20 mx-auto max-w-[1000px] px-5 pt-4 pb-16 sm:px-8"
    >
      <div
        ref={tilt.ref}
        onPointerMove={tilt.onPointerMove}
        onPointerLeave={tilt.onPointerLeave}
        style={{ willChange: 'transform' }}
        className="rounded-[28px] border border-[#dceefa]/22 bg-[#0a0f18]/34 p-6 sm:p-8 backdrop-blur-[2px] shadow-[0_0_24px_rgba(192,218,238,0.08),0_14px_32px_rgba(0,0,0,0.22)]"
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <p className="text-xs font-medium tracking-wide text-[#a9bdd2]">
              Прямая связь · Сообщество
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#f4f8fd] text-balance sm:text-3xl">
              Присоединяйся к серверу {PROFILE.serverName} или напиши напрямую
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#c6d4e3]">
              Быстрее всего связаться через Discord по тегу {PROFILE.discordTag} или зайти на сервер {PROFILE.serverName}. Все профили ниже ведут на актуальные страницы.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {serverLink && (
                <a
                  href={serverLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex min-h-[44px] items-center gap-2.5 rounded-xl bg-[#d4ebff] px-5 py-2.5 text-sm font-semibold text-[#070a0f] whitespace-nowrap shrink-0 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#edf6ff] hover:shadow-[0_0_20px_rgba(174,223,255,0.4)] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bd0ff]"
                >
                  <ServerIcon className="h-4 w-4" />
                  Открыть сервер {PROFILE.serverName}
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              )}

              <button
                type="button"
                onClick={handleCopyDiscord}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#ffffff]/24 bg-[#ffffff]/[0.09] px-4 py-2.5 text-sm font-medium text-[#f4f8fd] whitespace-nowrap shrink-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#cfe6ff]/45 hover:bg-[#ffffff]/[0.18] hover:shadow-[0_0_18px_rgba(174,223,255,0.28)] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bd0ff]"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-[#b8e2ff]" />
                    Тег скопирован: {PROFILE.discordTag}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Копировать Discord: {PROFILE.discordTag}
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {discordLink && (
              <a
                href={discordLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-4 rounded-xl border border-[#ffffff]/18 bg-[#ffffff]/[0.07] px-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#cfe6ff]/45 hover:bg-[#ffffff]/[0.15] hover:shadow-[0_0_18px_rgba(174,223,255,0.22)]"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <DiscordIcon className="h-5 w-5 shrink-0 text-[#dceeff] transition-transform duration-200 group-hover:scale-110" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#f1f6fc]">
                      Discord Профиль
                    </span>
                    <span className="block truncate text-xs text-[#c5d4e4]">
                      {discordLink.handle}
                    </span>
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[#b4c8dc] transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#dceeff]" />
              </a>
            )}

            {steamLink && (
              <a
                href={steamLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-4 rounded-xl border border-[#ffffff]/18 bg-[#ffffff]/[0.07] px-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#cfe6ff]/45 hover:bg-[#ffffff]/[0.15] hover:shadow-[0_0_18px_rgba(174,223,255,0.22)]"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <SteamIcon className="h-5 w-5 shrink-0 text-[#dceeff] transition-transform duration-200 group-hover:scale-110" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#f1f6fc]">
                      Steam Основной
                    </span>
                    <span className="block truncate text-xs text-[#c5d4e4]">
                      {steamLink.handle}
                    </span>
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[#b4c8dc] transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#dceeff]" />
              </a>
            )}

            {githubLink && (
              <a
                href={githubLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-4 rounded-xl border border-[#ffffff]/18 bg-[#ffffff]/[0.07] px-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#cfe6ff]/45 hover:bg-[#ffffff]/[0.15] hover:shadow-[0_0_18px_rgba(174,223,255,0.22)]"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <GitHubIcon className="h-5 w-5 shrink-0 text-[#dceeff] transition-transform duration-200 group-hover:scale-110" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#f1f6fc]">
                      GitHub Репозитории
                    </span>
                    <span className="block truncate text-xs text-[#c5d4e4]">
                      {githubLink.handle}
                    </span>
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[#b4c8dc] transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#dceeff]" />
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
