const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const WIDTH = 1264;
const HEIGHT = 1680;
function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function sixMonthsAgoStr() {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return fmtDate(d);
}

const CUTOFF = sixMonthsAgoStr();
const ROOT = __dirname;
const CACHE = path.join(ROOT, "covers");
const CONFIG_FILE = path.join(ROOT, "config.json");

const CONFIG = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
const DOUBAN_USER_ID = String(CONFIG.doubanUserId || "").trim();
const DISPLAY_NAME = String(CONFIG.displayName || "我 的").trim();
const PAGE_TITLE = String(CONFIG.pageTitle || "豆瓣秀").trim();
const SUBTITLE = String(CONFIG.subtitle || "近 半 年 阅 读").trim();

if (!DOUBAN_USER_ID) {
  throw new Error("config.json 中缺少 doubanUserId");
}

if (!fs.existsSync(CACHE)) fs.mkdirSync(CACHE, { recursive: true });
function todayDisplay() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y} · ${m} · ${day}`;
}
function load(name) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, name), "utf8"));
}

function recent(items) {
  return items.filter(x => x.date >= CUTOFF);
}

function esc(s = "") {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function shortTitle(s, n = 11) {
  s = s.split(" : ")[0].trim();
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function stars(n) {
  if (!n) return "";
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function isValidCover(file) {
  try {
    if (!fs.existsSync(file) || fs.statSync(file).size === 0) return false;
    const meta = await sharp(file).metadata();
    return Boolean(meta.width && meta.height);
  } catch {
    return false;
  }
}

async function downloadCover(book, retries = 3) {
  const file = path.join(CACHE, `${book.id}.jpg`);
  const tmp = `${file}.tmp`;

  // 已有有效缓存时直接复用
  if (await isValidCover(file)) {
    console.log("使用缓存封面：", book.title);
    return file;
  }

  // 清掉以前可能留下的损坏缓存
  if (fs.existsSync(file)) fs.unlinkSync(file);

  if (!book.cover) {
    throw new Error(`${book.title}: 无封面 URL`);
  }

  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`下载封面（${attempt}/${retries}）：`, book.title);

      const res = await fetch(book.cover, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "https://book.douban.com/",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        }
      });

      if (!res.ok) {
        throw new Error(`${book.title}: HTTP ${res.status}`);
      }

      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(tmp, buf);

      if (!(await isValidCover(tmp))) {
        throw new Error(`${book.title}: 下载内容不是有效图片`);
      }

      fs.renameSync(tmp, file);
      return file;
    } catch (e) {
      lastError = e;
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);

      console.warn(
        `封面下载失败（${attempt}/${retries}）：`,
        book.title,
        e.message
      );

      if (attempt < retries) {
        await sleep(1500 * attempt);
      }
    }
  }

  throw lastError;
}

async function coverBuffer(book, width, height) {
  try {
    const file = await downloadCover(book);

    return await sharp(file)
      .resize(width, height, {
        fit: "cover",
        position: "centre"
      })
      .grayscale()
      .normalize()
      .png()
      .toBuffer();
  } catch (e) {
    console.warn("封面失败：", book.title, e.message);

    return await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: "#eeeeee"
      }
    })
      .png()
      .toBuffer();
  }
}

(async () => {
  const readingData = load("reading-export.json");
  const wishData = load("wish-export.json");
  const readData = load("read-export.json");

  const reading = recent(readingData.items);
  const wish = recent(wishData.items);
  const read = recent(readData.items);

  console.log(
    `近半年：读过 ${read.length} / 在读 ${reading.length} / 想读 ${wish.length}`
  );

  const currentReading = reading.slice(0, 3);
  const recentRead = read.slice(0, 4);
  const recentWish = wish.slice(0, 5);

  const composites = [];

  const canvas = sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 3,
      background: "#ffffff"
    }
  });

  /*
   * 正在读区域
   * 1本：大图
   * 2本：双列
   * 3本：三列
   */

  const readingCount = currentReading.length;

  let readingLayout = [];

  if (readingCount === 1) {
    readingLayout = [
      {
        x: 96,
        y: 300,
        w: 240,
        h: 336,
        textX: 390,
        textY: 375,
        mode: "large"
      }
    ];
  } else if (readingCount === 2) {
    readingLayout = [
      {
        x: 130,
        y: 315,
        w: 205,
        h: 287,
        textX: 232,
        textY: 645,
        mode: "small"
      },
      {
        x: 450,
        y: 315,
        w: 205,
        h: 287,
        textX: 552,
        textY: 645,
        mode: "small"
      }
    ];
  } else if (readingCount >= 3) {
    readingLayout = [
      {
        x: 92,
        y: 325,
        w: 175,
        h: 245,
        textX: 179,
        textY: 610,
        mode: "small"
      },
      {
        x: 315,
        y: 325,
        w: 175,
        h: 245,
        textX: 402,
        textY: 610,
        mode: "small"
      },
      {
        x: 538,
        y: 325,
        w: 175,
        h: 245,
        textX: 625,
        textY: 610,
        mode: "small"
      }
    ];
  }

  for (let i = 0; i < currentReading.length; i++) {
    const b = currentReading[i];
    const p = readingLayout[i];

    composites.push({
      input: await coverBuffer(b, p.w, p.h),
      left: p.x,
      top: p.y
    });
  }

  // 最近读过 4 本
  const readW = 210;
  const readH = 294;

  const readPos = [
    { x: 96, y: 830 },
    { x: 385, y: 830 },
    { x: 96, y: 1200 },
    { x: 385, y: 1200 }
  ];

  for (let i = 0; i < recentRead.length; i++) {
    composites.push({
      input: await coverBuffer(recentRead[i], readW, readH),
      left: readPos[i].x,
      top: readPos[i].y
    });
  }

  let svg = `
  <svg width="${WIDTH}" height="${HEIGHT}"
       xmlns="http://www.w3.org/2000/svg">

    <style>
     .cn {
  font-family: "Noto Serif CJK SC", "Noto Serif SC", "SimSun", serif;
  fill: #111;
}

