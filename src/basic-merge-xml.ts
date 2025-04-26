import * as fs from "fs";
import * as path from "path";

const inputFolder = "./dataXml";
const outputFile = "./dist/System_V2.xml";

const xmlFiles = fs
  .readdirSync(inputFolder)
  .filter((file) => file.endsWith(".xml"));

let mergedContent = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n';

for (const file of xmlFiles) {
  const content = fs.readFileSync(path.join(inputFolder, file), "utf-8");

  const cleanedContent = content.replace(/<\?xml.*?\?>/, "").trim();

  mergedContent += cleanedContent + "\n";
}

mergedContent += "</root>";

fs.writeFileSync(outputFile, mergedContent);

console.log(`Merged ${xmlFiles.length} files into ${outputFile}`);
