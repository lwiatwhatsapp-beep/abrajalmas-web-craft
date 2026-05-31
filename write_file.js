const fs = require("fs");
const content = fs.readFileSync("C:/Users/al3r18y/OneDrive/Desktop/Abraj/abrajalmas-web-craft/src/components/abraj/AbrajSite_new.tsx", "utf8");
fs.writeFileSync("C:/Users/al3r18y/OneDrive/Desktop/Abraj/abrajalmas-web-craft/src/components/abraj/AbrajSite.tsx", content, "utf8");
console.log("Done. Written", content.length, "chars");
