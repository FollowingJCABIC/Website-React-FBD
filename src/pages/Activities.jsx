function AppLinkAction({ canUseApps, href, children, onRequestSignIn }) {
  if (canUseApps) {
    return (
      <a className="pill" href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }

  return (
    <button type="button" className="pill locked-pill" onClick={onRequestSignIn}>
      Sign in to open
    </button>
  );
}

export default function Activities({ canUseApps, onRequestSignIn }) {
  return (
    <>
      <section className="hero">
        <p className="eyebrow">Activities</p>
        <h1>Interactive labs and external practice apps.</h1>
        <p className="lead">
          Keep this as a launch board for focused practice sessions across language, music, games, and study tools.
        </p>
      </section>

      <section className="external-apps">
        <div className="apps-intro">
          <p className="eyebrow">More Activities</p>
          <h2>Other Activities & Applications</h2>
          <p>Visit these standalone apps for more interactive practice and creative work.</p>
          {!canUseApps ? <p className="lock-note">Visitor or full sign-in is required to open app links.</p> : null}
        </div>

        <div className="apps-grid">
          <article className="app-link-card">
            <h3>Dictionary Thesaurus Translator</h3>
            <p>Search definitions, synonyms, and quick translations in one focused workspace.</p>
            <AppLinkAction
              canUseApps={canUseApps}
              href="https://dictionary-thesaurus-translator.vercel.app"
              onRequestSignIn={onRequestSignIn}
            >
              Open dictionary-thesaurus-translator.vercel.app
            </AppLinkAction>
          </article>

          <article className="app-link-card">
            <h3>Language Studio</h3>
            <p>Interactive language lessons and practice tools for daily study sessions.</p>
            <AppLinkAction
              canUseApps={canUseApps}
              href="https://language-studio-five.vercel.app"
              onRequestSignIn={onRequestSignIn}
            >
              Open language-studio-five.vercel.app
            </AppLinkAction>
          </article>

          <article className="app-link-card">
            <h3>Color Mixing App</h3>
            <p>Hands-on additive and subtractive color labs, with guided visual activities.</p>
            <AppLinkAction
              canUseApps={canUseApps}
              href="https://color-mixing-app.vercel.app"
              onRequestSignIn={onRequestSignIn}
            >
              Open color-mixing-app.vercel.app
            </AppLinkAction>
          </article>

          <article className="app-link-card">
            <h3>Songwriter App</h3>
            <p>Songwriting prompts, drafting workspace, and music-theory tools for practice.</p>
            <AppLinkAction
              canUseApps={canUseApps}
              href="https://songwriter-app.vercel.app"
              onRequestSignIn={onRequestSignIn}
            >
              Open songwriter-app.vercel.app
            </AppLinkAction>
          </article>

          <article className="app-link-card">
            <h3>Crossword Creator</h3>
            <p>Generate custom crosswords from your own word lists and export results.</p>
            <AppLinkAction
              canUseApps={canUseApps}
              href="https://crossword-creator-app.vercel.app"
              onRequestSignIn={onRequestSignIn}
            >
              Open crossword-creator-app.vercel.app
            </AppLinkAction>
          </article>

          <article className="app-link-card">
            <h3>Texas Hold'em Web</h3>
            <p>Play the browser version of your Texas Hold'em project and test game flow.</p>
            <AppLinkAction
              canUseApps={canUseApps}
              href="https://texas-holdem-lan-web.vercel.app"
              onRequestSignIn={onRequestSignIn}
            >
              Open texas-holdem-lan-web.vercel.app
            </AppLinkAction>
          </article>

          <article className="app-link-card">
            <h3>Sudoku Studio</h3>
            <p>Play seeded Sudoku with notes, hints, strategy guides, and custom themes.</p>
            <AppLinkAction canUseApps={canUseApps} href="/apps/sudoku/index.html" onRequestSignIn={onRequestSignIn}>
              Open Sudoku Studio
            </AppLinkAction>
          </article>

          <article className="app-link-card">
            <h3>Bible Mastery Lab</h3>
            <p>Cross-reference drills, motif testing, alphabet practice, and scripture lookup tools.</p>
            <AppLinkAction canUseApps={canUseApps} href="/apps/bible/index.html" onRequestSignIn={onRequestSignIn}>
              Open Bible Mastery Lab
            </AppLinkAction>
          </article>
        </div>
      </section>
    </>
  );
}
