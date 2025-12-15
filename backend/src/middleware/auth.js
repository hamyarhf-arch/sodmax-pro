const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                error: 'دسترسی غیرمجاز. لطفاً وارد شوید.' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.isAdmin = decoded.isAdmin;
        
        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        res.status(401).json({ 
            error: 'توکن نامعتبر یا منقضی شده' 
        });
    }
};

exports.isAdmin = (req, res, next) => {
    if (!req.isAdmin) {
        return res.status(403).json({ 
            error: 'دسترسی ممنوع. فقط مدیران مجاز هستند.' 
        });
    }
    next();
};
