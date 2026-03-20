import { exec } from "child_process";
import { existsSync } from "fs";
import { resolve as _resolve } from "path";

/**
 * 특정 GitHub repo의 특정 태그를 --depth 1로 클론하거나 업데이트하는 함수
 * @param {string} repoUrl - GitHub 저장소 URL (예: https://github.com/user/repo.git)
 * @param {string} tagName - 체크아웃할 태그 이름
 * @param {string} targetDir - 저장할 폴더 이름
 */
function cloneOrUpdateRepo(repoUrl, tagOrBranch, targetDir) {
  return new Promise((resolve, reject) => {
    const absPath = _resolve(targetDir);

    // 태그/브랜치 구분 함수
    function isTag(dir, name, cb) {
      exec(`cd ${dir} && git tag`, (err, stdout) => {
        if (err) return cb(false);
        const tags = stdout.split('\n').map(t => t.trim());
        cb(tags.includes(name));
      });
    }

    if (existsSync(absPath)) {
      console.log(`🔄 디렉토리 존재: ${absPath}, 업데이트 시도...`);
      isTag(absPath, tagOrBranch, (isTagResult) => {
        let cmd;
        if (isTagResult) {
          // 태그만 fetch/checkout
          cmd = `cd ${absPath} && git fetch origin tag ${tagOrBranch} && git checkout tags/${tagOrBranch}`;
        } else {
          // 브랜치만 fetch/checkout(FETCH_HEAD)
          cmd = `cd ${absPath} && git fetch origin ${tagOrBranch} && git checkout FETCH_HEAD`;
        }
        exec(cmd, (error, stdout, stderr) => {
          if (error) {
            console.error(`❌ 업데이트 실패: ${repoUrl} @ ${tagOrBranch}`);
            return reject(new Error(stderr || error.message));
          }
          console.log(stdout);
          console.log(`✅ 업데이트 완료: ${repoUrl} @ ${tagOrBranch}`);
          resolve(`Repo updated to ${isTagResult ? 'tag' : 'branch'} "${tagOrBranch}" in ${absPath}`);
        });
      });
    } else {
      console.log(`📂 새로 클론: ${repoUrl} @ ${tagOrBranch} → ${absPath}`);
      const cmd = `git clone --branch ${tagOrBranch} --depth 1 ${repoUrl} ${absPath}`;
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ 클론 실패: ${repoUrl} @ ${tagOrBranch}`);
          return reject(new Error(stderr || error.message));
        }
        console.log(stdout);
        console.log(`✅ 클론 완료: ${repoUrl} @ ${tagOrBranch} → ${absPath}`);
        resolve(`Repo cloned at ${tagOrBranch} into ${absPath}`);
      });
    }
  });
}

async function cloneEveryRepos() {
  try {
    console.log("=== 🛠️ 전체 클론/업데이트 시작 ===");
    console.log(await cloneOrUpdateRepo(
      "https://github.com/LoneGazebo/Community-Patch-DLL",
      "Release-5.2",
      "repos/current"
    ));
    console.log(await cloneOrUpdateRepo(
      "https://github.com/LoneGazebo/Community-Patch-DLL",
      "Release-5.1.4",
      "repos/old"
    ));
    console.log(await cloneOrUpdateRepo(
      "https://github.com/hyuckkim/vp_kr",
      "master",
      "repos/current_kr"
    ));
    console.log(await cloneOrUpdateRepo(
      "https://github.com/hyuckkim/vp_kr",
      "v5.1.4",
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
