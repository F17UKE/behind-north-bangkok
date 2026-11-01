const DEFAULT_PROMPTPAY_ID = '0986706625';

exports.up = async function (knex) {
  await knex('MERCHANTS').update({ promptpay_id: DEFAULT_PROMPTPAY_ID });
};

exports.down = async function () {
  // Previous merchant PromptPay IDs are not recoverable from this migration.
};
