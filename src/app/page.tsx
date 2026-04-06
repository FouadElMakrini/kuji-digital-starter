export default async function PlayHomePage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const query = searchParams ? await searchParams : undefined;
  const error =
    query?.error === "missing_code" ? "Veuillez entrer un code client." : "";

  return (
    <main className="page-shell client-shell code-entry-shell">
      <div className="container narrow compact-entry-width">
        <section className="card card-pad stack play-entry-card compact-entry-card">
          <div className="stack" style={{ gap: "0.45rem" }}>
            <span className="badge">Espace client</span>
            <h1 className="title">Ouvrir mes tickets</h1>
            <p className="subtitle">
              Entrez le code donné par le vendeur pour accéder à votre session.
            </p>
          </div>

          {error ? <div className="notice notice-error">{error}</div> : null}

          <form action="/api/play/open-session" method="POST" className="form-grid compact-entry-form">
            <div className="field">
              <label htmlFor="code">Code client</label>
              <input
                id="code"
                name="code"
                type="text"
                placeholder="Ex: A731"
                autoCapitalize="characters"
                autoComplete="off"
              />
            </div>

            <button className="button" type="submit">
              Commencer
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
