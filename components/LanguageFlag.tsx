import type { Locale } from '@/lib/simulation';

// Vector drawings: no emoji font, remote images or network requests required.
export default function LanguageFlag({ language }: { language: Locale }) {
  if (language === 'id') {
    return <svg className="language-flag" viewBox="0 0 36 24" aria-hidden="true" focusable="false">
      <path fill="#ce1126" d="M0 0h36v12H0z" />
      <path fill="#fff" d="M0 12h36v12H0z" />
    </svg>;
  }
  if (language === 'en') {
    return <svg className="language-flag" viewBox="0 0 60 30" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path fill="#012169" d="M0 0h60v30H0z" />
      <path stroke="#fff" strokeWidth="6" d="M0 0l60 30M60 0L0 30" />
      <path fill="#c8102e" d="M0 0v2.24L25.53 15H30zM60 0h-4.47L30 12.76V15zM60 30v-2.24L34.47 15H30zM0 30h4.47L30 17.24V15z" />
      <path stroke="#fff" strokeWidth="10" d="M30 0v30M0 15h60" />
      <path stroke="#c8102e" strokeWidth="6" d="M30 0v30M0 15h60" />
    </svg>;
  }
  const rays = Array.from({ length: 24 }, (_, i) => {
    const a = i * Math.PI / 12 - Math.PI / 2;
    const radius = i % 2 === 0 ? 4.5 : 2.25;
    return `${9 + radius * Math.cos(a)},${6 + radius * Math.sin(a)}`;
  }).join(' ');
  return <svg className="language-flag" viewBox="0 0 36 24" aria-hidden="true" focusable="false">
    <path fill="#fe0000" d="M0 0h36v24H0z" />
    <path fill="#000095" d="M0 0h18v12H0z" />
    <polygon points={rays} fill="#fff" />
    <circle cx="9" cy="6" r="2.55" fill="#fff" stroke="#000095" strokeWidth="0.4" />
  </svg>;
}
