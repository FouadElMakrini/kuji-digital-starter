import { BrandMark } from "@/components/brand-mark";

const errors: Record<string, string> = {
  missing: "Entre ton email et ton mot de passe.",
  invalid: "Identifiants invalides.",
  session: "La connexion a échoué. Réessaie ou redémarre le serveur local."
};

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? errors[params.error] : "";

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="auth-side card">
          <div className="auth-side-inner">
            <BrandMark href="/" />

            <div className="stack" style={{ gap: "0.5rem" }}>
              <span className="badge">Connexion vendeur</span>
              <h1 className="auth-side-title">Back-office K-minari</h1>
              <p className="auth-side-text">
                Gère tes Kujis, crée des codes clients, consulte l’historique et pilote ton stand
                facilement depuis ton espace vendeur.
              </p>
            </div>

            <div className="auth-side-points">
              <div className="auth-point">Création rapide de sessions client</div>
              <div className="auth-point">Historique des tirages</div>
              <div className="auth-point">Gestion simple des Kujis</div>
            </div>
          </div>
        </section>

        <section className="auth-card card">
          <div className="auth-card-inner">
            <div className="stack" style={{ gap: "0.5rem" }}>
              <span className="badge">Connexion vendeur</span>
              <h2 className="title">Entre dans ton back-office</h2>
              <p className="subtitle">
                Utilise ton compte administrateur pour accéder à la gestion K-minari.
              </p>
            </div>

            {errorMessage ? (
              <div className="notice notice-error">{errorMessage}</div>
            ) : null}

            <form action="/api/admin/login" method="POST" className="form-grid auth-form">
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                  autoComplete="username"
                />
              </div>

              <div className="field">
                <label htmlFor="password">Mot de passe</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <button className="button auth-submit" type="submit">
                Se connecter
              </button>

              <a className="button-secondary auth-back" href="/">
                Retour à l’accueil
              </a>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
