// backend/src/utils/socialAuth.js
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const lineClientId = process.env.LINE_CLIENT_ID;
const googleClient = new OAuth2Client(googleClientId);

/**
 * ตรวจสอบความถูกต้องของ Google ID Token
 * @param {string} idToken - Token ที่ได้รับจาก Google Sign-In SDK บน Frontend
 * @returns {Promise<{ googleId: string, email: string, name: string, picture: string }>}
 */
const verifyGoogleToken = async (idToken) => {
    if (!idToken) {
        throw new Error('Google ID Token is required');
    }

    // รองรับ Mock Token สำหรับการทดสอบในโหมด Dev
    if (idToken.startsWith('mock_google_token_') || !googleClientId) {
        const mockSuffix = idToken.replace('mock_google_token_', '') || 'dev_user';
        return {
            googleId: `google_mock_id_${mockSuffix}`,
            email: `${mockSuffix}@gmail.com`,
            name: `Google User (${mockSuffix})`,
            picture: 'https://placehold.co/150'
        };
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: idToken,
            audience: googleClientId
        });

        const payload = ticket.getPayload();
        if (!payload) {
            throw new Error('Invalid Google token payload');
        }

        return {
            googleId: payload.sub,
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            picture: payload.picture || null
        };
    } catch (error) {
        console.error('Google token verification error:', error.message);
        throw new Error(`Google authentication failed: ${error.message}`);
    }
};

/**
 * ตรวจสอบความถูกต้องของ LINE Access Token หรือ ID Token
 * @param {string} accessToken - Access Token จาก LINE Login
 * @param {string} [idToken] - ID Token (กรณีขอ OpenID Email)
 * @returns {Promise<{ lineId: string, name: string, picture: string, email: string|null }>}
 */
const verifyLineToken = async (accessToken, idToken = null) => {
    if (!accessToken && !idToken) {
        throw new Error('LINE Access Token or ID Token is required');
    }

    // รองรับ Mock Token สำหรับการทดสอบ
    if (accessToken?.startsWith('mock_line_token_') || idToken?.startsWith('mock_line_token_')) {
        const mockSuffix = (accessToken || idToken).replace('mock_line_token_', '') || 'dev_line_user';
        return {
            lineId: `line_mock_id_${mockSuffix}`,
            name: `LINE User (${mockSuffix})`,
            picture: 'https://placehold.co/150',
            email: `${mockSuffix}@line.local`
        };
    }

    try {
        let lineId = null;
        let name = null;
        let picture = null;
        let email = null;

        // 1. ตรวจสอบ Profile ผ่าน Access Token
        if (accessToken) {
            const profileRes = await fetch('https://api.line.me/v2/profile', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!profileRes.ok) {
                const errorData = await profileRes.json().catch(() => ({}));
                throw new Error(errorData.message || 'Invalid LINE access token');
            }

            const profile = await profileRes.json();
            lineId = profile.userId;
            name = profile.displayName;
            picture = profile.pictureUrl || null;
        }

        // 2. ถ้ามี ID Token ให้ดึง Email เพิ่มเติม
        if (idToken && lineClientId) {
            const verifyRes = await fetch('https://api.line.me/oauth2/v2.1/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    id_token: idToken,
                    client_id: lineClientId
                })
            });

            if (verifyRes.ok) {
                const idTokenData = await verifyRes.json();
                if (!lineId) lineId = idTokenData.sub;
                if (!name) name = idTokenData.name;
                if (!picture) picture = idTokenData.picture;
                email = idTokenData.email || null;
            }
        }

        if (!lineId) {
            throw new Error('Could not retrieve LINE user ID');
        }

        return {
            lineId,
            name: name || 'LINE User',
            picture,
            email
        };

    } catch (error) {
        console.error('LINE token verification error:', error.message);
        throw new Error(`LINE authentication failed: ${error.message}`);
    }
};

module.exports = {
    verifyGoogleToken,
    verifyLineToken
};
