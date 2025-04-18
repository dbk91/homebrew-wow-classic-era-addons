type UpdateInfo = {
  key: string;
  name: string;
  version: string;
  caskPath: string;
};

// Get environment variables
const updatesJson = process.env.UPDATES || "[]";
const updates: UpdateInfo[] = JSON.parse(updatesJson);

async function createPullRequest() {
  if (updates.length === 0) {
    console.log("No updates to process. Exiting.");
    process.exit(0);
  }

  try {
    // Configure git
    await Bun.$`git config user.name "GitHub Actions"`;
    await Bun.$`git config user.email "actions@github.com"`;

    // Generate branch name with addon keys and timestamp
    const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
    const addonKeys = updates.map((u) => u.key).join("-");
    const branchName = `automation/update-${addonKeys}-${timestamp}`;

    console.log(`Creating branch: ${branchName}`);

    // Create and checkout new branch
    await Bun.$`git checkout -b ${branchName}`;

    // Add all updated files
    const updatedFiles = updates.map((u) => u.caskPath);
    console.log(`Adding files: ${updatedFiles.join(", ")}`);

    for (const file of updatedFiles) {
      await Bun.$`git add ${file}`;
    }

    // Create commit message from updates
    const updatesList = updates.map((u) => `${u.name} to v${u.version}`).join(", ");
    const commitMessage = `Bump ${updatesList}`;

    console.log(`Creating commit: ${commitMessage}`);
    await Bun.$`git commit -m ${commitMessage}`;

    // Push to remote
    console.log("Pushing to remote...");
    await Bun.$`git push --set-upstream origin ${branchName}`;

    // Create PR
    console.log("Creating pull request...");
    const prBody = `Automated update of: ${updatesList}`;

    await Bun.$`gh pr create --title ${commitMessage} --body ${prBody} --base main --head ${branchName}`;

    console.log("Pull request created successfully!");
  } catch (error) {
    console.error("Error creating pull request:", error);
    process.exit(1);
  }
}

try {
  await createPullRequest();
} catch (error) {
  console.error("Uncaught error:", error);
  process.exit(1);
}
