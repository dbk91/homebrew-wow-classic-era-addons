import { octokit } from "./shared/octokit";

type UpdateInfo = {
  key: string;
  name: string;
  version: string;
  caskPath: string;
};

const updatesJson = process.env.UPDATES || "[]";
const updates: UpdateInfo[] = JSON.parse(updatesJson);

async function createPullRequest() {
  if (updates.length === 0) {
    console.log("No updates to process. Exiting.");
    process.exit(0);
  }

  const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
  const addonKeys = updates.map((u) => u.key).join("-");
  const branchName = `automation/update-${addonKeys}-${timestamp}`;
  let prNumber: number;

  try {
    console.log(`Creating branch: ${branchName}`);
    const { data: mainRef } = await octokit.rest.git.getRef({
      owner: process.env.GITHUB_REPOSITORY_OWNER!,
      repo: process.env.GITHUB_REPOSITORY?.split("/")[1]!,
      ref: "heads/main",
    });
    const mainSha = mainRef.object.sha;

    await octokit.rest.git.createRef({
      owner: process.env.GITHUB_REPOSITORY_OWNER!,
      repo: process.env.GITHUB_REPOSITORY?.split("/")[1]!,
      ref: `refs/heads/${branchName}`,
      sha: mainSha,
    });

    const updatedFiles = updates.map((u) => u.caskPath);
    console.log(`Adding files: ${updatedFiles.join(", ")}`);

    const { data: mainCommit } = await octokit.rest.git.getCommit({
      owner: process.env.GITHUB_REPOSITORY_OWNER!,
      repo: process.env.GITHUB_REPOSITORY?.split("/")[1]!,
      commit_sha: mainSha,
    });
    const baseTree = mainCommit.tree.sha;

    const blobs = [];
    for (const file of updatedFiles) {
      const content = await Bun.file(file).text();
      const { data: blob } = await octokit.rest.git.createBlob({
        owner: process.env.GITHUB_REPOSITORY_OWNER!,
        repo: process.env.GITHUB_REPOSITORY?.split("/")[1]!,
        content,
        encoding: "utf-8",
      });
      blobs.push({ path: file, sha: blob.sha });
    }

    const { data: newTree } = await octokit.rest.git.createTree({
      owner: process.env.GITHUB_REPOSITORY_OWNER!,
      repo: process.env.GITHUB_REPOSITORY?.split("/")[1]!,
      base_tree: baseTree,
      tree: blobs.map(({ path, sha }) => ({ path, mode: "100644", type: "blob", sha })),
    });

    const updatesList = updates.map((u) => `${u.name} to v${u.version}`).join(", ");
    const commitMessage = `Bump ${updatesList}`;
    const { data: newCommit } = await octokit.rest.git.createCommit({
      owner: process.env.GITHUB_REPOSITORY_OWNER!,
      repo: process.env.GITHUB_REPOSITORY?.split("/")[1]!,
      message: commitMessage,
      tree: newTree.sha,
      parents: [mainSha],
      author: {
        name: "GitHub Actions",
        email: "actions@github.com",
      },
    });

    await octokit.rest.git.updateRef({
      owner: process.env.GITHUB_REPOSITORY_OWNER!,
      repo: process.env.GITHUB_REPOSITORY?.split("/")[1]!,
      ref: `heads/${branchName}`,
      sha: newCommit.sha,
    });

    // Poll until the branch is available via the API (max 10s)
    let branchReady = false;
    for (let i = 0; i < 20; i++) { // 20 x 500ms = 10s
      try {
        await octokit.rest.git.getRef({
          owner: process.env.GITHUB_REPOSITORY_OWNER!,
          repo: process.env.GITHUB_REPOSITORY?.split("/")[1]!,
          ref: `heads/${branchName}`,
        });
        branchReady = true;
        break;
      } catch (e) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    if (!branchReady) {
      throw new Error(`Branch ${branchName} not available after waiting.`);
    }

    console.log("Checking for existing pull requests...");
    const existingPRs = await octokit.rest.pulls.list({
      owner: process.env.GITHUB_REPOSITORY_OWNER!,
      repo: process.env.GITHUB_REPOSITORY?.split("/")[1]!,
      state: "open",
      base: "main",
    });

    const existingPR = existingPRs.data.find((pr) => pr.title === commitMessage);
    if (existingPR) {
      console.log(`Pull request already exists with title: "${commitMessage}"`);
      console.log(`Existing PR branch: ${existingPR.head.ref}`);
      console.log("Skipping PR creation to avoid duplicates.");
      process.exit(0);
    }

    console.log("Pushing to remote...");
    await Bun.$`git push --set-upstream origin ${branchName}`;

    console.log("Creating pull request...");
    const prBody = `Automated update of: ${updatesList}`;

    const pr = await octokit.rest.pulls.create({
      owner: process.env.GITHUB_REPOSITORY_OWNER!,
      repo: process.env.GITHUB_REPOSITORY?.split("/")[1]!,
      title: commitMessage,
      body: prBody,
      head: branchName,
      base: "main",
    });
    prNumber = pr.data.number;

    console.log(`Pull request #${prNumber} created successfully!`);
  } catch (error) {
    console.error("Error creating pull request:", error);
    process.exit(1);
  }

  // Enable auto-merge
  try {
    await Bun.$`gh pr merge --auto --squash ${prNumber}`;
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
