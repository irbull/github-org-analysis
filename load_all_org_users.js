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

getMembers(settings.organization, 'all').then((data) => {
    for (let item of data) {
        console.log(item);
    }
    console.log(`Size: ${data.length}`);
}).catch((result) => console.log(result));

const flatten = list => Array.isArray(list) ? list.reduce(
    (a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []
) : list;

function getMembers(organization, role) {
    return github.orgs.getMembers({ 'org': organization, 'role': role }).then((res) => resolveAllUsers(res)).then(data => flatten(data));
}

function resolveAllUsers(res) {
    let promises = [];
    for (let user of res.data) {
        promises.push(resolveUser(user));
    }
    if (github.hasNextPage(res)) {
        promises.push(github.getNextPage(res).then((res) => resolveAllUsers(res)));
    }
    return Promise.all(promises);
}

function resolveUser(user) {
    return github.users.getById({ 'id': user.id }).then((githubUser) =>
        github.orgs.getOrgMembership({ 'org': 'EclipseSource', 'username': user.login }).then((orgMember) =>
            `${user.login}, ${githubUser.data.email}, ${githubUser.data.name}, ${githubUser.data.html_url}, ${orgMember.data.role}`
        )
    );
}
