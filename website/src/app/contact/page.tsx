// src/app/contact/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { MailIcon, ProfileIcon, CodeBracketIcon, ExternalIcon } from "../../components/icons/LinkIcons";

export const metadata: Metadata = {
  title: "contact — kev.dev",
  description: "Get in touch.",
};

const CHANNELS = [
  {
    label: "Email",
    value: "kzhang3742@gmail.com",
    href: "mailto:kzhang3742@gmail.com",
    icon: MailIcon,
  },
  {
    label: "LinkedIn",
    value: "linkedin.com/in/kevz3742",
    href: "https://www.linkedin.com/in/kevz3742",
    icon: ProfileIcon,
  },
  {
    label: "GitHub",
    value: "github.com/KevZ3742",
    href: "https://github.com/KevZ3742",
    icon: CodeBracketIcon,
  },
];

export default function ContactPage() {
  return (
    <div className="fixed inset-0 z-10 overflow-y-auto font-mono">
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-[13px] tracking-[0.15em] uppercase text-tx">contact</h1>
          <p className="text-[10px] text-muted mt-0.5">
            email · linkedin · github
          </p>
        </div>
        <Link
          href="/"
          className="text-[10px] text-muted border border-border2 px-2.5 py-1 hover:text-tx hover:border-muted transition-colors tracking-[0.06em]"
        >
          ← home
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 sm:px-8 py-6">
        <p className="text-[13px] text-muted mb-6">
          Feel free to reach out through any of the channels below.
        </p>

        {/* ── Channels ── */}
        <div className="divide-y divide-border">
          {CHANNELS.map(({ label, value, href, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="group flex items-center justify-between gap-4 py-5 first:pt-0 last:pb-0 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="flex items-center justify-center w-9 h-9 border border-border2 text-muted group-hover:text-green group-hover:border-green transition-colors shrink-0">
                  <Icon className="w-4 h-4" />
                </span>
                <div className="flex flex-col leading-snug">
                  <span className="text-[11px] tracking-[0.15em] uppercase text-label">
                    {label}
                  </span>
                  <span className="text-[15px] text-tx group-hover:text-green transition-colors">
                    {value}
                  </span>
                </div>
              </div>
              <ExternalIcon className="w-3.5 h-3.5 text-label group-hover:text-green transition-colors shrink-0" />
            </a>
          ))}
        </div>

        <footer className="py-14 text-center">
          <span className="text-[11px] tracking-[0.15em] text-label uppercase">
            end of list
          </span>
        </footer>
      </div>
    </div>
  );
}