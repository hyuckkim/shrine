import { exec } from "child_process";
import { existsSync } from "fs";
import { resolve as _resolve } from "path";

/**
 * 특정 GitHub repo의 특정 태그를 --depth 1로 클론하거나 업데이트하는 함수
 * @param {string} repoUrl - GitHub 저장소 URL (예: https://github.com/user/repo.git)
 * @param {string} tagName - 체크아웃할 태그 이름
 * @param {string} targetDir - 저장할 폴더 이름
 */
function cloneOrUpdateRepo(repoUrl, tagName, targetDir) {
  return new Promise((resolve, reject) => {
    const absPath = _resolve(targetDir);

    if (existsSync(absPath)) {
      console.log(`🔄 디렉토리 존재: ${absPath}, 업데이트 시도...`);
      // 이미 존재하면 해당 디렉토리에서 git fetch & checkout & pull
      const cmd = `
        cd ${absPath} && \
        git fetch --all --tags && \
        git checkout ${tagName} && \
        git pull origin ${tagName}
      `;
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ 업데이트 실패: ${repoUrl} @ ${tagName}`);
          return reject(new Error(stderr || error.message));
        }
        console.log(stdout);
        console.log(`✅ 업데이트 완료: ${repoUrl} @ ${tagName}`);
        resolve(`Repo updated to tag "${tagName}" in ${absPath}`);
      });
    } else {
      console.log(`📂 새로 클론: ${repoUrl} @ ${tagName} → ${absPath}`);
      const cmd = `git clone --branch ${tagName} --depth 1 ${repoUrl} ${absPath}`;
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ 클론 실패: ${repoUrl} @ ${tagName}`);
          return reject(new Error(stderr || error.message));
        }
        console.log(stdout);
        console.log(`✅ 클론 완료: ${repoUrl} @ ${tagName} → ${absPath}`);
        resolve(`Repo cloned at tag "${tagName}" into ${absPath}`);
      });
    }
  });
}

async function cloneEveryRepos() {
  try {
    console.log("=== 🛠️ 전체 클론/업데이트 시작 ===");
    console.log(await cloneOrUpdateRepo(
      "https://github.com/LoneGazebo/Community-Patch-DLL",
      "Release-5.0-alpha.01",
      "repos/current"
    ));
    console.log(await cloneOrUpdateRepo(
      "https://github.com/LoneGazebo/Community-Patch-DLL",
      "Release-4.22-TRUE",
      "repos/old"
    ));
    console.log(await cloneOrUpdateRepo(
      "https://github.com/handanikr/vp_kr",
      "master",
      "repos/current_kr"
    ));
    console.log(await cloneOrUpdateRepo(
      "https://github.com/handanikr/vp_kr",
      "v4.22",
      "repos/old_kr"
    ));
    console.log("=== 🎉 전체 클론/업데이트 완료 ===");
  }
  catch (error) {
    console.error("💥 Error cloning/updating repositories:", error.message);
  }
}

(async () => {
  try {
    await cloneEveryRepos();
  }
  catch (error) {
    console.error("💥 Error in cloning/updating process:", error.message);
  }
})();
