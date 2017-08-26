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

/*
getMembers(settings.organization, 'all').then((data) => {
    for (let item of data) {
        console.log(item);
    }
    console.log(`Size: ${data.length}`);
}).catch((result) => console.log(result));
*/

getOrganizationRepositories(settings.organization,'private');



const flatten = list => Array.isArray(list) ? list.reduce(
    (a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []
) : list;

function getOrganizationRepositories(org, type) {
  return github.repos.getForOrg({'org':org,'type':type}).then((res)=>resolveAllPrivateRepos(res)).then((data)=>{
      for(let item of data){
          if(item||item.owner) 
            github.repos.checkCollaborator({'owner':item.owner.login,'repo':item.name,'username':'irbull'}).then((data)=>console.log(data)).catch((err)=>console.log(err));
          else 
            console.log(item.owner);
      }

    console.log(data[0]);
      //console.log(kJSON.stringify(data));
  }).catch((err)=>console.log(err));
}

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
    return repo;
}

function getMembers(organization, role) {
    return github.orgs.getOutsideCollaborators({
        'org': organization,
        'role': role
    }).then((res) => resolveAllUsers(res))
        .then((data) => flatten(data));
}

function resolveAllUsers(res) {
    let promises = [];
    for (let user of res.data) {
        promises.push(resolveUser(user));
    }
    if (github.hasNextPage(res)) {
        promises.push(github.getNextPage(res).then((res) =>
            resolveAllUsers(res)
        ));
    }
    return Promise.all(promises);
}

function resolveUser(user) {
    return github.repos.getForUser({'username':user.login, 'type':'member'}).then((res) => {
        console.log("USER: " + user.login);
        return resolveUsersRepos(res);
    });
    /*
    return github.users.getById({ 'id': user.id }).then((githubUser) =>
        github.orgs.getOrgMembership({
            'org': 'EclipseSource',
            'username': user.login
        }).then((orgMember) =>
            `${user.login}, ${githubUser.data.email},` +
            `${githubUser.data.name}, ${githubUser.data.html_url},` +
            `${orgMember.data.role}`
            ).catch((err) =>
                `${user.login}, ${githubUser.data.email},` +
                `${githubUser.data.name}, ${githubUser.data.html_url}`
            )
    );*/
}

function resolveRepo(repo) {
    if ( repo.owner.login === 'eclipsesource' ) {
       console.log(repo);
       console.log("***************");
       return Promise.resolve(`${repo.html_url}`);
    } else {
        console.log(repo.owner.login);
    }
    return Promise.resolve('');

}

function resolveUsersRepos(res) {
    let promises = [];
    for( let repo of res.data) {
        promises.push(resolveRepo(repo));
    }
    if (github.hasNextPage(res)) {
        promises.push(github.getNextPage(res).then((res) =>
            resolveUsersRepos(res)
        ));
    }
    return Promise.all(promises);
}
