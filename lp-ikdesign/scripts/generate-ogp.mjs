import satori from 'satori';
import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = join(__dirname, 'fonts');
const OUTPUT = join(__dirname, '..', 'ogp.png');

// Google Fonts APIからフォントをダウンロード
async function downloadFont(family, weight) {
  const cacheFile = join(FONTS_DIR, `${family.replace(/\s/g, '_')}-${weight}.ttf`);
  if (existsSync(cacheFile)) {
    return readFile(cacheFile);
  }
  await mkdir(FONTS_DIR, { recursive: true });

  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
  const cssRes = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  const css = await cssRes.text();

  const ttfMatch = css.match(/src:\s*url\(([^)]+)\)/);
  if (!ttfMatch) throw new Error(`Font URL not found for ${family} ${weight}`);

  const fontRes = await fetch(ttfMatch[1]);
  const buffer = Buffer.from(await fontRes.arrayBuffer());
  await writeFile(cacheFile, buffer);
  return buffer;
}

async function main() {
  console.log('Downloading fonts...');
  const [notoSerifLight, notoSerifSemiBold, cormorant] = await Promise.all([
    downloadFont('Noto Serif JP', 200),
    downloadFont('Noto Serif JP', 600),
    downloadFont('Cormorant Garamond', 300),
  ]);
  console.log('Fonts ready.');

  const template = {
    type: 'div',
    props: {
      style: {
        width: 1200,
        height: 630,
        background: '#0d1b3e',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 80px',
        position: 'relative',
      },
      children: [
        // 上部ゴールドライン
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute', top: '0', left: '0',
              width: '100%', height: '3px', background: '#c9a84c',
            },
          },
        },
        // タグライン
        {
          type: 'div',
          props: {
            style: {
              color: '#c9a84c', fontSize: 16, letterSpacing: 4,
              fontFamily: 'Noto Serif JP', fontWeight: 200,
              marginBottom: '16px',
            },
            children: '不 動 産 コ ン サ ル テ ィ ン グ',
          },
        },
        // キャッチコピー 1行目
        {
          type: 'div',
          props: {
            style: {
              color: '#ffffff', fontSize: 52, lineHeight: 1.6,
              fontFamily: 'Noto Serif JP', fontWeight: 200,
            },
            children: '相続、売却、空き家──',
          },
        },
        // キャッチコピー 2行目
        {
          type: 'div',
          props: {
            style: {
              color: '#ffffff', fontSize: 52, lineHeight: 1.6,
              fontFamily: 'Noto Serif JP', fontWeight: 200,
            },
            children: 'すべての窓口を、',
          },
        },
        // キャッチコピー 3行目（太字）
        {
          type: 'div',
          props: {
            style: {
              color: '#ffffff', fontSize: 56,
              fontFamily: 'Noto Serif JP', fontWeight: 600,
              marginTop: '4px',
            },
            children: 'ひとつにする。',
          },
        },
        // 下部 社名エリア
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute', bottom: '56px', left: '80px',
              display: 'flex', flexDirection: 'column', gap: '8px',
            },
            children: [
              // ゴールドセパレータ
              {
                type: 'div',
                props: {
                  style: { width: '40px', height: '1px', background: '#c9a84c' },
                },
              },
              // 社名
              {
                type: 'div',
                props: {
                  style: {
                    color: '#ffffff', fontSize: 20, letterSpacing: 3,
                    fontFamily: 'Noto Serif JP', fontWeight: 200,
                  },
                  children: 'IKDesign株式会社',
                },
              },
              // サブタイトル
              {
                type: 'div',
                props: {
                  style: {
                    color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: 4,
                    fontFamily: 'Cormorant Garamond', fontWeight: 300,
                    fontStyle: 'italic',
                  },
                  children: 'One Stop Real Estate Consulting',
                },
              },
            ],
          },
        },
        // 右下ゴールド装飾
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute', bottom: '0', right: '0',
              width: '120px', height: '3px', background: '#c9a84c',
            },
          },
        },
      ],
    },
  };

  console.log('Generating SVG...');
  const svg = await satori(template, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Noto Serif JP', data: notoSerifLight, weight: 200, style: 'normal' },
      { name: 'Noto Serif JP', data: notoSerifSemiBold, weight: 600, style: 'normal' },
      { name: 'Cormorant Garamond', data: cormorant, weight: 300, style: 'italic' },
    ],
  });

  console.log('Converting to PNG...');
  const png = await sharp(Buffer.from(svg)).png({ quality: 90 }).toBuffer();
  await writeFile(OUTPUT, png);

  const sizeKB = (png.length / 1024).toFixed(1);
  console.log(`Done! ogp.png (${sizeKB} KB) saved to ${OUTPUT}`);
}

main().catch(console.error);
