interface PrisonIllustrationProps {
  className?: string;
}

export default function PrisonIllustration({ className }: PrisonIllustrationProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      focusable="false"
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 143H148" stroke="#94A3B8" strokeWidth="6" strokeLinecap="round" />
      <path d="M24 59L80 25L136 59V135H24V59Z" fill="#CBD5E1" stroke="#475569" strokeWidth="6" strokeLinejoin="round" />
      <path d="M19 61L80 20L141 61" stroke="#64748B" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M35 69H125" stroke="#94A3B8" strokeWidth="4" strokeDasharray="8 7" />
      <rect x="57" y="78" width="46" height="57" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="5" />
      <path d="M65 82V132M77 82V132M89 82V132M101 82V132" stroke="#CBD5E1" strokeWidth="5" />
      <path d="M57 96H103M57 114H103" stroke="#CBD5E1" strokeWidth="4" />
      <path d="M42 81H48M42 93H48M42 105H48M112 81H118M112 93H118M112 105H118" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
      <circle cx="80" cy="106" r="6" fill="#FBBF24" />
      <path d="M77 105V101C77 97 83 97 83 101V105" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
      <rect x="31" y="123" width="15" height="12" rx="2" fill="#64748B" />
      <rect x="114" y="123" width="15" height="12" rx="2" fill="#64748B" />
    </svg>
  );
}
