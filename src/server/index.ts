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

	socket.on('login', function (loginData: SocketContract.ILoginData) {
		const usernameValid = true;
		if (usernameValid) {
			lobby.loginPlayer(socket, loginData.username);
		}
		else {
			socket.emit('loginFailed');
		}
	});
});

server.listen(port, () => console.log(`Listening on port ${port}`));