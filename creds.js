module.exports = {
    
    passwordCorrect(username,password) {
        return require("./users.js").getUser(username).password === password;
    }

}