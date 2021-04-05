const server = require("./web/server");

server.start(4658, () => {
    console.log("Server listening on port 4658");
});