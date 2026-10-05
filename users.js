const file = "users.json"; // The path

module.exports = {

    getUser(username) {
        return getData()?.users?.[username] ?? {};
    },
    setUser(username,obj) {
        const data = getData();
        if(!data?.users) data.users = {};
        data.users[username] = obj;
        setData(data);
    },
    userExists(username) {
        return Object.keys(getData()?.users ?? {}).includes(username);
    },
    createUser(username,password) {
        this.setUser(username,{password:password});
    }

}

function getData() {
    if(!require("fs").existsSync(file)) return {};
    return JSON.parse(require("fs").readFileSync(file));
}
function setData(obj) {
    require("fs").writeFileSync(file,JSON.stringify(obj,null,2));
}