type ReleaseJson = {
  tag_name: string;
};

type AddonInfo = {
  name: string;
  repo: string;
  caskName: string;
  artifactName: string;
  filenameSuffix?: string;
};

type UpdateResult = {
  key: string;
  name: string;
  version: string;
  caskPath: string;
};

const GITHUB_OUTPUT = Bun.file(process.env.GITHUB_OUTPUT!);

const ADDONS: Record<string, AddonInfo> = {
  questie: {
    name: "Questie",
    repo: "Questie/Questie",
    caskName: "questie",
    artifactName: "Questie",
  },
  restedxp: {
    name: "RestedXP",
    repo: "RestedXP/RXPGuides",
    caskName: "restedxp",
    artifactName: "RXPGuides",
    filenameSuffix: "-classic",
  },
};

async function getLatestRelease(addonInfo: AddonInfo) {
  const response = await fetch(`https://api.github.com/repos/${addonInfo.repo}/releases/latest`);
  const releaseJson = (await response.json()) as ReleaseJson;
  const version = releaseJson.tag_name.replace("v", "");
  const suffix = addonInfo.filenameSuffix || "";
  const url = `https://github.com/${addonInfo.repo}/releases/download/v${version}/${addonInfo.artifactName}-v${version}${suffix}.zip`;

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

async function updateCask(addonInfo: AddonInfo, version: string, sha256: string) {
  const caskPath = `${import.meta.dir}/../../Casks/${addonInfo.caskName}.rb`;

  console.log(`Updating cask file at ${caskPath}...`);
  let caskContent = await Bun.file(caskPath).text();

  const match = caskContent.match(/sha256 "(.*)"/);
  // Shouldn't happen. Appeasing the TS compiler.
  if (match === null) {
    console.error(`Error: sha256 not found in ${addonInfo.name} cask file`);
    process.exit(1);
  }

  const [, currentSha] = match;
  if (sha256 === currentSha) {
    console.log(`No new releases found for ${addonInfo.name}. Skipping...`);
    return false;
  }

  caskContent = caskContent.replace(/version ".*"/, `version "${version}"`);
  caskContent = caskContent.replace(/sha256 ".*"/, `sha256 "${sha256}"`);

  await Bun.write(caskPath, caskContent);

  console.log(`${addonInfo.name} cask updated successfully!`);
  return true;
}

async function updateAddon(addonKey: string): Promise<UpdateResult | null> {
  const addonInfo = ADDONS[addonKey];
  if (typeof addonInfo === "undefined") {
    console.error(`Addon ${addonKey} not found.`);
    process.exit(1);
  }
  console.log(`Starting ${addonInfo.name} update process...`);

  const { version, url } = await getLatestRelease(addonInfo);
  console.log(`Latest version: ${version}`);
  console.log(`Download URL: ${url}`);

  const sha256 = await downloadAndCalculateSha256(url);
  console.log(`SHA256: ${sha256}`);

  const updated = await updateCask(addonInfo, version, sha256);
  if (updated) {
    return {
      key: addonKey,
      name: addonInfo.name,
      version,
      caskPath: `Casks/${addonInfo.caskName}.rb`,
    };
  }
  return null;
}

async function main() {
  // Process all addons concurrently
  const addonKeys = Object.keys(ADDONS);
  console.log(`Starting concurrent update process for ${addonKeys.length} addons...`);
  
  try {
    // Create an array of update promises and run them concurrently
    const updatePromises = addonKeys.map(key => updateAddon(key));
    const results = await Promise.all(updatePromises);
    
    // Filter out null results (addons that didn't need updates)
    const updates = results.filter((result): result is UpdateResult => result !== null);

    if (updates.length === 0) {
      console.log("No updates were needed for any addons.");
      // Write empty values to GitHub output to indicate no updates
      await GITHUB_OUTPUT.write("has_updates=false\n");
    } else {
      console.log(`Updated ${updates.length} addon(s): ${updates.map((u) => `${u.name} to v${u.version}`).join(", ")}`);

      // Write update information to GitHub outputs
      await GITHUB_OUTPUT.write("has_updates=true\n");

      // Create a JSON string with all update information
      const updatesJson = JSON.stringify(updates);
      await GITHUB_OUTPUT.write(`updates=${updatesJson}\n`);

      // Create a comma-separated list of updated addon names and versions for PR title
      const updatesList = updates.map((u) => `${u.name} to v${u.version}`).join(", ");
      await GITHUB_OUTPUT.write(`updates_list=${updatesList}\n`);

      // Create a space-separated list of file paths that were updated (for git add)
      const filePaths = updates.map((u) => u.caskPath).join(" ");
      await GITHUB_OUTPUT.write(`updated_files=${filePaths}\n`);
    }
  } catch (error) {
    console.error("Error updating addons:", error);
    process.exit(1);
  }
}

main();
