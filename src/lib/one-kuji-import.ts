type ImportedPrizeTier = {
  code: string;
  label: string;
  imageUrl: string | null;
  quantity: number;
};

export type ImportedKujiPayload = {
  sourceUrl: string;
  name: string;
  coverImageUrl: string | null;
  prizeTiers: ImportedPrizeTier[];
};

const COMMON_TRANSLATIONS: Array<[string, string]> = [
  ["ラストワン賞", "Last One"],
  ["ダブルチャンスキャンペーン", "Double chance"],
  ["ちょこのっこフィギュア", "mini figurine Chokonokko"],
  ["きゅんキャラ", "mini figurine Kyun Chara"],
  ["フィギュア", "figurine"],
  ["ビッグアクリルスタンド", "grand stand acrylique"],
  ["アクリルスタンド", "stand acrylique"],
  ["アクリルチャーム", "charme acrylique"],
  ["アクリルボード", "plaque acrylique"],
  ["ラバーチャーム", "porte-clés en caoutchouc"],
  ["ラバーストラップ", "strap en caoutchouc"],
  ["ラバーコレクション", "collection caoutchouc"],
  ["ぬいぐるみ", "peluche"],
  ["クッション", "coussin"],
  ["タオル", "serviette"],
  ["フェイスタオル", "serviette visage"],
  ["ハンドタオル", "serviette main"],
  ["クリアファイル", "clear file"],
  ["クリアポスター", "poster transparent"],
  ["ポスター", "poster"],
  ["ボード", "board"],
  ["マグカップ", "mug"],
  ["グラス", "verre"],
  ["プレート", "assiette"],
  ["小皿", "petite assiette"],
  ["どんぶり", "bol"],
  ["皿", "assiette"],
  ["バッグ", "sac"],
  ["トートバッグ", "tote bag"],
  ["ポーチ", "pochette"],
  ["キーホルダー", "porte-clés"],
  ["カードケース", "porte-cartes"],
  ["ステッカー", "sticker"],
  ["色紙", "shikishi"],
  ["ラストワン", "Last One"]
];

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function stripTags(value: string) {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAbsoluteUrl(candidate: string, baseUrl: string) {
  const trimmed = decodeEntities(candidate).trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed, baseUrl).toString();
  } catch {
    return null;
  }
}

