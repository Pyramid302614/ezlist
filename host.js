const fs = require("fs");
const PLEP = require("./plep/index.js");

if(!fs.existsSync("config.json")) {
    console.error("Missing config.json > { port }");
    process.exit();
}
const config = require("./config.json");

process.addListener("uncaughtException",e => console.error(e.stack));
process.addListener("unhandledRejection",r => console.error(r));

PLEP.ratelimit.init(5,3);

function ip(req) {
    return req.headers["cf-connecting-ip"] ?? req.socket.remoteAddress;
}

const server = require("http").createServer(
    (req,res) => {
        const IP = ip(req);
        PLEP.ratelimit.signal(IP);
        if(PLEP.ratelimit.bad(IP)) return;
        PLEP.server.handle(
            req,
            res,
            (url,args) => {
                switch(url) {
                    case "": // Root "/"
                        return {
                            file: "client/index.html",
                            type: "text/html",
                            code: 200
                        };
                    case "login":
                        return {
                            file: "client/login.html",
                            type: "text/html",
                            code: 200
                        };
                    case "sign-up":
                        return {
                            file: "client/sign-up.html",
                            type: "text/html",
                            code: 200
                        };
                    case "favicon.ico":
                        return {
                            file: "assets/logo-small.png",
                            type: "image/png",
                            code: 200
                        };
                    case "asset":
                        if(args.file === undefined) return "Missing file parameter";
                        return {
                            file: `assets/${args.file}`,
                            type: args.type
                        };
                    case "creds": 
                        if(args.username === undefined || args.password === undefined) return "Missing credentials";
                        return require("./creds.js").passwordCorrect(args.username,args.password) ? "true": "false";
                    case "user-exists":
                        if(args.username === undefined) return "bad";
                        return require("./users.js").userExists(args.username) ? "true": "false";
                    case "user-create":
                        if(args.username === undefined || args.password === undefined) return "Missing credentials";
                        require("./users.js").createUser(args.username,args.password);
                        return "Done";
                    case "get-lists":
                        if(args.username === undefined || args.password === undefined) return "Missing credentials";
                        if(!require("./creds.js").passwordCorrect(args.username,args.password)) return "Invalid credentials";
                        return JSON.stringify(require("./users.js").getUser(args.username)?.lists ?? []);
                    case "change-password":
                        if(args.username === undefined || args.password === undefined) return "Missing credentials";
                        if(!require("./creds.js").passwordCorrect(args.username,args.password)) return "Invalid credentials";
                        const user = require("./users.js").getUser(args.username);
                        user.password = args["new-password"];
                        require("./users.js").setUser(args.username,user);
                        return "Done";
                    default: return {
                        code: 404
                    };
                }
            }
        );
    }
);
const wss = new (require("ws").WebSocket.Server)({ server });
wss.on("connection",ws => {
    ws.on("message",m => {
        const msg = m.toString();
        const name = msg.split("?")[0];
        const args = [];
        if(msg.includes("?")) msg.slice(msg.split("?")[0].length+1).split("&").forEach(i => args[i.split("=")[0]] = i.slice(i.split("=")[0].length+1));
        switch(name) {
            case "set-lists":
                if(args.username === undefined || args.password === undefined) break;
                if(!require("./creds.js").passwordCorrect(args.username,args.password)) break;
                const user = require("./users.js").getUser(args.username);
                user.lists = JSON.parse(args.value);
                require("./users.js").setUser(args.username,user);
                break;
        }
    });
});
server.listen(config.port,() => console.log("EZList > Ready when you are"));