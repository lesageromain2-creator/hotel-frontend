export default function LsdevFooterCredit() {
  return (
    <p className="flex flex-wrap items-center justify-center gap-2 md:gap-2.5 text-center text-gray-400 text-xl sm:text-2xl md:text-3xl leading-tight pt-6 pb-4 border-t border-gray-800 mt-6">
      <span>Créé avec amour par</span>
      <a
        href="https://lesagedev.com"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-white hover:text-primary transition-colors"
      >
        LSDEV
      </a>
      <svg
        className="inline-block w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 text-pink-400 shrink-0"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </p>
  );
}