function cleanName(raw: string) {
  return decodeEntities(raw)
    .replace(/一番くじ/g, "")
    .replace(/[|｜].*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMeta(html: string, propertyName: string) {
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${propertyName}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  return html.match(regex)?.[1] ? decodeEntities(html.match(regex)![1]) : "";
}

function extractPrizeCode(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const match = normalized.match(/((?:[A-Z]{1,3}|\d+|ラストワン|LAST\s*ONE|Last\s*One)\s*賞)/i);
  if (!match) return null;

  const rawCode = match[1]
    .replace(/賞/gi, "")
    .replace(/\s+/g, "")
    .toUpperCase();

  if (rawCode.includes("LASTONE") || rawCode.includes("ラストワン")) {
    return "LAST";
  }

  return rawCode;
}

function removePrizeMarker(text: string) {
  return text
    .replace(/^\s*(?:[A-Z]{1,3}|\d+|ラストワン|LAST\s*ONE|Last\s*One)\s*賞\s*/i, "")
    .replace(/^[:：\-–]+\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function translateLabel(rawLabel: string) {
  let translated = decodeEntities(rawLabel)
    .replace(/[【】]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const [jp, fr] of COMMON_TRANSLATIONS) {
    translated = translated.replace(new RegExp(jp, "g"), fr);
  }

  return translated;
}

function inferQuantity(text: string) {
  const nearby = stripTags(text);
  const explicit = nearby.match(/(\d+)\s*(?:本|個)/);
  if (explicit) {
    const qty = Number(explicit[1]);
    if (Number.isFinite(qty) && qty > 0 && qty < 1000) return qty;
  }
  return 1;
}

function collectPrizeCandidatesFromJson(html: string, baseUrl: string) {
  const candidates: ImportedPrizeTier[] = [];
  const regex = /"(?:name|title|alt)":"((?:\\.|[^"\\])+)"[^{}]{0,500}?"(?:image|src|url)":"((?:\\.|[^"\\])+)"/g;

  for (const match of html.matchAll(regex)) {
    const rawText = decodeEntities(match[1].replace(/\\\//g, "/"));
    const code = extractPrizeCode(rawText);
    if (!code) continue;
    if (/ダブルチャンス/i.test(rawText)) continue;

    const imageUrl = normalizeAbsoluteUrl(match[2].replace(/\\\//g, "/"), baseUrl);
    candidates.push({
      code,
      label: translateLabel(removePrizeMarker(rawText)),
      imageUrl,
      quantity: 1
    });
  }

  return candidates;
}

function collectPrizeCandidatesFromImages(html: string, baseUrl: string) {
  const candidates: ImportedPrizeTier[] = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;

  for (const match of html.matchAll(imgRegex)) {
    const fullTag = match[0];
    const src = match[1];
    const index = match.index ?? 0;
    const nearbyHtml = html.slice(Math.max(0, index - 500), Math.min(html.length, index + fullTag.length + 1000));
    const nearbyText = stripTags(nearbyHtml);
    const code = extractPrizeCode(nearbyText);

    if (!code) continue;
    if (/ダブルチャンス|double chance/i.test(nearbyText)) continue;

    const labelText = removePrizeMarker(nearbyText)
      .split(/(?:発売日|ダブルチャンス|DOUBLE CHANCE|一番くじONLINE|©|詳細)/i)[0]
      .trim();

    const imageUrl = normalizeAbsoluteUrl(src, baseUrl);
    if (!imageUrl) continue;

    candidates.push({
      code,
      label: translateLabel(labelText),
      imageUrl,
      quantity: inferQuantity(nearbyHtml)
    });
  }

  return candidates;
}

function dedupePrizeTiers(items: ImportedPrizeTier[]) {
  const byCode = new Map<string, ImportedPrizeTier>();

  for (const item of items) {
    if (!item.code || !item.label) continue;

    const existing = byCode.get(item.code);
    if (!existing) {
      byCode.set(item.code, item);
      continue;
    }

    const existingScore = Number(Boolean(existing.imageUrl)) + existing.label.length;
    const nextScore = Number(Boolean(item.imageUrl)) + item.label.length;
    if (nextScore > existingScore) {
      byCode.set(item.code, item);
    }
  }

  const preferredOrder = (code: string) => {
    if (code === "LAST") return 999;
    if (/^[A-Z]+$/.test(code)) return code.charCodeAt(0) - 64;
    const numeric = Number(code);
    if (Number.isFinite(numeric)) return 700 + numeric;
    return 900;
  };

  return [...byCode.values()].sort((a, b) => preferredOrder(a.code) - preferredOrder(b.code));
}

export async function importKujiFrom1Kuji(sourceUrl: string): Promise<ImportedKujiPayload> {
  let normalizedUrl: URL;
  try {
    normalizedUrl = new URL(sourceUrl);
  } catch {
    throw new Error("Lien invalide.");
  }

  if (!/1kuji\.com$/i.test(normalizedUrl.hostname)) {
    throw new Error("Le lien doit venir de 1kuji.com.");
  }

  const response = await fetch(normalizedUrl.toString(), {
    headers: {
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
      "accept-language": "ja,en;q=0.9,fr;q=0.8"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Le site 1kuji a répondu avec le statut ${response.status}.`);
  }

  const html = await response.text();

  const title = cleanName(
    extractMeta(html, "og:title") || html.match(/<title>([^<]+)<\/title>/i)?.[1] || "Kuji importé"
  );
  const coverImageUrl = normalizeAbsoluteUrl(
    extractMeta(html, "og:image") || extractMeta(html, "twitter:image"),
    normalizedUrl.toString()
  );

  const prizeTiers = dedupePrizeTiers([
    ...collectPrizeCandidatesFromJson(html, normalizedUrl.toString()),
    ...collectPrizeCandidatesFromImages(html, normalizedUrl.toString())
  ]);

  if (prizeTiers.length === 0) {
    throw new Error(
      "Impossible d’identifier les lots sur cette page. La structure du site a probablement changé."
    );
  }

  return {
    sourceUrl: normalizedUrl.toString(),
    name: title,
    coverImageUrl,
    prizeTiers: prizeTiers.map((tier) => ({
      ...tier,
      label: tier.label || `Lot ${tier.code}`,
      quantity: tier.quantity > 0 ? tier.quantity : 1
    }))
  };
}
