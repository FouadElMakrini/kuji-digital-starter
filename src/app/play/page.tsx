import { BrandMark } from "@/components/brand-mark";

const errors: Record<string, string> = {
  missing_code: "Entre ton code client."
};

export default async function PlayHomePage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? errors[params.error] : "";

  return (
    <main className="page-shell client-shell">
        <div className="container narrow">
          <section className="play-entry card card-pad stack center play-entry-card">
            <BrandMark href="/play" />

            <div className="stack" style={{ gap: "0.45rem" }}>
              <span className="badge">Espace client</span>
              <h1 className="title">Entre ton code pour ouvrir tes tickets</h1>
              <p className="subtitle">
                Le vendeur K-minari t’a donné un code. Entre-le ci-dessous.
              </p>
            </div>

            {errorMessage ? (
              <div className="notice notice-error">{errorMessage}</div>
            ) : null}

            <form action="/api/play/open-session" method="POST" className="form-grid">
              <div className="field">
                <label htmlFor="code">Code client</label>
                <input
                  id="code"
                  name="code"
                  placeholder="KM-AB12"
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
