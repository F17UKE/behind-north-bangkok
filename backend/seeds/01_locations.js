/**
 * @param { import("knex").Knex } knex
 * @returns { Promise } 
 */

// npx knex seed:run --specific=01_locations.js

exports.seed = async function(knex) {
  // 1. ล้างข้อมูลเก่า (เพื่อป้องกันการ ID ซ้ำเวลาลบแล้วรันใหม่)
  // ต้องลบจากตารางลูก (customers) ก่อนตารางแม่เสมอ
  await knex('CUSTOMERS').del();
  await knex('DORMITORIES').del();
  await knex('SOIS').del();

  // 1. ซอย (Sois)
  await knex('SOIS').insert([
    { id: 1, name: 'ซอยวงศ์สว่าง 11 (หลังมอ)' },
    { id: 2, name: 'ซอยประชาราษฎร์ สาย 1' }
  ]);

  // 2. หอพัก (Dormitories)
  await knex('DORMITORIES').insert([
    { id: 1, name: 'หอพักนักศึกษาชาย 1', location: 'ใกล้ประตูหลังมอ', soi_id: 1 },
    { id: 2, name: 'หอพักนักศึกษาหญิง 2', location: 'กลางซอยวงศ์สว่าง 11', soi_id: 1 },
    { id: 3, name: 'คอนโด The Tree', location: 'ปากซอยประชาราษฎร์', soi_id: 2 }
  ]);
};