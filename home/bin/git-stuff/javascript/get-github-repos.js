const { Octokit } = require("@octokit/rest");

// https://github.com/octokit
// https://www.npmjs.com/package/@octokit/request
// https://github.com/octokit/request.js/


// --------------------------------------------------------------------------------
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await
function resolveAfterHalfASecond(x) {

  return new Promise(resolve => {
    setTimeout(() => {
      resolve(x);
    }, 500);
  });

}

async function f1() {
  const x = await resolveAfterHalfASecond(10);
  console.log("Logging x:" + x); // 10
}

// --------------------------------------------------------------------------------

const octokit = new Octokit();

async function f2() {

    let result = await octokit.request('GET /orgs/{org}/repos', {
        org: 'org'
    })

    console.log(`${result.data.length} repos found.`);
}

// --------------------------------------------------------------------------------

console.log("Start")
f1()
console.log("End")
