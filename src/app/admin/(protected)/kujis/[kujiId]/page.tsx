import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { SessionCreatedCard } from "@/components/admin/session-created-card";

const errors: Record<string, string> = {
  session_validation: "La session n’a pas pu être créée.",
  session_revoke: "Impossible de révoquer la session.",
  status_update: "Impossible de mettre à jour le statut.",
  wrong_password: "Mot de passe incorrect pour ajouter des tickets.",
  no_extra_tickets: "Aucune quantité supplémentaire n’a été indiquée.",
  add_blocked: "Tu ne peux ajouter des tickets qu’à un Kuji actif."
};

const successMessages: Record<string, string> = {
  session_created: "Session créée.",
  session_revoked: "La session a été révoquée.",
  status_updated: "Le statut du Kuji a été mis à jour.",
  kuji_created: "Le Kuji a été créé.",
  kuji_duplicated: "Le Kuji a bien été dupliqué.",
  tickets_added: "Des tickets ont été ajoutés au Kuji.",
  kuji_imported: "Le Kuji a été importé depuis 1kuji.com."
};

function getStatusClass(status: string) {
  switch (status) {
    case "active":
      return "status-chip status-active";
    case "closed":
      return "status-chip status-closed";
    default:
      return "status-chip status-draft";
  }
}

function getLetterChipClass(letter: string) {
  switch (letter.toUpperCase()) {
    case "A":
      return "letter-chip letter-chip-a";
    case "B":
      return "letter-chip letter-chip-b";
    case "C":
      return "letter-chip letter-chip-c";
    case "D":
      return "letter-chip letter-chip-d";
    case "E":
      return "letter-chip letter-chip-e";
    case "F":
      return "letter-chip letter-chip-f";
    default:
      return "letter-chip";
  }
}

