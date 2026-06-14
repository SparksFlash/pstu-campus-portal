// Simple validation helpers
exports.requireFields = (...fields) => (req, res, next) => {
	const missing = fields.filter(f => {
		const v = req.body[f];
		return v === undefined || v === null || v === '';
	});
	if (missing.length) {
		return res.status(400).json({ message: 'Missing required fields', missing });
	}
	next();
};

exports.optionalFields = (...fields) => (req, res, next) => {
	// no-op placeholder for future complex validation
	next();
};

