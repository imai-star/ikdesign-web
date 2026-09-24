// 「空き家は増え続け、人口は減り続けています」グラフ（実績＋将来予測）を生成し、
// index.html と akiya/index.html の該当ブロックを置き換える。何度実行しても同じ結果になる。
//   node scripts/akiya-chart.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TARGETS = ['index.html', 'akiya/index.html'];

const Y0 = 1993, Y1 = 2043, STEP = 5;
const COLS = (Y1 - Y0) / STEP + 1;                                  // 11列
const x = (year) => ((year - Y0) / STEP + 0.5) / COLS * 100;          // 列の中心（%）
const LAST_ACTUAL = 2023;
const FORECAST_FROM = (x(LAST_ACTUAL) + x(LAST_ACTUAL + STEP)) / 2; // 予測帯の左端
const PEAK = 2008;

// 数値の出典
//  空き家数: 総務省「住宅・土地統計調査」／予測は野村総合研究所（2024年6月13日公表 図4）
//  使い道のない空き家（賃貸・売却用等以外）: 同調査／見込みは国土交通省（2030年 約470万戸）
//  総人口: 総務省「国勢調査」・人口推計／推計は国立社会保障・人口問題研究所
//          「日本の将来推計人口（令和5年推計）」出生中位・死亡中位 表1-1
const SERIES = [
  {
    name: '空き家数', color: '#5c7f68', text: '#3d5a48', badgeBg: '#eef4f0', unit: '万戸',
    badge: '30年で約2倍 → 2043年には約1,861万戸（予測）',
    actual: [[1993, 448], [1998, 576], [2003, 659], [2008, 757], [2013, 820], [2018, 849], [2023, 900]],
    future: [[2028, 1049], [2033, 1277], [2038, 1554], [2043, 1861]],
    labels: [1993, 2008, 2023, 2033, 2043],
  },
  {
    name: '使い道のない空き家（賃貸・売却用等を除く）', color: '#a8735c', text: '#7d4f3c', badgeBg: '#f8f1ec', unit: '万戸',
    badge: '30年で約2.6倍 → 2030年には約470万戸の見込み',
    actual: [[1993, 149], [1998, 182], [2003, 212], [2008, 268], [2013, 318], [2018, 349], [2023, 385]],
    future: [[2030, 470]],
    labels: [1993, 2008, 2023, 2030],
    suffix: { 2030: '（見込み）' },
  },
  {
    name: '総人口', color: '#3a4f5c', text: '#3a4f5c', badgeBg: '#f4f6f8', unit: '万人',
    badge: '2008年ピーク → 2043年には約1,765万人減（推計）',
    actual: [[1993, 12494], [1998, 12647], [2003, 12769], [2008, 12808], [2013, 12730], [2018, 12644], [2023, 12435]],
    future: [[2028, 12141], [2033, 11807], [2038, 11439], [2043, 11043]],
    labels: [1993, 2008, 2023, 2043],
  },
];

const fmt = (v) => v.toLocaleString('en-US');
const f1 = (n) => n.toFixed(1);