export default async function KujiDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ kujiId: string }>;
  searchParams: Promise<{ createdCode?: string; error?: string; success?: string }>;
}) {
  const { kujiId } = await params;
  const query = await searchParams;

  const kuji = await prisma.kuji.findUnique({
    where: { id: kujiId },
    include: {
      _count: {
        select: {
          sessions: true,
          drawLogs: true
        }
      },
      prizeTiers: { orderBy: { displayOrder: "asc" } },
      tickets: {
        orderBy: { gridPosition: "asc" },
        select: {
          id: true,
          serialNumber: true,
          gridPosition: true,
          status: true,
          letter: true
        }
      },
      sessions: {
        orderBy: { createdAt: "desc" },
        take: 12
      },
      drawLogs: {
        orderBy: { openedAt: "desc" },
        take: 12
      }
    }
  });

  if (!kuji) notFound();

  const availableTickets = kuji.tickets.filter((ticket) => ticket.status === "available").length;
  const totalTickets = kuji.tickets.length;
  const openedTickets = totalTickets - availableTickets;
  const columns = kuji.gridColumns;
  const errorMessage = query.error ? errors[query.error] : "";
  const successMessage =
    query.success && !query.createdCode ? successMessages[query.success] : "";

  const remainingByLetter = kuji.prizeTiers.map((tier) => ({
    id: tier.id,
    letter: tier.letter,
    label: tier.label,
    total: tier.quantity,
    remaining: kuji.tickets.filter(
      (ticket) => ticket.status === "available" && ticket.letter === tier.letter
    ).length
  }));

  return (
    <div className="stack">
      {query.createdCode ? <SessionCreatedCard code={query.createdCode} /> : null}

      <section className="dashboard-hero card card-pad stack">
        <div className="section-head">
          <div>
            <div className="form-actions">
              <span className={getStatusClass(kuji.status)}>{kuji.status}</span>
              <span className="badge">
                {availableTickets}/{totalTickets} tickets restants
              </span>
            </div>
            <h2 className="title">{kuji.name}</h2>
            <p className="subtitle">{kuji.description || "Pas de description"}</p>
            {kuji.sourceUrl ? (
              <p className="subtitle">
                Source : <a href={kuji.sourceUrl} target="_blank" rel="noreferrer">page 1kuji</a>
              </p>
            ) : null}
          </div>

          <div className="form-actions">
            <Link className="button-secondary" href="/admin/dashboard">
              Retour dashboard
            </Link>

            <form action="/api/admin/kujis/status" method="POST">
              <input type="hidden" name="kujiId" value={kuji.id} />
              <input
                type="hidden"
                name="status"
                value={
                  kuji.status === "active"
                    ? "closed"
                    : kuji.status === "closed"
                      ? "active"
                      : "active"
                }
              />
              <button className="button-secondary" type="submit">
                {kuji.status === "active"
                  ? "Fermer"
                  : kuji.status === "closed"
                    ? "Réactiver"
                    : "Activer"}
              </button>
            </form>

            <form action="/api/admin/kujis/duplicate" method="POST">
              <input type="hidden" name="kujiId" value={kuji.id} />
              <ConfirmSubmitButton
                className="button-secondary"
                confirmMessage={`Dupliquer le Kuji "${kuji.name}" ?`}
              >
                Dupliquer
              </ConfirmSubmitButton>
            </form>
          </div>
        </div>

        {successMessage ? <div className="notice">{successMessage}</div> : null}
        {errorMessage ? <div className="notice notice-error">{errorMessage}</div> : null}

        {kuji.coverImageUrl ? (
          <div className="kuji-cover-wrap kuji-cover-wrap-large">
            <img src={kuji.coverImageUrl} alt={kuji.name} className="kuji-cover-image" />
          </div>
        ) : null}

        <div className="grid grid-3">
          <div className="stat-card card card-pad">
            <p className="subtitle">Tickets totaux</p>
            <div className="kpi">{totalTickets}</div>
          </div>
          <div className="stat-card card card-pad">
            <p className="subtitle">Tickets restants</p>
            <div className="kpi">{availableTickets}</div>
          </div>
          <div className="stat-card card card-pad">
            <p className="subtitle">Colonnes de grille</p>
            <div className="kpi">{columns}</div>
          </div>
        </div>
      </section>

      <section className="grid grid-2">
        <div className="card card-pad stack">
          <div className="section-head">
            <div>
              <h3 className="title">Lots</h3>
              <p className="subtitle">Quantités restantes par lettre.</p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Lettre</th>
                  <th>Image</th>
                  <th>Lot</th>
                  <th>Total</th>
                  <th>Restants</th>
                </tr>
              </thead>
              <tbody>
                {remainingByLetter.map((tier) => (
                  <tr key={tier.id}>
                    <td>
                      <span className={getLetterChipClass(tier.letter)}>{tier.letter}</span>
                    </td>
                    <td>
                      {kuji.prizeTiers.find((item) => item.id === tier.id)?.imageUrl ? (
                        <img
                          src={kuji.prizeTiers.find((item) => item.id === tier.id)?.imageUrl ?? ""}
                          alt={tier.label}
                          className="tier-thumb"
                        />
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>{tier.label}</td>
                    <td>{tier.total}</td>
                    <td>{tier.remaining}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card card-pad stack">
          <div>
            <h3 className="title">Créer une session client</h3>
            <p className="subtitle">
              Le code généré sera mis en avant tout de suite pour que tu puisses le copier.
            </p>
          </div>

          <form action="/api/admin/sessions/create" method="POST" className="form-grid">
            <input type="hidden" name="kujiId" value={kuji.id} />
            <input type="hidden" name="redirectTo" value={`/admin/kujis/${kuji.id}`} />

            <div className="field">
              <label htmlFor="allowedDraws">Nombre de tirages payés</label>
              <input
                id="allowedDraws"
                name="allowedDraws"
                type="number"
                min={1}
                max={100}
                defaultValue={1}
              />
            </div>

            <div className="field">
              <label htmlFor="expiresInMinutes">
                Expiration (minutes, 0 = pas d’expiration)
              </label>
              <input
                id="expiresInMinutes"
                name="expiresInMinutes"
                type="number"
                min={0}
                max={1440}
                defaultValue={0}
              />
            </div>

            <button className="button" type="submit">
              Générer un code client
            </button>
          </form>

          <div className="stack" style={{ gap: "0.5rem" }}>
            <p className="subtitle">Création rapide</p>
            <form action="/api/admin/sessions/create" method="POST" className="quick-actions">
              <input type="hidden" name="kujiId" value={kuji.id} />
              <input type="hidden" name="expiresInMinutes" value="0" />
              <input type="hidden" name="redirectTo" value={`/admin/kujis/${kuji.id}`} />

              <button className="button-secondary" type="submit" name="allowedDraws" value="1">
                1 ticket
              </button>
              <button className="button-secondary" type="submit" name="allowedDraws" value="2">
                2 tickets
              </button>
              <button className="button-secondary" type="submit" name="allowedDraws" value="3">
                3 tickets
              </button>
              <button className="button-secondary" type="submit" name="allowedDraws" value="5">
                5 tickets
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="grid grid-2">
        <div className="card card-pad stack">
          <h3 className="title">Ajouter des tickets à ce Kuji</h3>
          <p className="subtitle">
            Fonction active uniquement si le Kuji est en statut <strong>active</strong>.
          </p>

          {kuji.status !== "active" ? (
            <div className="notice notice-error">
              Ce Kuji n’est pas actif. Active-le d’abord pour ajouter des tickets.
            </div>
          ) : (
            <form action="/api/admin/kujis/add-tickets" method="POST" className="form-grid">
              <input type="hidden" name="kujiId" value={kuji.id} />

              <div className="stack">
                {remainingByLetter.map((tier) => (
                  <div key={tier.id} className="add-ticket-row">
                    <div>
                      <span className={getLetterChipClass(tier.letter)}>{tier.letter}</span>
                      <div className="subtitle">{tier.label}</div>
                    </div>

                    <div className="field">
                      <label htmlFor={`tier_${tier.id}`}>À ajouter</label>
                      <input
                        id={`tier_${tier.id}`}
                        name={`tier_${tier.id}`}
                        type="number"
                        min={0}
                        defaultValue={0}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="field">
                <label htmlFor="password">Mot de passe admin</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Confirmer avec le mot de passe admin"
                />
              </div>

              <button className="button" type="submit">
                Ajouter les tickets
              </button>
            </form>
          )}
        </div>

        <div className="card card-pad stack">
          <div className="section-head">
            <div>
              <h3 className="title">Aperçu de la grille</h3>
              <p className="subtitle">
                Les tickets ouverts sont grisés. La disposition reste fixe.
              </p>
            </div>
          </div>

          <div
            className="ticket-grid"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {kuji.tickets.map((ticket) => (
              <button
                key={ticket.id}
                className={`ticket-button ${ticket.status === "opened" ? "ticket-opened" : ""}`}
                disabled
              >
                {ticket.status === "opened" ? "Ouvert" : `Ticket ${ticket.serialNumber}`}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-2">
        <div className="card card-pad stack">
          <h3 className="title">Sessions récentes</h3>
          {kuji.sessions.length === 0 ? (
            <div className="empty-state">Aucune session pour ce Kuji.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Tirages</th>
                    <th>Statut</th>
                    <th>Créée le</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {kuji.sessions.map((session) => (
                    <tr key={session.id}>
                      <td><strong>{session.accessCode}</strong></td>
                      <td>
                        {session.usedDraws}/{session.allowedDraws}
                      </td>
                      <td>{session.status}</td>
                      <td>{formatDate(session.createdAt)}</td>
                      <td>
                        {session.status === "active" ? (
                          <form action="/api/admin/sessions/revoke" method="POST">
                            <input type="hidden" name="sessionId" value={session.id} />
                            <input type="hidden" name="kujiId" value={kuji.id} />
                            <ConfirmSubmitButton
                              className="button-secondary"
                              confirmMessage={`Révoquer la session ${session.accessCode} ?`}
                            >
                              Révoquer
                            </ConfirmSubmitButton>
                          </form>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card card-pad stack">
          <h3 className="title">Derniers tirages</h3>
          {kuji.drawLogs.length === 0 ? (
            <div className="empty-state">Aucun ticket ouvert pour ce Kuji.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Lettre</th>
                    <th>Ticket</th>
                    <th>Position</th>
                    <th>Ouvert le</th>
                  </tr>
                </thead>
                <tbody>
                  {kuji.drawLogs.map((draw) => (
                    <tr key={draw.id}>
                      <td>
                        <span className={getLetterChipClass(draw.letter)}>
                          {draw.letter}
                        </span>
                      </td>
                      <td>#{draw.ticketSerialNumber}</td>
                      <td>{draw.gridPosition + 1}</td>
                      <td>{formatDate(draw.openedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="card card-pad stack">
        <h3 className="title">Suppression définitive</h3>
        <p className="subtitle">
          Cette action supprime complètement le Kuji, ses tickets, ses sessions et son historique.
        </p>

        <form action="/api/admin/kujis/delete" method="POST">
          <input type="hidden" name="kujiId" value={kuji.id} />
          <ConfirmSubmitButton
            className="button-danger"
            confirmMessage={`Supprimer définitivement le Kuji "${kuji.name}" ?`}
          >
            Supprimer définitivement
          </ConfirmSubmitButton>
        </form>
      </section>
    </div>
  );
}