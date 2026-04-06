export type PrizeTierInput = {
  letter: string;
  label: string;
  quantity: number;
  imageUrl?: string | null;
};

export function normalizePrizeTiers(raw: unknown): PrizeTierInput[] {
  if (!Array.isArray(raw)) {
    throw new Error("Format de lots invalide.");
  }

  const tiers = raw
    .map((item) => {
      const entry = item as Record<string, unknown>;

      return {
        letter: String(entry.letter ?? "")
          .trim()
          .toUpperCase(),
        label: String(entry.label ?? "").trim(),
        quantity: Number(entry.quantity ?? 0),
        imageUrl: String(entry.imageUrl ?? "").trim() || null
      };
    })
    .filter(
      (tier) =>
        tier.letter.length > 0 &&
        tier.label.length > 0 &&
        Number.isFinite(tier.quantity) &&
        tier.quantity > 0
    );

  if (tiers.length === 0) {
    throw new Error("Aucun lot valide.");
  }

  return tiers;
}

export function shuffleArray<T>(items: T[]) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

export function buildTicketSeeds(
  prizeTiers: PrizeTierInput[],
  startSerialNumber = 1,
  startGridPosition = 0
) {
  const letters: string[] = [];

  for (const tier of prizeTiers) {
    for (let i = 0; i < tier.quantity; i += 1) {
      letters.push(tier.letter);
    }
  }

  const shuffledLetters = shuffleArray(letters);

  return shuffledLetters.map((letter, index) => ({
    serialNumber: startSerialNumber + index,
    gridPosition: startGridPosition + index,
    letter,
    status: "available" as const
  }));
}
