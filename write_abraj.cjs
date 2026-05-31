const fs = require("fs");
const content = require("./AbrajSite_content.json").c;
fs.writeFileSync("./src/components/abraj/AbrajSite.tsx", content, "utf8");
console.log("Written", content.length, "chars");
