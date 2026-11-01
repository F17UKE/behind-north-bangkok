const checkRole = (allowedRoles) => {
    // รองรับทั้ง string เดี่ยว เช่น checkRole('MERCHANT')
    // และ array เช่น checkRole(['MERCHANT', 'ADMIN'])
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    return (req, res, next) => {
        // ต้องมั่นใจว่าผ่าน verifyToken มาแล้วจึงจะมี req.user
        if (!req.user || !rolesArray.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};

module.exports = checkRole;
