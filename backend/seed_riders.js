// backend/seed_riders.js
require('dotenv').config();

const db = require('./src/db');
const { hashPassword } = require('./src/utils/hash');

async function seedRiders() {
  console.log('🛵 Checking and seeding default riders...');

  const riderPw = await hashPassword('rider1234');

  const defaultRiders = [
    {
      id: 1,
      username: 'rider1',
      password_hash: riderPw,
      full_name: 'สมศักดิ์ ไรเดอร์ซิ่ง',
      phone: '089-111-2222',
      is_active: true,
      merchant_id: 1 // KIN RAI DEE
    },
    {
      id: 2,
      username: 'rider2',
      password_hash: riderPw,
      full_name: 'มานะ ส่งไว',
      phone: '089-333-4444',
      is_active: true,
      merchant_id: 2 // กินข้าวมั้ย
    },
    {
      id: 3,
      username: 'rider_jenny',
      password_hash: riderPw,
      full_name: 'สายฟ้า เดลิเวอรี่ (เชฟเจนนี่)',
      phone: '089-555-6666',
      is_active: true,
      merchant_id: 6 // ตามสั่ง by เชฟเจนนี่
    },
    {
      id: 4,
      username: 'rider',
      password_hash: riderPw,
      full_name: 'ไรเดอร์หลัง มจพ.',
      phone: '089-777-8888',
      is_active: true,
      merchant_id: 6 // ตามสั่ง by เชฟเจนนี่
    }
  ];

  for (const r of defaultRiders) {
    const found = await db('MERCHANT_RIDERS').where('id', r.id).orWhere('username', r.username).first();
    if (!found) {
      await db('MERCHANT_RIDERS').insert(r);
      console.log(`✅ Seeded rider: ${r.username} (${r.full_name})`);
    } else {
      await db('MERCHANT_RIDERS').where('id', found.id).update({
        password_hash: riderPw,
        is_active: true
      });
      console.log(`⚡ Updated password for existing rider: ${r.username}`);
    }
  }

  const all = await db('MERCHANT_RIDERS').select('id', 'username', 'full_name', 'merchant_id', 'is_active');
  console.log('Current riders in DB:', all);
  process.exit(0);
}

seedRiders().catch(err => {
  console.error('Seed riders error:', err);
  process.exit(1);
});
