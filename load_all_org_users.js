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

github.orgs.getMembers({ 'org': settings.organization, 'role': 'all' }, function (err, res) {
    let promise = new Promise((resolve, reject) => {
        resolveAllUsers(err, res, resolve, reject);
    });
    promise.then(function collect(result) {
        return flatten(result);
    }).then((data) => {
        console.log(data);
        console.log(data.length);
    }).catch((result)=>console.log(JSON.stringify(result)));
});

const flatten = list => list.reduce(
    (a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []
);

function resolveAllUsers(err, res, resolve, reject) {
    if (err) return reject("Error: " + JSON.stringify(err));
    let users = res.data;
    let promises = [];
    for (let user of users) {
        promises.push(new Promise((resolve, reject) => {
            github.users.getById({ 'id': user.id }, function (err, githubUser) {
                if (err) return reject("Error: " + JSON.stringify(err));
                github.orgs.getOrgMembership({ 'org': 'EclipseSource', 'username': user.login }, function (err, orgMember) {
                    if (err) return reject("Error: " + JSON.stringify(err));
                    resolve(`${user.login}, ${githubUser.data.email}, ${githubUser.data.name}, ${githubUser.data.html_url}, ${orgMember.data.role}`);
                })
            })
        }));
    }
    if (github.hasNextPage(res)) {
        let nextPromise = new Promise((resolve, reject) => {
            github.getNextPage(res, function (err, res) {
                resolveAllUsers(err, res, resolve, reject);
            });
        });
        promises.push(nextPromise);
    }
    resolve(Promise.all(promises));
}
