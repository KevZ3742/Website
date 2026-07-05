// src/components/icons/LinkIcons.tsx
// Small, generic line icons for project links.
// Deliberately geometric/functional rather than reproductions of any brand mark.

export function RepoIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 1.2 1.4 4.6v6.8L8 14.8l6.6-3.4V4.6L8 1.2Z"
        stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"
      />
      <path d="M8 1.2v13.6M1.4 4.6 8 8m0 0 6.6-3.4M8 8v6.8" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

export function ExternalIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.5 3.5H3a1 1 0 0 0-1 1V13a1 1 0 0 0 1 1h8.5a1 1 0 0 0 1-1V9.5"
        stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 2.5H13.5V6.5M13.3 2.7 7.8 8.2"
        stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlayIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.1" />
      <path d="M6.6 5.4 10.4 8l-3.8 2.6V5.4Z" fill="currentColor" />
    </svg>
  );
}

export function LockIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3.2" y="7.2" width="9.6" height="6.4" rx="1" stroke="currentColor" strokeWidth="1.1" />
      <path d="M5.2 7.2V5a2.8 2.8 0 1 1 5.6 0v2.2" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}