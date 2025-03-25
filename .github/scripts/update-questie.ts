type ReleaseJson = {
  tag_name: string;
};

async function getLatestRelease() {
  const response = await fetch("https://api.github.com/repos/Questie/Questie/releases/latest");
  const releaseJson = (await response.json()) as ReleaseJson;
  const version = releaseJson.tag_name.replace("v", "");
  const url = `https://github.com/Questie/Questie/releases/download/v${version}/Questie-v${version}.zip`;

  return { version, url };
}

async function downloadAndCalculateSha256(url: string): Promise<string> {
  console.log(`Downloading from ${url}...`);
  const response = await fetch(url);

  console.log("Calculating SHA256...");
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(await response.arrayBuffer());

  return hasher.digest("hex");
}

async function updateCask(version: string, sha256: string) {
  const caskPath = `${import.meta.dir}/../../Casks/questie.rb`;

  console.log(`Updating cask file at ${caskPath}...`);
  let caskContent = await Bun.file(caskPath).text();

  caskContent = caskContent.replace(/version ".*"/, `version "${version}"`);
  caskContent = caskContent.replace(/sha256 ".*"/, `sha256 "${sha256}"`);

  await Bun.write(caskPath, caskContent);

  console.log("Cask updated successfully!");
}

try {
  console.log("Starting Questie update process...");

  const { version, url } = await getLatestRelease();
  console.log(`Latest version: ${version}`);
  console.log(`Download URL: ${url}`);

  const sha256 = await downloadAndCalculateSha256(url);
  console.log(`SHA256: ${sha256}`);

  await updateCask(version, sha256);
} catch (error) {
  console.error("Error updating Questie:", error);
  process.exit(1);
}
