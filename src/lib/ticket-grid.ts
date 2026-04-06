type PrizeTierInput = {
  letter: string;
  quantity: number;
};

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildRandomizedTickets(prizeTiers: PrizeTierInput[]) {
  const letters: string[] = [];

  for (const tier of prizeTiers) {
    for (let i = 0; i < tier.quantity; i += 1) {
      letters.push(tier.letter.trim().toUpperCase());
    }
  }

  const randomizedLetters = shuffle(letters);

  return randomizedLetters.map((letter, index) => ({
    serialNumber: index + 1,
    gridPosition: index,
    letter
  }));
}
