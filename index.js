const net = require('net');

const server = net.createServer();
const CLOSE_SIGNAL_STRING = '\r\n\r\n';

server.on('connection', socket => {
	let finalString = '';

	socket.on('data', data => {
		const stringifiedData = data.toString();

		finalString += stringifiedData;

		if (finalString.includes(CLOSE_SIGNAL_STRING)) {
			const splittedString = finalString.split(/\s/);
			const [verb, path] = splittedString;

			if (verb === 'GET') {
				switch (path) {
					case '/':
						socket.write(`Your path was / \r\n`);
						break;
					default:
						break;
				}

				socket.destroy();
			}
		}
	});
});

server.listen(8080, '127.0.0.1');
