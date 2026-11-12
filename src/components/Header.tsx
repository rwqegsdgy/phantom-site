interface HeaderProps {
  onMusicClick: () => void;
  onContactClick: () => void;
}

export function Header({ onMusicClick, onContactClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#cfe6ff]/10 bg-[#070a0f]/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1220px] items-center justify-between gap-8 px-5 py-3.5 sm:px-8">
        <a
          href="#profile"
          className="font-display text-lg font-semibold tracking-tight text-[#f4f8fd] whitespace-nowrap shrink-0 transition-opacity duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9bd0ff]"
        >
          The_Phantom-_-
        </a>

        <nav
          aria-label="Основная навигация"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#9fb2c7]"
        >
          <a
            href="#profile"
            className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-[#f4f8fd] hover:underline hover:underline-offset-8 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9bd0ff]"
          >
            Профиль
          </a>
          <button
            type="button"
            onClick={onMusicClick}
            className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-[#f4f8fd] hover:underline hover:underline-offset-8 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9bd0ff]"
          >
            Музыка
          </button>
          <a
            href="#contacts"
            className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-[#f4f8fd] hover:underline hover:underline-offset-8 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9bd0ff]"
          >
            Контакты
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onContactClick}
            className="min-h-[40px] px-4 py-2 text-xs font-semibold text-[#070a0f] bg-[#d4ebff] rounded-lg whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-[#edf6ff] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bd0ff]"
          >
            Связаться
          </button>
        </div>
      </div>
    </header>
  );
}
