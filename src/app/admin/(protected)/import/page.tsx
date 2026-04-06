
const errors: Record<string, string> = {
  missing_url: "Colle un lien 1kuji valide.",
  duplicate_source: "Cette page 1kuji a déjà été importée.",
  import_failed: "L’import a échoué. Vérifie le lien et le message technique ci-dessous."
};

export default async function AdminImportPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string; sourceUrl?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? errors[params.error] ?? errors.import_failed : "";
  const technicalMessage = params.message ? decodeURIComponent(String(params.message)) : "";
  const sourceUrl = String(params.sourceUrl ?? "");

  return (
    <section className="card card-pad stack compact-form-shell">
      <div>
        <h2 className="title">Importer depuis 1kuji.com</h2>
        <p className="subtitle">
          Colle l’URL d’une page officielle 1kuji. Le site essaiera de récupérer le nom,
          l’image principale, les lots et leurs images, puis préremplira le formulaire de création pour que tu puisses corriger les noms, lettres, quantités et images avant enregistrement.
        </p>
      </div>

      {errorMessage ? <div className="notice notice-error">{errorMessage}</div> : null}
      {technicalMessage ? <div className="notice notice-error">{technicalMessage}</div> : null}

      <form action="/api/admin/kujis/import-from-1kuji" method="POST" className="form-grid">
        <div className="field">
          <label htmlFor="sourceUrl">Lien 1kuji</label>
          <input
            id="sourceUrl"
            name="sourceUrl"
            type="url"
            defaultValue={sourceUrl}
            placeholder="https://1kuji.com/products/eva18"
            required
          />
        </div>

        <div className="grid grid-2">
          <div className="field">
            <label htmlFor="status">Statut initial</label>
            <select id="status" name="status" defaultValue="draft">
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="gridColumns">Colonnes de grille</label>
            <input id="gridColumns" name="gridColumns" type="number" min={3} max={10} defaultValue={8} />
          </div>
        </div>

        <div className="notice">
          L’import est en best effort : les noms sont auto-traduits au mieux vers le français,
          mais vérifie toujours le résultat avant utilisation en convention.
        </div>

        <button className="button" type="submit">
          Analyser et préremplir le formulaire
        </button>
      </form>
    </section>
  );
}
