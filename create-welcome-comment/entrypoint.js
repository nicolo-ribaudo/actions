const Octokit = require("@octokit/rest");
const { Toolkit } = require("actions-toolkit");

const tools = new Toolkit({
  event: ["issues.opened"]
});

const github = new Octokit({ auth: `token ${token}` });

function checkCredentials() {
  if (!process.env.BOT_TOKEN) {
    tools.exit.failure(
      "You must include the BOT_TOKEN as an environment variable."
    );
  }
}

async function isBabelOrgMember() {
  const { data: organizations } = checkStatus(
    await github.orgs.listForUser({
      login: tools.context.payload.issue.user.login
    })
  );

  const isBabelOrgMember = organizations.some(({ login }) => login === "babel");

  return isBabelOrgMember;
}

function checkStatus(result) {
  if (result.status >= 200 && result.status < 300) {
    return result;
  }

  tools.exit.failure(`Received status ${result.status} from API.`);
}

async function createComment() {
  return checkStatus(
    await github.issues.createComment({
      ...tools.context.issue,
      body:
        `Hey @${
          tools.context.payload.issue.user.login
        }! We really appreciate you ` +
        "taking the time to report an issue. The collaborators on this project attempt to " +
        "help as many people as possible, but we're a limited number of volunteers, so it's " +
        "possible this won't be addressed swiftly.\n\n" +
        "If you need any help, or just have general Babel or JavaScript questions, we have a " +
        "vibrant [Slack community](https://babeljs.slack.com) that typically always has someone " +
        "willing to help. You can sign-up [here](https://slack.babeljs.io/) for an invite."
    })
  );
}

checkCredentials();

isBabelOrgMember()
  .then(isBabelOrgMember => {
    if (isBabelOrgMember) {
      tools.exit.neutral("USer is member of babel org. Skipping.");
    }
  })
  .then(createComment())
  .then(() => {
    tools.exit.success("action successful");
  })
  .catch(err => {
    tools.log.fatal(err);
    tools.exit.failure("action failed");
  });