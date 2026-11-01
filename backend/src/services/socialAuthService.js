// backend/src/services/socialAuthService.js
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
require('dotenv').config();

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(googleClientId);

const lineClientId = process.env.LINE_CLIENT_ID;

/**
 * ตรวจสอบความถูกต้องของ Google ID Token
 * @param {string} token - Google ID Token หรือ JWT ที่ได้จากหน้าบ้าน
 * @returns {Promise<{ socialId: string, email: string, name: string, picture: string }>}
 */
const verifyGoogleToken = async (token) => {
    if (!token) {
        throw new Error('Google token is required');
    }

    // รองรับ Mock token สำหรับการทดสอบ Development
    if (token.startsWith('mock-google-')) {
        const mockSuffix = token.replace('mock-google-', '');
        return {
            socialId: 'google_' + mockSuffix,
            email: `mock_${mockSuffix}@gmail.com`,
            name: `Mock Google User ${mockSuffix}`,
            picture: 'https://placehold.co/150'
        };
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: googleClientId
        });

        const payload = ticket.getPayload();
        if (!payload) {
            throw new Error('Invalid Google token payload');
        }

        return {
            socialId: payload.sub,
            email: payload.email,
            name: payload.name || payload.given_name || 'Google User',
            picture: payload.picture
        };
    } catch (error) {
        console.error('Google token verification error:', error.message);
        throw new Error('Failed to verify Google token: ' + error.message);
    }
};

/**
 * ตรวจสอบความถูกต้องของ LINE Token (รองรับทั้ง Access Token และ ID Token)
 * @param {string} token - LINE Access Token หรือ ID Token
 * @returns {Promise<{ socialId: string, email: string|null, name: string, picture: string|null }>}
 */
const verifyLineToken = async (token) => {
    if (!token) {
        throw new Error('LINE token is required');
    }

    // รองรับ Mock token สำหรับการทดสอบ Development
    if (token.startsWith('mock-line-')) {
        const mockSuffix = token.replace('mock-line-', '');
        return {
            socialId: 'line_' + mockSuffix,
            email: `mock_${mockSuffix}@line.local`,
            name: `Mock Line User ${mockSuffix}`,
            picture: 'https://placehold.co/150'
        };
    }

    try {
        // กรณีเป็น ID Token (JWT มีเครื่องหมายจุด 2 จุด)
        if (token.split('.').length === 3) {
            const params = new URLSearchParams();
            params.append('id_token', token);
            if (lineClientId) {
                params.append('client_id', lineClientId);
            }

            const response = await axios.post('https://api.line.me/oauth2/v2.1/verify', params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            return {
                socialId: response.data.sub,
                email: response.data.email || null,
                name: response.data.name || 'LINE User',
                picture: response.data.picture || null
            };
        }

        // กรณีเป็น Access Token ปกติ เรียก Profile API
        const profileResponse = await axios.get('https://api.line.me/v2/profile', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        return {
            socialId: profileResponse.data.userId,
            email: null, // Access Token ทั่วไปของ LINE จะไม่ได้ Email ยกเว้นขอสิทธิ์เพิ่มเติม
            name: profileResponse.data.displayName || 'LINE User',
            picture: profileResponse.data.pictureUrl || null
        };
    } catch (error) {
        console.error('LINE token verification error:', error.response?.data || error.message);
        throw new Error('Failed to verify LINE token');
    }
};

module.exports = {
    verifyGoogleToken,
    verifyLineToken
};
