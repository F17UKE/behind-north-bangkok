const bcrypt = require('bcryptjs');

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

const comparePassword = async (password, hashedPassword) => {
    // สำหรับ Customer ที่ Login ด้วย Social (Google/LINE) รหัสผ่านอาจจะเป็น null
    if (!hashedPassword) return false;
    return await bcrypt.compare(password, hashedPassword);
};

module.exports = { hashPassword, comparePassword };