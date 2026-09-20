const fs = require("fs");
const d = fs.readdirSync("src/i18n");
d.forEach(f => {
  const c = fs.readFileSync("src/i18n/" + f, "utf8");
  if (c.includes("'app.institute'")) {
    console.log(f);
  }
});
