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
const deviceOutputs = Array.isArray(CONFIG.deviceOutputs)
  ? CONFIG.deviceOutputs
  : [];

function validateOutput(output) {
  const file = String(output.file || "").trim();
  const outputWidth = Number(output.width);
  const outputHeight = Number(output.height);

  if (!/^bg_[A-Za-z0-9_-]+\.png$/.test(file)) {
    throw new Error(`无效的设备输出文件名：${file}`);
  }
  if (
    !Number.isInteger(outputWidth) ||
    !Number.isInteger(outputHeight) ||
    outputWidth <= 0 ||
    outputHeight <= 0
  ) {
    throw new Error(`${file} 的 width / height 必须是正整数`);
  }

  return { file, width: outputWidth, height: outputHeight };
}

(async () => {
  const meta = await sharp(input).metadata();

  if (meta.width === width && meta.height === height) {
    console.log(`✓ 屏保尺寸已是 ${width} × ${height}，无需缩放`);
  } else {
    await sharp(input)
      .resize(width, height, { fit: "fill" })
      .png({ compressionLevel: 9 })
      .toFile(temp);

    fs.renameSync(temp, input);
    console.log(`✓ 已适配屏幕尺寸：${width} × ${height}`);
  }

  for (const rawOutput of deviceOutputs) {
    const output = validateOutput(rawOutput);
    await sharp(input)
      .flatten({ background: "#fff" })
      .grayscale()
      .resize(output.width, output.height, { fit: "fill" })
      .png({ compressionLevel: 9 })
      .toFile(path.join(ROOT, output.file));
    console.log(`✓ 已生成 ${output.file}：${output.width} × ${output.height}`);
  }
})();
