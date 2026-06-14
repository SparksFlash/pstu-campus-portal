module.exports = function allowRoles(...roles) {
	// support passing an array or individual args
	const allowed = Array.isArray(roles[0]) ? roles[0] : roles;
	return (req, res, next) => {
		if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
		if (allowed.length > 0 && !allowed.includes(req.user.role)) {
			return res.status(403).json({ message: 'Forbidden: insufficient role' });
		}
		next();
	};
};

