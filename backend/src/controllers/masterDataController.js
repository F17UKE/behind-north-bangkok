const repo = require('../repositories/masterDataRepository');

exports.getSois = async (req, res) => {
  try {
    const sois = await repo.getAllSois();
    res.status(200).json({ success: true, data: sois });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getDormitories = async (req, res) => {
  try {
    const { soi_id } = req.query; // รับ Query Parameter (ถ้ามี)
    const dormitories = await repo.getDormitories(soi_id);
    res.status(200).json({ success: true, data: dormitories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.calculateDeliveryFee = async (req, res) => {
  try {
    const { merchant_id } = req.params;
    const { dormitory_id } = req.query;

    if (!dormitory_id) {
      return res.status(400).json({ success: false, message: 'Query parameter dormitory_id is required' });
    }

    const fee = await repo.getDeliveryFeeByDormitory(merchant_id, dormitory_id);
    
    if (fee === null) {
      return res.status(404).json({ success: false, message: 'Dormitory not found' });
    }

    res.status(200).json({ 
      success: true, 
      data: { delivery_fee: fee } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};