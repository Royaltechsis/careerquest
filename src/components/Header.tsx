import type { ReactNode } from "react";
import Link from "next/link";

/** Site header. In the app it carries the main nav and the account button; elsewhere `right` is shown. */
export default function Header({ nav, right }: { nav?: ReactNode; right?: ReactNode }) {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="top">
        <div className="top-in">
          <Link className="logo" href="/" aria-label="CareerQuest home">
            <svg viewBox="0 0 32 32" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="9" fill="#17202A" /><path d="M16 5l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#FFC145" /><circle cx="16" cy="16" r="2.4" fill="#FF6B35" /></svg>
            <span>Career<b>Quest</b></span>
          </Link>
          {nav !== undefined ? (
            <>
              <nav id="topnav" className="topnav" aria-label="Main">{nav}</nav>
              <div id="me" className="me">{right}</div>
            </>
          ) : (
            <div className="me">{right}</div>
          )}
        </div>
      </header>
    </>
  );
}
