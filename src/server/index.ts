import * as http from 'http';
import * as express from 'express';
import * as socketIO from 'socket.io';
import * as path from 'path';

const app = express();
const port = process.env.PORT || 5000;
const server = http.createServer(app);
const ioServer = socketIO(server);

app.use(express.static('public'));

app.get('/', (req: express.Request, res: express.Response) => {
	res.sendFile(path.join(__dirname, '../../', 'index.html'));
});

ioServer.on('connection', function (socket: socketIO.Socket) {
	console.log('a user connected');
	socket.on('disconnect', function () {
		console.log('user disconnected');
	});
});

server.listen(port, () => console.log(`Listening on port ${port}`));