.serif {
  font-family: "Noto Serif CJK SC", "Noto Serif SC", "SimSun", serif;
  fill: #111;
}

      .small {
        font-size: 25px;
      }

      .body {
        font-size: 30px;
      }

      .section {
        font-size: 34px;
        font-weight: 700;
      }

      .fine {
        fill: #666;
      }
    </style>

    <!-- 顶部 -->
    <text x="632" y="65"
          text-anchor="middle"
          class="serif"
          font-size="25"
          letter-spacing="5"
          fill="#666">
      ${esc(DISPLAY_NAME)}
    </text>

    <text x="632" y="122"
          text-anchor="middle"
          class="serif"
          font-size="58"
          letter-spacing="14">
      ${esc(PAGE_TITLE)}
    </text>

    <text x="632" y="166"
          text-anchor="middle"
          class="cn small fine">
      ${esc(SUBTITLE)}
    </text>

    <line x1="90" y1="205"
          x2="1174" y2="205"
          stroke="#555"
          stroke-width="1"/>

    <!-- 正在读 -->
    <text x="92" y="262"
          class="cn section">
      正在读
    </text>
  `;

  // 在读 1 本：保留当前大图布局
  if (readingCount === 1) {
    const b = currentReading[0];

    svg += `
      <text x="390" y="375"
            class="serif"
            font-size="50"
            font-weight="600">
        ${esc(shortTitle(b.title, 16))}
      </text>

      <text x="392" y="445"
            class="cn"
            font-size="31">
        ${esc(stars(b.rating))}
      </text>

      <text x="392" y="497"
            class="cn small fine">
        ${b.date.replaceAll("-", " · ")}
      </text>

      <text x="392" y="570"
            class="cn"
            font-size="23"
            fill="#777">
        近半年仅此一册在读
      </text>
    `;
  }

  // 在读 2～3 本：卡片下方显示标题、评分、日期
  if (readingCount >= 2) {
    currentReading.forEach((b, i) => {
      const p = readingLayout[i];

      svg += `
        <text x="${p.textX}" y="${p.textY}"
              text-anchor="middle"
              class="serif"
              font-size="24"
              font-weight="600">
          ${esc(shortTitle(b.title, 9))}
        </text>
      `;

      if (b.rating) {
        svg += `
          <text x="${p.textX}" y="${p.textY + 32}"
                text-anchor="middle"
                class="cn"
                font-size="18">
            ${esc(stars(b.rating))}
          </text>
        `;
      }

      svg += `
        <text x="${p.textX}" y="${p.textY + 60}"
              text-anchor="middle"
              class="cn"
              font-size="18"
              fill="#777">
          ${b.date.slice(5).replace("-", " · ")}
        </text>
      `;
    });

    if (reading.length > 3) {
      svg += `
        <text x="790" y="520"
              class="cn"
              font-size="23"
              fill="#777">
          另有 ${reading.length - 3} 本在读
        </text>
      `;
    }
  }

  svg += `
    <line x1="90" y1="710"
          x2="1174" y2="710"
          stroke="#999"
          stroke-width="1"/>

    <!-- 最近读过 -->
    <text x="92" y="775"
          class="cn section">
      最近读过
    </text>

    <!-- 右栏分隔 -->
    <line x1="720" y1="815"
          x2="720" y2="1490"
          stroke="#c6c6c6"
          stroke-width="1"/>

    <!-- 想读 -->
    <text x="765" y="850"
          class="cn section">
      想读
    </text>
  `;

  // 最近读过标题
  for (let i = 0; i < recentRead.length; i++) {
    const b = recentRead[i];
    const x = readPos[i].x + readW / 2;
    const y = readPos[i].y + readH + 39;

    svg += `
      <text x="${x}" y="${y}"
            text-anchor="middle"
            class="serif"
            font-size="24">
        ${esc(shortTitle(b.title, 10))}
      </text>
    `;
  }

  // 想读：书名加粗
  recentWish.forEach((b, i) => {
    const y = 930 + i * 102;

    svg += `
      <text x="765" y="${y}"
            class="serif"
            font-size="27"
            font-weight="600">
        ${esc(shortTitle(b.title, 11))}
      </text>

      <text x="765" y="${y + 34}"
            class="cn"
            font-size="20"
            fill="#777">
        ${b.date.slice(5).replace("-", " · ")}
      </text>
    `;
  });

  svg += `
    <text x="765" y="1470"
          class="cn"
          font-size="20"
          fill="#888">
      仅列最近 5 本
    </text>

    <!-- 底部 -->
    <line x1="90" y1="1540"
          x2="1174" y2="1540"
          stroke="#555"
          stroke-width="1"/>

    <text x="92" y="1602"
          class="cn"
          font-size="28">
      半年 · 读过 ${read.length} · 在读 ${reading.length} · 想读 ${wish.length}
    </text>

    <text x="1174" y="1602"
          text-anchor="end"
          class="cn"
          font-size="26"
          fill="#666">
    ${todayDisplay()}
    </text>

    <text x="632" y="1650"
          text-anchor="middle"
          class="cn"
          font-size="20"
          fill="#888">
      DOUBAN · ${esc(DOUBAN_USER_ID)}
    </text>

  </svg>
  `;

  composites.push({
    input: Buffer.from(svg),
    left: 0,
    top: 0
  });

  await canvas
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(path.join(ROOT, "bg_ss00.png"));

console.log("");
console.log("✓ 已生成：bg_ss00.png");
})();
