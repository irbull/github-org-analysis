var GitHubApi = require("github");
var settings = require("./.settings.json");

var github = new GitHubApi({});

github.authenticate({
    type: "basic",
    username: settings.username,
    password: settings.password,
});
github.misc.getRateLimit({}, function (err, res) {
    console.log(JSON.stringify(res));
})

getRepositories(settings.organization, 'private').then((data) => {
    for (let item of data) {
        console.log(item);
    }
    console.log(`Size: ${data.length}`);
}).catch((result) => console.log(result));

function getRepositories(org, type) {
    return github.repos.getForOrg({ 'org': org, 'type': type }).then((res) => resolveAllPrivateRepos(res)).then((data) => flatten(data));
}

const flatten = list => list.reduce(
    (a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []
);

function resolveAllPrivateRepos(res) {
    let promises = [];
    for (let repo of res.data) {
        promises.push(resolveRepository(repo));
    }
    if (github.hasNextPage(res)) {
        promises.push(github.getNextPage(res).then((res) => resolveAllPrivateRepos(res)));
    }
    return Promise.all(promises);
}

function resolveRepository(repo) {
    return github.repos.getCommit({ 'owner': settings.organization, 'repo': repo.name, 'sha': repo.default_branch }).then((commit) => {
        if (commit && commit.data && commit.data.author) {
            return (`${repo.name}, ${repo.full_name}, ${repo.html_url}, ${repo.pushed_at}, ${repo.default_branch}, ${commit.data.author.login}`);
        } else if (commit && commit.data && commit.data.committer) {
            return (`${repo.name}, ${repo.full_name}, ${repo.html_url}, ${repo.pushed_at}, ${repo.default_branch}, ${commit.data.committer.login}`)
        } else if (commit && commit.data && commit.data.commit && commit.data.commit.committer) {
            return (`${repo.name}, ${repo.full_name}, ${repo.html_url}, ${repo.pushed_at}, ${repo.default_branch}, ${commit.data.commit.committer.email}`)
        } else {
            return (`${repo.name}, ${repo.full_name}, ${repo.html_url}, ${repo.pushed_at}, ${repo.default_branch}, undefined`)
        }
    }).catch((err) => `${repo.name}, ${repo.full_name}, ${repo.html_url}, ${repo.pushed_at}, ${repo.default_branch}, undefined`);
}
