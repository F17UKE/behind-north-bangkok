const knex = require('../db');

const findCustomerByUsername = async (username) => {
    return await knex('CUSTOMERS').where({ username }).first();
};

const findCustomerByEmail = async (email) => {
    return await knex('CUSTOMERS').where({ email }).first();
};

const findCustomerBySocialId = async (provider, id) => {
    if (provider === 'google') return await knex('CUSTOMERS').where({ google_id: id }).first();
    if (provider === 'line') return await knex('CUSTOMERS').where({ line_id: id }).first();
    return null;
};

const createCustomer = async (customerData) => {
    const [newCustomer] = await knex('CUSTOMERS').insert(customerData).returning('*');
    return newCustomer;
};

const updateCustomer = async (id, data) => {
    const [updated] = await knex('CUSTOMERS').where({ id }).update(data).returning('*');
    return updated;
};

// ดึงข้อมูลลูกค้าพร้อมรายละเอียดหอพักและซอย
const findCustomerById = async (id) => {
    return await knex('CUSTOMERS')
        .leftJoin('DORMITORIES', 'CUSTOMERS.dormitory_id', 'DORMITORIES.id')
        .leftJoin('SOIS', 'DORMITORIES.soi_id', 'SOIS.id')
        .select(
            'CUSTOMERS.id',
            'CUSTOMERS.username',
            'CUSTOMERS.email',
            'CUSTOMERS.phone',
            'CUSTOMERS.room_number',
            'CUSTOMERS.profile_image_url',
            'CUSTOMERS.dormitory_id',
            'CUSTOMERS.google_id',
            'CUSTOMERS.line_id',
            'DORMITORIES.name as dormitory_name',
            'SOIS.id as soi_id',
            'SOIS.name as soi_name'
        )
        .where('CUSTOMERS.id', id)
        .first();
};

module.exports = { 
    findCustomerByUsername, 
    findCustomerByEmail, 
    findCustomerBySocialId, 
    createCustomer, 
    updateCustomer,
    findCustomerById 
};
