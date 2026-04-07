import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page-shell">
      <div className="container narrow">
        <section className="card card-pad stack" style={{ gap: "1rem" }}>
          <span className="badge">K-minari</span>
          <h1 className="title">Ichiban Kuji Digital</h1>
          <p className="subtitle">
            Accédez à l’espace client ou au back-office.
          </p>

          <div className="form-actions">
            <Link href="/play" className="button">
              Espace client
            </Link>
            <Link href="/admin/login" className="button-secondary">
              Back-office
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}