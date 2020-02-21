const net = require('net');

const buildHeaders = require('./buildHeaders');

const server = net.createServer();
const CLOSE_SIGNAL_STRING = '\r\n\r\n';

server.on('connection', socket => {
	let finalString = '';

	socket.on('data', data => {
		const stringifiedData = data.toString();

		finalString += stringifiedData;

		if (finalString.includes(CLOSE_SIGNAL_STRING)) {
			const splittedString = finalString.split(/\s/);
			const [verb, path, httpVersion] = splittedString;
			const headers = finalString.split('\r\n').slice(1);

			const headersObject = headers.reduce(buildHeaders, {});

			if (verb === 'GET') {
				switch (path) {
					case '/':
						socket.write(`${httpVersion}, 200, OK \r\n`);
						socket.write('content-Type: text/html \r\n');
						socket.write(`content-Length', ${finalString.length} \r\n`);
						socket.write(`Your path was / \r\n`);
						break;
					default:
						break;
				}

				if (headersObject.connection === 'keep-alive') {
					finalString = '';

					return;
				}

				socket.destroy();
			}
		}
	});
});

server.listen(8080, '127.0.0.1');
