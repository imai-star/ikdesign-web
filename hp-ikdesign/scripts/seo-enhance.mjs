// SEO強化スクリプト（2026-08 一括適用・冪等）
// 1) タイトル・メタ説明のキーワード最適化（主要ページ）
// 2) OGP画像・summary_large_image
// 3) JSON-LD構造化データ: Organization(ホーム) / BreadcrumbList / Article(記事)
// 4) 記事ページに「関連記事」ブロック（内部リンク強化）
// 実行: node scripts/seo-enhance.mjs   （hp-ikdesign ディレクトリで）
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const SITE = 'https://ikd-kk.com';
const OG_IMAGE = `${SITE}/images/hero/hero-home.jpg`;
const read = f => fs.readFileSync(f, 'utf8');
const write = (f, t) => fs.writeFileSync(f, t, 'utf8');

// ── ページ別のタイトル/説明 最適化コピー ──────────────────────────
const PAGE_META = {
  'index.html': {
    breadcrumb: null, // ホームはOrganizationを入れる
    desc: '公認 不動産コンサルティングマスターと7士業の専門家ネットワークで、相続・売却・空き家・事業承継・AI活用の課題をワンストップで解決。東京・埼玉（本庄・深谷）・群馬（高崎）を拠点に全国対応。初回相談無料・秘密厳守。',
  },
  'fudosan/index.html': {
    title: '不動産コンサルティング（相続・売却・空き家） | IKDesign株式会社',
    breadcrumb: '不動産コンサルティング',
    desc: '「売るべきかどうか」から考える中立の不動産コンサルティング。相続不動産・売買・空き家・不動産投資・任意売却・競売まで、公的資格に裏付けられた専門性で対応します。初回相談無料。',
  },
  'ai-dx/index.html': {
    title: 'AIシステム開発・DX支援（不動産DXに強い） | IKDesign株式会社',
    breadcrumb: 'AIシステム開発・DX支援',
    desc: '中小企業向けオーダーメイドのAIシステム開発・DX支援。パッケージに業務を合わせない設計で、不動産DXでは1人月以上の業務量削減を実現（弊社自身は5人月以上を達成）。',
  },
  'keiei/index.html': {
    title: '経営コンサルティング（事業承継・M&A） | IKDesign株式会社',
    breadcrumb: '経営コンサルティング',
    desc: '後継者不在の事業承継・M&A支援から経営戦略、収益改善・事業再生、組織づくり・資金調達まで。提案書で終わらせない実行型の経営コンサルティング。初回相談無料。',
  },
  'akiya/index.html': {
    title: '空き家対策・空き家の相談（売却・活用・管理） | IKDesign株式会社',
    breadcrumb: '空き家対策',
    desc: '空き家をどうするかお悩みの方へ。空き家相談士ほか全工程の専門資格を持つコンサルタントが、片付け・評価・税金・建物・売却/活用/解体の出口まで窓口ひとつで解決。遠方の実家も現地対応を代行、全国対応。',
  },
  'column/index.html': {
    breadcrumb: 'お知らせ・コラム',
  },
};

const ORG = {
  '@type': 'Organization',
  '@id': `${SITE}/#organization`,
  name: 'IKDesign株式会社',
  url: `${SITE}/`,
  logo: `${SITE}/images/logo.png`,
  telephone: '+81-495-23-3555',
  email: 'info@ikd-kk.com',
  foundingDate: '2018-03',
  founder: { '@type': 'Person', name: '今井 喜彦' },
  address: {
    '@type': 'PostalAddress', postalCode: '150-0001', addressRegion: '東京都',
    addressLocality: '渋谷区', streetAddress: '神宮前3-24-1 原宿鈴木ビル3階', addressCountry: 'JP',
  },
};

