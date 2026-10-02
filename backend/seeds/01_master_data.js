/**
 * @param { import("knex").Knex } knex
 * @returns { Promise } 
 */
exports.seed = async function(knex) {
  // 1. ล้างข้อมูลเก่า (เพื่อป้องกันการ ID ซ้ำเวลาลบแล้วรันใหม่)
  // ต้องลบจากตารางลูก (customers) ก่อนตารางแม่เสมอ
  await knex('customers').del();
  await knex('dormitories').del();
  await knex('sois').del();

  // 2. จำลองข้อมูลตารางซอย (sois)
  await knex('sois').insert([
    { id: 1, name: 'ซอยวงศ์สว่าง 11' },
    { id: 2, name: 'ซอยวงศ์สว่าง 19' }
  ]);

  // 3. จำลองข้อมูลหอพัก (dormitories)
  await knex('dormitories').insert([
    { id: 1, name: 'หอพัก A (ทดสอบ)', location: 'กลางซอย', soi_id: 1 },
    { id: 2, name: 'หอพัก B', location: 'ท้ายซอย', soi_id: 1 }
  ]);
};