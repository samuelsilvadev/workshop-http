const net = require('net');

const buildHeaders = require('./buildHeaders');

const server = net.createServer();
const CLOSE_SIGNAL_STRING = '\r\n\r\n';
const LINE_BREAK = '\r\n';

server.on('connection', socket => {
	let finalString = '';

	socket.on('data', data => {
		const stringifiedData = data.toString();

		finalString += stringifiedData;

		if (finalString.includes(CLOSE_SIGNAL_STRING)) {
			const requestLines = finalString.split(LINE_BREAK);
			const [requestData, ...requestHeaders] = requestLines;
			const [verb, path, httpVersion] = requestData.split(/\s/);

			const headersObject = requestHeaders.reduce(buildHeaders, {});
			const response = `Your path was / \r\n`;

			if (verb === 'GET') {
				switch (path) {
					case '/':
						socket.write(`${httpVersion}, 200, OK \r\n`);
						socket.write('content-type: text/html \r\n');
						socket.write(`content-length: ${response.length} \r\n\r\n`);
						socket.write(response);
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
