const net = require('net');
const path = require('path');
const fs = require('fs');

const buildHeaders = require('./buildHeaders');

const server = net.createServer();
const CLOSE_SIGNAL_STRING = '\r\n\r\n';
const LINE_BREAK = '\r\n';

const indexPath = path.join(__dirname, 'index.html');
const indexFile = fs.readFileSync(indexPath);

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

			if (verb === 'GET') {
				switch (path) {
					case '/':
						socket.write(`${httpVersion}, 200, OK \r\n`);
						socket.write('content-type: text/html \r\n');
						socket.write(`content-length: ${indexFile.length} \r\n\r\n`);
						socket.write(indexFile);
						break;
					case '/favicon':
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
