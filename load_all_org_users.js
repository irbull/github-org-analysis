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
    if (err) {
        console.log(JSON.stringify(err));
    }
    let promise = new Promise((resolve, reject) => {
        resolveAllUsers(res, resolve, reject);
    });
    promise.then(function collect(result) {
        return flatten(result);
    }).then((data)=>{
        console.log(data);
        console.log(data.length);
    });
});

const flatten = list => list.reduce(
    (a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []
);

function resolveAllUsers(res, resolve, reject) {
    let users = res.data;
    let promises = [];
    for (let user of users) {
        promises.push(new Promise((resolve, reject) => {
            github.users.getById({ 'id': user.id }, function (err, githubUser) {
                github.orgs.getOrgMembership({ 'org': 'EclipseSource', 'username': user.login }, function (err, orgMember) {
                    resolve(`${user.login}, ${githubUser.data.email}, ${githubUser.data.name}, ${githubUser.data.html_url}, ${orgMember.data.role}`);
                })
            })
        }));
    }
    if (github.hasNextPage(res)) {
        let nextPromise = new Promise((resolve, reject) => {
            github.getNextPage(res, function (err, res) {
                resolveAllUsers(res, resolve, reject);
            });
        });
        promises.push(nextPromise);
        resolve(Promise.all(promises));
    } else {
        resolve(Promise.all(promises));
    }
}
