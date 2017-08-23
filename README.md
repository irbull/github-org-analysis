Simple tools for analyzing GitHub organizations
================

Simple tools that use the GitHub API to analize organizations.

* `load_all_org_private_repos.js` is used to create a CSV of all the private repos
* `load_all_org_users.js` is used to create a CSV of all the org users

To use these scripts, create a `.settings.json` file at the root with the following content:
```
{
    "username":"<your username>",
    "password":"<your password>",
    "organization":"<your organization>"
}
```
