const buildHeaders = (finalHeaders, currentHeader) => {
	if (currentHeader) {
		const [header, value] = currentHeader.split(/: /);
		finalHeaders[header.toLowerCase()] = value;
	}

	return finalHeaders;
};

module.exports = buildHeaders;
