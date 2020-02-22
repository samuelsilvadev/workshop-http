const net = require('net');
const path = require('path');
const fs = require('fs');

const buildHeaders = require('./buildHeaders');

const server = net.createServer();

const CLOSE_SIGNAL_STRING = '\r\n\r\n';
const LINE_BREAK = '\r\n';

const indexPath = path.join(__dirname, 'index.html');
const indexFile = fs.readFileSync(indexPath);

const requestsQueue = [];
let globalRequestId = 0;

const asyncRequest = callback => {
	const randomTime = Math.ceil(Math.random() * 5000);

	setTimeout(callback, randomTime);
};

const handleQueueRequest = httpVersion => {
	const currentId = globalRequestId++;

	asyncRequest(() => {
		console.log(`${currentId} is ready`);

		const request = requestsQueue.find(request => request.id === currentId);
		const response = `queue response to ${currentId}`;

		request.response = `${httpVersion}, 200, OK \r\n`;
		request.response += `content-type: text/html \r\n`;
		request.response += `body: ${response} \r\n`;
		request.response += `content-length: ${response.length} \r\n\r\n`;
	});

	requestsQueue.push({ id: currentId, response: null });
};

const checkIfSomeRequestIsReady = socket => {
	const intervalId = setInterval(() => {
		const firstRequest = requestsQueue[0];
		const isFirstRequestReady = firstRequest && !!firstRequest.response;

		if (isFirstRequestReady) {
			socket.write(firstRequest.response);
			requestsQueue.shift();
		}
	}, 0);

	return () => {
		clearInterval(intervalId);
	};
};

server.on('connection', socket => {
	let finalString = '';

	const unlistenRequestQueue = checkIfSomeRequestIsReady(socket);

	socket.on('data', data => {
		const stringifiedData = data.toString();

		finalString += stringifiedData;

		if (finalString.includes(CLOSE_SIGNAL_STRING)) {
			const requestLines = finalString.split(LINE_BREAK);
			const [requestData, ...requestHeaders] = requestLines;
			const headersObject = requestHeaders.reduce(buildHeaders, {});
			const [verb, path, httpVersion] = requestData.split(/\s/);

			if (verb === 'GET') {
				switch (path) {
					case '/':
						socket.write(`${httpVersion}, 200, OK \r\n`);
						socket.write('content-type: text/html \r\n');
						socket.write(`content-length: ${indexFile.length} \r\n\r\n`);
						socket.write(indexFile);
						break;
					case '/async': {
						handleQueueRequest(httpVersion);
						break;
					}
					default:
						socket.write(`${httpVersion}, 404, Not Found \r\n\r\n`);
						break;
				}
			} else {
				socket.write(`${httpVersion}, 405, Method Not Allowed \r\n\r\n`);
			}

			if (headersObject.connection === 'keep-alive') {
				finalString = '';

				return;
			}

			unlistenRequestQueue();
			socket.destroy();
		}
	});
});

server.listen(8080, '127.0.0.1');
