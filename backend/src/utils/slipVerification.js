// backend/src/utils/slipVerification.js
// Verification must fail closed until a real bank/slip verification provider is configured.
const verifySlip = async () => ({
    isValid: false,
    isConfigured: false,
    message: 'ยังไม่ได้เชื่อมต่อผู้ให้บริการตรวจสอบสลิป จึงยังยืนยันการชำระเงินไม่ได้',
});

module.exports = {
    verifySlip
};
