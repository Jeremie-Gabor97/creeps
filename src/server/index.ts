import * as express from 'express';
import * as http from 'http';
import * as path from 'path';
import * as socketIO from 'socket.io';
import * as SocketContract from '../shared/socketcontract';
import Lobby from './lobby';

const app = express();
const port = process.env.PORT || 5000;
const server = http.createServer(app);
const ioServer = socketIO(server);

const lobby = new Lobby();

app.use(express.static('public'));

app.get('/', (req: express.Request, res: express.Response) => {
	res.sendFile(path.join(__dirname, '../../', 'index.html'));
});

ioServer.on('connection', function (socket: socketIO.Socket) {
	console.log('a user connected');
	socket.on('disconnect', function () {
		console.log('user disconnected');
	});

	socket.on(SocketContract.SocketEvent.Login, function (loginData: SocketContract.ILoginData) {
		const username = loginData.username;
		let usernameValid = true;
		let failReason = SocketContract.LoginFailedReason.UsernameInUse;
		if (/^\w+$/.test(username) === false) {
			usernameValid = false;
			failReason = SocketContract.LoginFailedReason.UsernameInvalid;
		}
		else if (username.length > 15) {
			usernameValid = false;
			failReason = SocketContract.LoginFailedReason.UsernameTooLong;
		}
		else if (lobby.players[username]) {
			usernameValid = false;
		}

		if (usernameValid) {
			console.log('logging in user', username);
			lobby.loginPlayer(socket, username);
		}
		else {
			console.log('failing to log in in user', username);
			const data: SocketContract.ILoginFailedData = {
				reason: failReason
			};
			socket.emit(SocketContract.SocketEvent.LoginFailed, data);
		}
	});
});

server.listen(port, () => console.log(`Listening on port ${port}`));