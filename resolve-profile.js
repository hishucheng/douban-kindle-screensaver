const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const CONFIG_FILE = path.join(ROOT, "config.json");

function decodeHtml(s = "") {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) =>
      String.fromCodePoint(parseInt(n, 16))
    );
}

function formatDisplayName(nickname) {
  const chars = Array.from(nickname.trim());

  if (
    chars.length >= 2 &&
    chars.length <= 6 &&
    chars.every(ch => /[\u3400-\u9fff]/.test(ch))
  ) {
    return `${chars.join(" ")} 的`;
  }

  return `${nickname.trim()} 的`;
}

async function fetchNickname(userId) {
  const url = `https://book.douban.com/people/${encodeURIComponent(userId)}/`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "text/html,application/xhtml+xml"
    }
  });

  if (!res.ok) {
    throw new Error(`豆瓣主页请求失败：HTTP ${res.status}`);
  }

  const html = await res.text();
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = decodeHtml(titleMatch?.[1] || "")
    .replace(/\s+/g, " ")
    .trim();

  let nickname = title
    .replace(/\s*的读书主页\s*$/u, "")
    .replace(/\s*\(豆瓣\)\s*$/u, "")
    .replace(/\s*-\s*豆瓣\s*$/u, "")
    .trim();

  if (!nickname || nickname === title) {
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);

    if (h1Match) {
      nickname = decodeHtml(h1Match[1].replace(/<[^>]+>/g, " "))
        .replace(/\s+/g, " ")
        .trim();
    }
  }

  if (!nickname) {
    throw new Error("未能从豆瓣读书主页解析昵称");
  }

  return nickname;
}

(async () => {
  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  const userId = String(config.doubanUserId || "").trim();

  if (!userId) {
    throw new Error("config.json 中缺少 doubanUserId");
  }

  // 用户显式填写了显示名和页面标题时，尊重手工配置。
  if (String(config.displayName || "").trim() && String(config.pageTitle || "").trim()) {
    console.log("已使用 config.json 中的手工显示名和页面标题");
    return;
  }

  try {
    const nickname = await fetchNickname(userId);

    if (!String(config.displayName || "").trim()) {
      config.displayName = formatDisplayName(nickname);
    }

    // 主标题保持统一为“豆瓣秀”，避免与上方昵称重复。
    if (!String(config.pageTitle || "").trim()) {
      config.pageTitle = "豆瓣秀";
    }

    console.log(`豆瓣昵称：${nickname}`);
    console.log(`屏保显示名：${config.displayName}`);
    console.log(`页面标题：${config.pageTitle}`);
  } catch (e) {
    // 获取昵称失败时也绝不沿用仓库作者昵称。
    console.warn(`自动获取豆瓣昵称失败：${e.message}`);

    if (!String(config.displayName || "").trim()) {
      config.displayName = `DOUBAN ${userId}`;
    }

    if (!String(config.pageTitle || "").trim()) {
      config.pageTitle = "豆瓣秀";
    }
  }

  fs.writeFileSync(
    CONFIG_FILE,
    JSON.stringify(config, null, 2) + "\n",
    "utf8"
  );
})();
