import { PrizeTierBuilder } from "@/components/prize-tier-builder";

const errors: Record<string, string> = {
  create_invalid: "Le formulaire n’est pas valide."
};

type SearchParams = {
  error?: string;
  prefill?: string;
  fromImport?: string;
};

function decodePrefill(raw?: string) {
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

export default async function NewKujiPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? errors[params.error] : "";
  const prefill = decodePrefill(params.prefill);
  const imported = params.fromImport === "1";

  const initialRows = Array.isArray(prefill?.prizeTiers)
    ? prefill.prizeTiers
    : undefined;

  return (
    <section className="card card-pad stack compact-form-shell">
      <div className="stack" style={{ gap: "0.55rem" }}>
        {imported ? <span className="badge">Import 1Kuji détecté</span> : null}
        <h2 className="title">Créer un nouveau Kuji</h2>
        <p className="subtitle">
          {imported
            ? "Les champs ont été préremplis. Modifie les noms, lettres, quantités ou images avant d’enregistrer."
            : "Définis les lots, le statut initial et la taille de la grille."}
        </p>
      </div>

      {errorMessage ? <div className="notice notice-error">{errorMessage}</div> : null}

      <form action="/api/admin/kujis/create" method="POST" className="form-grid compact-form-grid">
        <div className="field">
          <label htmlFor="name">Nom</label>
          <input
            id="name"
            name="name"
            placeholder="Ex: One Piece Anniversary"
            defaultValue={prefill?.name ?? ""}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            placeholder="Description courte du Kuji"
            defaultValue={prefill?.description ?? ""}
          />
        </div>

        <div className="grid grid-2 compact-grid-2">
          <div className="field">
            <label htmlFor="coverImageUrl">Image de couverture (optionnel)</label>
            <input
              id="coverImageUrl"
              name="coverImageUrl"
              type="url"
              placeholder="https://..."
              defaultValue={prefill?.coverImageUrl ?? ""}
            />
          </div>

          <div className="field">
            <label htmlFor="sourceUrl">Source / lien officiel (optionnel)</label>
            <input
              id="sourceUrl"
              name="sourceUrl"
              type="url"
              placeholder="https://..."
              defaultValue={prefill?.sourceUrl ?? ""}
            />
          </div>
        </div>

        <div className="grid grid-2 compact-grid-2">
          <div className="field">
            <label htmlFor="status">Statut</label>
            <select id="status" name="status" defaultValue={prefill?.status ?? "draft"}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="gridColumns">Colonnes de grille</label>
            <input
              id="gridColumns"
              name="gridColumns"
              type="number"
              min={2}
              max={12}
              defaultValue={prefill?.gridColumns ?? 8}
              required
            />
          </div>
        </div>

        <div className="stack" style={{ gap: "0.75rem" }}>
          <div className="section-head compact-section-head">
            <div>
              <h3 className="title compact-section-title">Lots</h3>
              <p className="subtitle">Tu peux tout modifier avant l’enregistrement.</p>
            </div>
          </div>
          <PrizeTierBuilder initialRows={initialRows} />
        </div>

        <div className="form-actions" style={{ justifyContent: "space-between" }}>
          <a className="button-secondary" href="/admin/import">Retour import</a>
          <button className="button" type="submit">
            Enregistrer le Kuji
          </button>
        </div>
      </form>
    </section>
  );
}