const jsonld = obj => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...obj })}</script>`;
const breadcrumbLd = items => jsonld({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, url], i) => ({
    '@type': 'ListItem', position: i + 1, name, ...(url ? { item: SITE + url } : {}),
  })),
});

function upgradeHead(t, { ldBlocks = [], title, desc }) {
  if (title) {
    t = t.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
         .replace(/(<meta property="og:title" content=")[^"]*(">)/, `$1${title}$2`);
  }
  if (desc) {
    t = t.replace(/(<meta name="description" content=")[^"]*(">)/, `$1${desc}$2`)
         .replace(/(<meta property="og:description" content=")[^"]*(">)/, `$1${desc}$2`);
  }
  if (!t.includes('og:image')) {
    t = t.replace('<meta property="og:locale" content="ja_JP">',
      `<meta property="og:locale" content="ja_JP">\n<meta property="og:image" content="${OG_IMAGE}">\n<meta property="og:image:width" content="1600">\n<meta property="og:image:height" content="1000">`);
  }
  t = t.replace('<meta name="twitter:card" content="summary">', '<meta name="twitter:card" content="summary_large_image">');
  if (ldBlocks.length && !t.includes('application/ld+json')) {
    t = t.replace('</head>', ldBlocks.join('\n') + '\n</head>');
  }
  return t;
}

// ── 主要ページ ─────────────────────────────────────────────────────
for (const [rel, meta] of Object.entries(PAGE_META)) {
  const f = path.join(ROOT, rel);
  let t = read(f);
  const url = rel === 'index.html' ? '/' : '/' + rel.replace('/index.html', '');
  const ld = [];
  if (rel === 'index.html') {
    ld.push(jsonld(ORG));
  } else if (meta.breadcrumb) {
    ld.push(breadcrumbLd([['ホーム', '/'], [meta.breadcrumb, url]]));
  }
  t = upgradeHead(t, { ldBlocks: ld, title: meta.title, desc: meta.desc });
  write(f, t);
  console.log('✓ page', url);
}

// ── 記事ページ: メタ抽出 → Article/パンくずJSON-LD ＋ 関連記事 ─────
const colDir = path.join(ROOT, 'column');
const slugs = fs.readdirSync(colDir).filter(d => fs.existsSync(path.join(colDir, d, 'index.html')));
const articles = slugs.map(slug => {
  const t = read(path.join(colDir, slug, 'index.html'));
  return {
    slug,
    title: (t.match(/<title>(.+?) \| IKDesign株式会社<\/title>/) || [])[1] || '',
    desc: (t.match(/<meta name="description" content="([^"]*)">/) || [])[1] || '',
    date: ((t.match(/>(\d{4})\.(\d{2})\.(\d{2})<\/span>/) || []).slice(1).join('-')) || '',
    cat: (t.match(/border-radius:13px[^>]*>([^<]+)<\/span>/) || [])[1] || 'コラム',
    color: (t.match(/border-top:3px solid (#[0-9a-f]{6})/) || [])[1] || '#5a7a8a',
  };
});

for (const ar of articles) {
  const f = path.join(colDir, ar.slug, 'index.html');
  let t = read(f);
  const url = `/column/${ar.slug}`;
  const ld = [
    jsonld({
      '@type': 'Article', headline: ar.title, description: ar.desc,
      datePublished: ar.date, dateModified: ar.date, inLanguage: 'ja',
      image: OG_IMAGE, mainEntityOfPage: SITE + url,
      author: { '@type': 'Organization', name: 'IKDesign株式会社', url: `${SITE}/` },
      publisher: { '@type': 'Organization', name: 'IKDesign株式会社', logo: { '@type': 'ImageObject', url: `${SITE}/images/logo.png` } },
    }),
    breadcrumbLd([['ホーム', '/'], ['お知らせ・コラム', '/column'], [ar.title, url]]),
  ];
  t = upgradeHead(t, { ldBlocks: ld });

  // 関連記事（同カテゴリ優先→新しい順で3件）
  if (!t.includes('id="related"')) {
    const rel = articles.filter(a => a.slug !== ar.slug)
      .sort((a, b) => (b.cat === ar.cat) - (a.cat === ar.cat) || b.date.localeCompare(a.date))
      .slice(0, 3);
    const cards = rel.map(r => `
      <a href="/column/${r.slug}" style="display:flex; flex-direction:column; gap:10px; background:#ffffff; border:1px solid #e2e8ec; border-top:3px solid ${r.color}; border-radius:12px; padding:24px 22px; text-decoration:none;">
        <span style="display:flex; align-items:center; gap:10px;"><span style="display:inline-flex; align-items:center; height:22px; padding:0 10px; border:1px solid ${r.color}; border-radius:11px; font-size:11px; font-weight:700; letter-spacing:0.06em; color:${r.color};">${r.cat}</span><span style="font-size:12px; letter-spacing:0.05em; color:#9db0bb;">${r.date.replace(/-/g, '.')}</span></span>
        <span style="font-family:'Noto Serif JP', serif; font-size:15px; font-weight:600; letter-spacing:0.03em; line-height:1.75; color:#3a4f5c;">${r.title}</span>
        <span style="font-size:12px; font-weight:700; letter-spacing:0.1em; color:#5a7a8a;">続きを読む →</span>
      </a>`).join('');
    const block = `
    <div id="related" style="margin-top:40px;">
      <p style="margin:0 0 16px; font-family:'Noto Serif JP', serif; font-size:19px; font-weight:600; letter-spacing:0.06em; color:#3a4f5c;">関連記事</p>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(230px, 1fr)); gap:16px;">${cards}
      </div>
    </div>`;
    t = t.replace('</article>', '</article>' + block);
  }
  write(f, t);
  console.log('✓ article', ar.slug, `(${ar.cat} ${ar.date})`);
}

// ── sitemap.xml の lastmod を更新 ──────────────────────────────────
{
  const f = path.join(ROOT, 'sitemap.xml');
  const today = new Date().toISOString().slice(0, 10);
  write(f, read(f).replace(/<lastmod>[0-9-]+<\/lastmod>/g, `<lastmod>${today}</lastmod>`));
  console.log('✓ sitemap lastmod →', today);
}
console.log('done');
