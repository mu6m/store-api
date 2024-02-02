//simple server has one functionality
//to alert other clients that has the
//same userID that the cart needs to
//reload
var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);

io.on("connection", (socket: any) => {
	socket.on("add", (data: any) => {
		socket.join(data);
	});
	socket.on("notify", (data: any) => {
		io.to(data).emit("reload");
	});
});

io.listen(3000);