function seriesHtml(s) {
  const all = [...s.actual, ...s.future];
  const vs = all.map(([, v]) => v);
  const min = Math.min(...vs), max = Math.max(...vs);
  const y = (v) => 88 - (v - min) / (max - min) * 66;
  const pt = ([yr, v]) => `${f1(x(yr))},${f1(y(v))}`;
  const actualPts = s.actual.map(pt).join(' ');
  const futurePts = [s.actual.at(-1), ...s.future].map(pt).join(' ');
  const firstX = f1(x(s.actual[0][0])), lastA = f1(x(s.actual.at(-1)[0])), lastF = f1(x(s.future.at(-1)[0]));
  const isFuture = (yr) => yr > LAST_ACTUAL;

  const dots = all.map(([yr, v]) => {
    const fill = isFuture(yr) ? '#ffffff' : s.color;
    const border = isFuture(yr) ? `2px solid ${s.color}` : '2px solid #ffffff';
    return `                  <span style="position:absolute; left:${f1(x(yr))}%; top:${f1(y(v))}%; width:8px; height:8px; margin:-4px 0 0 -4px; background:${fill}; border:${border}; border-radius:50%; box-sizing:border-box;"></span>`;
  }).join('\n');

  const labels = all.filter(([yr]) => s.labels.includes(yr)).map(([yr, v]) =>
    `                  <span style="position:absolute; left:${f1(x(yr))}%; top:${f1(y(v))}%; transform:translate(-50%, -100%); padding-bottom:7px; font-size:11px; font-weight:700; color:${s.text}; white-space:nowrap;">${fmt(v)}${s.unit}${s.suffix?.[yr] ?? ''}</span>`
  ).join('\n');

  return `            <div>
              <div style="display:flex; align-items:baseline; flex-wrap:wrap; gap:6px 12px; margin-bottom:2px;">
                <span style="display:inline-flex; align-items:center; gap:8px; font-size:13px; font-weight:700; color:#3a4f5c;"><span style="display:inline-block; width:18px; height:4px; background:${s.color}; border-radius:2px;"></span>${s.name}</span>
                <span style="display:inline-flex; align-items:center; height:20px; padding:0 10px; background:${s.badgeBg}; border-radius:10px; font-size:11px; font-weight:700; color:${s.text};">${s.badge}</span>
              </div>
              <div style="position:relative; width:100%; height:96px;">
                <div style="position:absolute; left:0; right:0; bottom:0; border-bottom:1px solid #e2e8ec;"></div>
                <svg style="position:absolute; inset:0; width:100%; height:100%; overflow:visible;" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polygon points="${actualPts} ${lastA},100 ${firstX},100" fill="${s.color}" fill-opacity="0.10" stroke="none"></polygon>
                  <polygon points="${futurePts} ${lastF},100 ${lastA},100" fill="${s.color}" fill-opacity="0.05" stroke="none"></polygon>
                  <polyline points="${actualPts}" fill="none" stroke="${s.color}" stroke-width="2.6" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"></polyline>
                  <polyline points="${futurePts}" fill="none" stroke="${s.color}" stroke-width="2.4" stroke-dasharray="5 4" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"></polyline>
                </svg>
${dots}
${labels}
              </div>
            </div>`;
}

