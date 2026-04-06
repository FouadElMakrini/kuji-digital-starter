import Link from "next/link";
import { KujiStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

const successMessages: Record<string, string> = {
  kuji_deleted: "Le Kuji a été supprimé définitivement.",
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

type DashboardStatusFilter = "all" | KujiStatus;

export default async function AdminDashboardPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; q?: string; success?: string }>;
}) {
  const params = await searchParams;

  const rawStatus = String(params.status ?? "");
  const statusFilter: DashboardStatusFilter =
    rawStatus === "draft" || rawStatus === "active" || rawStatus === "closed"
      ? (rawStatus as KujiStatus)
      : "all";

  const q = String(params.q ?? "").trim();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const where: Prisma.KujiWhereInput = {};

  if (statusFilter !== "all") {
    where.status = statusFilter;
  }

  if (q) {
    where.name = {
      contains: q,
      mode: "insensitive"
    };
  }

  const kujis = await prisma.kuji.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }],
    include: {
      prizeTiers: { orderBy: { displayOrder: "asc" } },
      tickets: {
        select: {
          id: true,
          status: true,
          letter: true
        }
      },
      _count: {
        select: {
          sessions: true,
          drawLogs: true
        }
      }
    }
  });

  const [totalKujis, activeKujis, todaySessions, todayDraws] = await Promise.all([
    prisma.kuji.count(),
    prisma.kuji.count({ where: { status: "active" } }),
    prisma.clientSession.count({ where: { createdAt: { gte: today } } }),
    prisma.drawLog.count({ where: { openedAt: { gte: today } } })
  ]);

  const successMessage = params.success ? successMessages[params.success] : "";

  return (
    <div className="stack">
      <section className="dashboard-hero card card-pad stack">
        <div className="section-head">
          <div>
            <span className="badge">Dashboard K-minari</span>
            <h2 className="title">Gestion rapide de tes Kuji</h2>
            <p className="subtitle">
              Crée des sessions, ferme un Kuji, le duplique ou supprime-le définitivement.
            </p>
          </div>

          <div className="form-actions">
            <Link className="button-secondary" href="/admin/import">
              Import 1Kuji
            </Link>
            <Link className="button" href="/admin/kujis/new">
              Nouveau Kuji
            </Link>
          </div>
        </div>

        {successMessage ? <div className="notice">{successMessage}</div> : null}

        <div className="grid grid-auto">
          <div className="stat-card card card-pad">
            <p className="subtitle">Kujis</p>
            <div className="kpi">{totalKujis}</div>
          </div>
          <div className="stat-card card card-pad">
            <p className="subtitle">Actifs</p>
            <div className="kpi">{activeKujis}</div>
          </div>
          <div className="stat-card card card-pad">
            <p className="subtitle">Sessions du jour</p>
            <div className="kpi">{todaySessions}</div>
          </div>
          <div className="stat-card card card-pad">
            <p className="subtitle">Tirages du jour</p>
            <div className="kpi">{todayDraws}</div>
          </div>
        </div>

        <form className="dashboard-search" action="/admin/dashboard" method="GET">
          <div className="field">
            <label htmlFor="q">Recherche</label>
            <input id="q" name="q" defaultValue={q} placeholder="Nom du Kuji" />
          </div>

          <div className="field">
            <label htmlFor="status">Filtre</label>
            <select id="status" name="status" defaultValue={statusFilter}>
              <option value="all">Tous</option>
              <option value="active">Actifs</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <button className="button-secondary" type="submit">
            Filtrer
          </button>
        </form>
      </section>

      {kujis.length === 0 ? (
        <section className="card card-pad empty-state">
          Aucun Kuji trouvé.
        </section>
      ) : (
        <section className="grid grid-auto">
          {kujis.map((kuji) => {
            const totalTickets = kuji.tickets.length;
            const availableTickets = kuji.tickets.filter(
              (ticket) => ticket.status === "available"
            ).length;
            const usedTickets = totalTickets - availableTickets;
            const usedPercent =
              totalTickets > 0 ? Math.round((usedTickets / totalTickets) * 100) : 0;

            const remainingByLetter = kuji.prizeTiers.map((tier) => ({
              letter: tier.letter,
              remaining: kuji.tickets.filter(
                (ticket) =>
                  ticket.status === "available" && ticket.letter === tier.letter
              ).length
            }));

            return (
              <article key={kuji.id} className="kuji-card card card-pad stack">
                {kuji.coverImageUrl ? (
                  <div className="kuji-cover-wrap">
                    <img src={kuji.coverImageUrl} alt={kuji.name} className="kuji-cover-image" />
                  </div>
                ) : null}
                <div className="section-head">
                  <div className="stack" style={{ gap: "0.35rem" }}>
                    <div className="form-actions">
                      <span className={getStatusClass(kuji.status)}>{kuji.status}</span>
                      <span className="badge">
                        {availableTickets}/{totalTickets} restants
                      </span>
                    </div>
                    <h3 className="title">{kuji.name}</h3>
                    <p className="subtitle">{kuji.description || "Pas de description"}</p>
                  </div>

                  <Link className="button-secondary" href={`/admin/kujis/${kuji.id}`}>
                    Gérer
                  </Link>
                </div>

                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${usedPercent}%` }} />
                </div>

                <div className="grid grid-3">
                  <div>
                    <p className="subtitle">Ouverts</p>
                    <strong>{usedTickets}</strong>
                  </div>
                  <div>
                    <p className="subtitle">Sessions</p>
                    <strong>{kuji._count.sessions}</strong>
                  </div>
                  <div>
                    <p className="subtitle">Tirages</p>
                    <strong>{kuji._count.drawLogs}</strong>
                  </div>
                </div>

                <div className="stack" style={{ gap: "0.5rem" }}>
                  <p className="subtitle">Restants par lettre</p>
                  <div className="summary-chip-row">
                    {remainingByLetter.map((item) => (
                      <span key={item.letter} className={getLetterChipClass(item.letter)}>
                        {item.letter} · {item.remaining}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="stack" style={{ gap: "0.5rem" }}>
                  <p className="subtitle">Créer vite une session</p>
                  <form action="/api/admin/sessions/create" method="POST" className="quick-actions">
                    <input type="hidden" name="kujiId" value={kuji.id} />
                    <input type="hidden" name="expiresInMinutes" value="0" />
                    <input
                      type="hidden"
                      name="redirectTo"
                      value={`/admin/kujis/${kuji.id}`}
                    />

                    <button
                      className="button-secondary"
                      type="submit"
                      name="allowedDraws"
                      value="1"
                    >
                      1 ticket
                    </button>
                    <button
                      className="button-secondary"
                      type="submit"
                      name="allowedDraws"
                      value="2"
                    >
                      2 tickets
                    </button>
                    <button
                      className="button-secondary"
                      type="submit"
                      name="allowedDraws"
                      value="3"
                    >
                      3 tickets
                    </button>
                    <button
                      className="button-secondary"
                      type="submit"
                      name="allowedDraws"
                      value="5"
                    >
                      5 tickets
                    </button>
                  </form>
                </div>

                <div className="card-actions">
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

                  <form action="/api/admin/kujis/delete" method="POST">
                    <input type="hidden" name="kujiId" value={kuji.id} />
                    <ConfirmSubmitButton
                      className="button-danger"
                      confirmMessage={`Supprimer définitivement le Kuji "${kuji.name}" ?`}
                    >
                      Supprimer
                    </ConfirmSubmitButton>
                  </form>
                </div>

                <p className="muted">Mis à jour le {formatDate(kuji.updatedAt)}</p>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}