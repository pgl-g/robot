const https = require("https");
const path = require("path");
const fs = require("fs");
const { URL } = require("url");

const id = String(Math.floor(Math.random() * 100000));
const dirPath = path.resolve(__dirname, "pic");
const d = new Date();
const date = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
const filePath = path.join(dirPath, `${date}.png`);

const sources = [
  `https://robohash.org/${id}`,
  `https://api.dicebear.com/9.x/bottts/png?seed=${id}&size=300`,
];

if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function download(targetUrl, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      targetUrl,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; robot-daily/1.0)",
          Accept: "image/png,image/*;q=0.8,*/*;q=0.5",
        },
      },
      (res) => {
        const { statusCode, headers } = res;
        console.log(`GET ${targetUrl} -> ${statusCode}`);

        if (statusCode >= 300 && statusCode < 400 && headers.location) {
          res.resume();
          if (redirectsLeft <= 0) {
            reject(new Error("too many redirects"));
            return;
          }
          const next = new URL(headers.location, targetUrl).href;
          download(next, redirectsLeft - 1).then(resolve, reject);
          return;
        }

        if (statusCode !== 200) {
          res.resume();
          reject(new Error(`download failed: ${statusCode}`));
          return;
        }

        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      }
    );

    req.setTimeout(20000, () => {
      req.destroy(new Error("request timeout"));
    });
    req.on("error", reject);
  });
}

async function main() {
  let lastError;
  for (const url of sources) {
    try {
      const buf = await download(url);
      if (!buf.length) {
        throw new Error("empty response");
      }
      fs.writeFileSync(filePath, buf);
      console.log(`saved ${filePath} (${buf.length} bytes)`);
      return;
    } catch (err) {
      lastError = err;
      console.error(`failed ${url}:`, err.message || err);
    }
  }
  throw lastError || new Error("all sources failed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
