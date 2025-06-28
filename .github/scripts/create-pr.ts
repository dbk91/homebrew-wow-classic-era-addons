type UpdateInfo = {
  key: string;
  name: string;
  version: string;
  caskPath: string;
};

type GitHubPR = {
  title: string;
  headRefName: string;
};

const updatesJson = process.env.UPDATES || "[]";
const updates: UpdateInfo[] = JSON.parse(updatesJson);

async function createPullRequest() {
  if (updates.length === 0) {
    console.log("No updates to process. Exiting.");
    process.exit(0);
  }

  try {
    await Bun.$`git config user.name "GitHub Actions"`;
    await Bun.$`git config user.email "actions@github.com"`;

    const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
    const addonKeys = updates.map((u) => u.key).join("-");
    const branchName = `automation/update-${addonKeys}-${timestamp}`;

    console.log(`Creating branch: ${branchName}`);

    await Bun.$`git checkout -b ${branchName}`;

    const updatedFiles = updates.map((u) => u.caskPath);
    console.log(`Adding files: ${updatedFiles.join(", ")}`);

    for (const file of updatedFiles) {
      await Bun.$`git add ${file}`;
    }

    const updatesList = updates.map((u) => `${u.name} to v${u.version}`).join(", ");
    const commitMessage = `Bump ${updatesList}`;

    console.log(`Creating commit: ${commitMessage}`);
    await Bun.$`git commit -m ${commitMessage}`;

    console.log("Checking for existing pull requests...");
    const existingPRs = await Bun.$`gh pr list --state open --base main --json title,headRefName`.text();
    const prs: GitHubPR[] = JSON.parse(existingPRs);

    const existingPR = prs.find((pr: GitHubPR) => pr.title === commitMessage);
    if (existingPR) {
      console.log(`Pull request already exists with title: "${commitMessage}"`);
      console.log(`Existing PR branch: ${existingPR.headRefName}`);
      console.log("Skipping PR creation to avoid duplicates.");
      process.exit(0);
    }

    console.log("Pushing to remote...");
    await Bun.$`git push --set-upstream origin ${branchName}`;

    console.log("Creating pull request...");
    const prBody = `Automated update of: ${updatesList}`;

    await Bun.$`gh pr create --title ${commitMessage} --body ${prBody} --base main --head ${branchName}`;
    console.log("Pull request created successfully!");
  } catch (error) {
    console.error("Error creating pull request:", error);
    process.exit(1);
  }

  try {
    await Bun.$`gh pr merge --auto --squash`;
    console.log("Auto-merge enabled. PR will merge automatically when checks pass.");
  } catch (mergeError) {
    console.warn("Failed to enable auto-merge:", mergeError);
    console.log("PR created but auto-merge could not be enabled. Manual merge may be required.");
    // Don't exit with error since PR was created successfully
  }
}

try {
  await createPullRequest();
} catch (error) {
  console.error("Uncaught error:", error);
  process.exit(1);
}
