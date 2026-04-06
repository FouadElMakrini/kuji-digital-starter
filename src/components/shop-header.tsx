import Link from "next/link";

const navItems = [
  "Préco",
  "Nouveautés",
  "Dragon Ball",
  "Ichiban Kuji",
  "Licenses",
  "Personnages",
  "Type",
  "Exclu DBZ Japon",
  "TCG",
  "B2B - PRO"
];

export function ShopHeader() {
  return (
    <header className="shop-header-fdbz">
      <div className="shop-header-fdbz__promo">AVENTURE FANTASTIQUE 2 LIVE! 🔥</div>

      <div className="shop-header-fdbz__main">
        <Link href="/" className="shop-header-fdbz__logo" aria-label="Accueil K-minari">
          <img src="/brand/k-minari-logo.png" alt="K-minari" />
        </Link>

        <form className="shop-header-fdbz__search" role="search">
          <input type="search" placeholder="Qu'est-ce que tu cherches ?" />
          <button type="submit" aria-label="Rechercher">⌕</button>
        </form>

        <div className="shop-header-fdbz__actions">
          <Link href="/play" className="shop-header-fdbz__account">
            <span aria-hidden="true">◌</span>
            <span>Espace client</span>
          </Link>
          <Link href="/admin/login" className="shop-header-fdbz__cart" aria-label="Admin">
            ⚙
          </Link>
        </div>
      </div>

      <nav className="shop-header-fdbz__nav" aria-label="Navigation principale">
        {navItems.map((item) => (
          <a key={item}>{item}</a>
        ))}
      </nav>
    </header>
  );
}
