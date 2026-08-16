const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = __dirname;
const CONFIG = JSON.parse(
  fs.readFileSync(path.join(ROOT, "config.json"), "utf8")
);

const width = Number(CONFIG.screenWidth || 1264);
const height = Number(CONFIG.screenHeight || 1680);

if (
  !Number.isInteger(width) ||
  !Number.isInteger(height) ||
  width <= 0 ||
  height <= 0
) {
  throw new Error(
    "config.json 中的 screenWidth / screenHeight 必须是正整数"
  );
}

const input = path.join(ROOT, "bg_ss00.png");
const temp = path.join(ROOT, "bg_ss00.resized.png");

(async () => {
  const meta = await sharp(input).metadata();

  if (meta.width === width && meta.height === height) {
    console.log(`✓ 屏保尺寸已是 ${width} × ${height}，无需缩放`);
    return;
  }

  await sharp(input)
    .resize(width, height, { fit: "fill" })
    .png({ compressionLevel: 9 })
    .toFile(temp);

  fs.renameSync(temp, input);
  console.log(`✓ 已适配屏幕尺寸：${width} × ${height}`);
})();
