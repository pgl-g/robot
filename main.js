const https = require("https");
const path = require("path");
const fs = require("fs");

const id = (~~(Math.random() * 100000)).toString();
const url = `https://robohash.org/${id}`;
const dirPath = path.resolve(__dirname, "pic");

const d = new Date();
const date = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
const filePath = path.join(dirPath, `${date}.png`);

if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}

https
  .get(url, (res) => {
    if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      https.get(res.headers.location, (redirectRes) => save(redirectRes));
      return;
    }
    save(res);
  })
  .on("error", (err) => {
    console.error(err);
    process.exit(1);
  });

function save(res) {
  if (res.statusCode !== 200) {
    console.error(`download failed: ${res.statusCode}`);
    process.exit(1);
  }
  const stream = fs.createWriteStream(filePath);
  res.pipe(stream);
  stream.on("finish", () => {
    console.log(`saved ${filePath}`);
  });
  stream.on("error", (err) => {
    console.error(err);
    process.exit(1);
  });
}