function chartInner() {
  const years = [];
  for (let yr = Y0; yr <= Y1; yr += STEP) years.push(yr);
  const axis = years.map((yr) =>
    `            <span style="font-size:12px; letter-spacing:0.04em; color:${yr > LAST_ACTUAL ? '#9db0bb' : '#6b7280'}; text-align:center;">${yr}年</span>`
  ).join('\n');
  const peak = f1(x(PEAK)), band = f1(FORECAST_FROM);

  return `<!-- akiya-chart:start（scripts/akiya-chart.mjs で生成） -->
      <h3 style="margin:0 0 8px; font-family:'Noto Serif JP', serif; font-weight:600; font-size:22px; letter-spacing:0.06em; color:#3a4f5c;">空き家は増え続け、人口は減り続けています</h3>
      <p style="margin:0 0 16px; font-size:13px; line-height:1.9; color:#6b7280;">この30年、空き家は一度も減ることなく約2倍に。なかでも賃貸・売却の予定すらない「使い道のない空き家」——放置され、特定空家の予備軍となる家——は約2.6倍と、空き家全体を上回るペースで増えています。人口は2008年をピークに減少へ転じ、2043年には約1億1,000万人まで減る見通しです。その一方で空き家は、これからの20年でさらに約2倍に増えると予測されています。</p>
      <p style="margin:0 0 20px; display:flex; flex-wrap:wrap; gap:6px 18px; font-size:11px; color:#6b7280;">
        <span style="display:inline-flex; align-items:center; gap:6px;"><span style="display:inline-block; width:20px; border-top:2.5px solid #6b7280;"></span>実績</span>
        <span style="display:inline-flex; align-items:center; gap:6px;"><span style="display:inline-block; width:20px; border-top:2.5px dashed #6b7280;"></span>予測・見込み</span>
      </p>
      <div class="akc-scroll">
      <div class="akc-inner" style="position:relative;">
        <div style="position:absolute; top:0; bottom:34px; left:${band}%; right:0; background:#f6f8f9; border-radius:8px;"></div>
        <span style="position:absolute; top:-4px; left:${band}%; margin-left:8px; background:#eef1f3; color:#5a7a8a; font-size:11px; font-weight:700; letter-spacing:0.06em; padding:3px 10px; border-radius:11px; white-space:nowrap;">予測 →</span>
        <div style="position:absolute; top:0; bottom:34px; left:${peak}%; border-left:2px dashed #c29079;"></div>
        <span style="position:absolute; top:-4px; left:${peak}%; transform:translateX(-50%); background:#f8f1ec; color:#7d4f3c; font-size:11px; font-weight:700; letter-spacing:0.06em; padding:3px 10px; border-radius:11px; white-space:nowrap;">2008年 人口ピーク</span>
        <div style="position:relative; display:flex; flex-direction:column; gap:8px; padding-top:28px;">
${SERIES.map(seriesHtml).join('\n')}
        </div>
        <div style="position:relative; display:grid; grid-template-columns:repeat(${COLS}, 1fr); margin-top:10px;">
${axis}
        </div>
      </div>
      </div>
      <p class="akc-hint">← 左へスクロールすると過去の推移を見られます</p>
      <p style="margin:20px 0 0; font-size:13px; line-height:1.9; color:#3a4f5c; font-weight:700;">2043年には空き家約1,861万戸・空き家率25%超——「4戸に1戸が空き家」の時代が予測されています。売れるうちに、貸せるうちに動くことが資産を守る最大の対策です。</p>
      <p style="margin:24px 0 0; font-size:11px; line-height:1.8; letter-spacing:0.04em; color:#9db0bb; text-align:right;">出典：総務省「住宅・土地統計調査」（各年）／総務省「国勢調査」・人口推計<br>予測：空き家数は野村総合研究所（2024年6月公表）、使い道のない空き家は国土交通省（2030年見込み）、総人口は国立社会保障・人口問題研究所「日本の将来推計人口（令和5年推計）」出生中位・死亡中位</p>
<!-- akiya-chart:end -->`;
}

const OPEN = '<div style="background:#ffffff; border:1px solid #e2e8ec; border-radius:12px; padding:40px 40px 32px';
for (const rel of TARGETS) {
  const file = join(ROOT, rel);
  let html = readFileSync(file, 'utf8');
  let start, end;
  if (html.includes('<!-- akiya-chart:start')) {
    start = html.indexOf('<!-- akiya-chart:start');
    end = html.indexOf('<!-- akiya-chart:end -->') + '<!-- akiya-chart:end -->'.length;
  } else {
    // 初回: 見出しを含むカードの中身（開始タグの直後〜出典段落の終わり）を置き換える
    const h3 = html.indexOf('空き家は増え続け、人口は減り続けています');
    const open = html.lastIndexOf(OPEN, h3);
    start = html.indexOf('>', open) + 1;
    const src = html.indexOf('出典：総務省「住宅・土地統計調査」（各年）', h3);
    end = html.indexOf('</p>', src) + '</p>'.length;
    if (open < 0 || src < 0) throw new Error(`${rel}: グラフブロックが見つかりません`);
  }
  html = html.slice(0, start).replace(/\s*$/, '') + '\n      ' + chartInner() + '\n    ' + html.slice(end).replace(/^\s*/, '');
  writeFileSync(file, html);
  console.log(`updated ${rel}`);
}
