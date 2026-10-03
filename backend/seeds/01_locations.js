/**
 * @param { import("knex").Knex } knex
 * @returns { Promise } 
 */

// npx knex seed:run --specific=01_locations.js

exports.seed = async function(knex) {
  // 1. ล้างข้อมูลเก่า (เพื่อป้องกันการ ID ซ้ำเวลาลบแล้วรันใหม่)
  // ต้องลบจากตารางลูก (customers) ก่อนตารางแม่เสมอ
  await knex('customers').del();
  await knex('dormitories').del();
  await knex('sois').del();

  // 1. ซอย (Sois)
  await knex('sois').insert([
    { id: 1, name: 'ซอยวงศ์สว่าง 11 (หลังมอ)' },
    { id: 2, name: 'ซอยประชาราษฎร์ สาย 1' }
  ]);

  // 2. หอพัก (Dormitories)
  await knex('dormitories').insert([
    { id: 1, name: 'หอพักนักศึกษาชาย 1', location: 'ใกล้ประตูหลังมอ', soi_id: 1 },
    { id: 2, name: 'หอพักนักศึกษาหญิง 2', location: 'กลางซอยวงศ์สว่าง 11', soi_id: 1 },
    { id: 3, name: 'คอนโด The Tree', location: 'ปากซอยประชาราษฎร์', soi_id: 2 }
  ]);
};