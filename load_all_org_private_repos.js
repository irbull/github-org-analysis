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

github.repos.getForOrg({ 'org': settings.organization, 'type': 'private' }, function (err, res) {
    if (err) {
        console.log(JSON.stringify(err));
    }
    let promise = new Promise((resolve, reject) => {
        resolveAllPrivateRepos(res, resolve, reject);
    });
    promise.then(function collect(result) {
        return flatten(result);
    }).then((data) => data.forEach((element, index) => console.log(element)));
});

const flatten = list => list.reduce(
    (a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []
);

function resolveAllPrivateRepos(res, resolve, reject) {
    let repos = res.data;
    let promises = [];
    for (let repo of repos) {
        promises.push(new Promise((resolve, reject) => {
            github.repos.getCommit({ 'owner': settings.organization, 'repo': repo.name, 'sha': repo.default_branch }, ((err, commit) => {
                if (err) console.log(err);
                if (commit && commit.data && commit.data.author) {
                    resolve(`${repo.name}, ${repo.full_name}, ${repo.html_url}, ${repo.pushed_at}, ${repo.default_branch}, ${commit.data.author.login}`)
                } else if (commit && commit.data && commit.data.committer) {
                    resolve(`${repo.name}, ${repo.full_name}, ${repo.html_url}, ${repo.pushed_at}, ${repo.default_branch}, ${commit.data.committer.login}`)
                } else if (commit && commit.data && commit.data.commit && commit.data.commit.committer) {
                    resolve(`${repo.name}, ${repo.full_name}, ${repo.html_url}, ${repo.pushed_at}, ${repo.default_branch}, ${commit.data.commit.committer.email}`)
                } else {
                    resolve(`${repo.name}, ${repo.full_name}, ${repo.html_url}, ${repo.pushed_at}, ${repo.default_branch}, undefined`)
                }
            }));
        }));
    }
    if (github.hasNextPage(res)) {
        let nextPromise = new Promise((resolve, reject) => {
            github.getNextPage(res, function (err, res) {
                resolveAllPrivateRepos(res, resolve, reject);
            });
        });
        promises.push(nextPromise);
        resolve(Promise.all(promises));
    } else {
        resolve(Promise.all(promises));
    }
}
