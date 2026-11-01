// backend/reset_and_seed.js
const db = require('./src/db');
const { hashPassword } = require('./src/utils/hash');

async function run() {
  console.log('🔄 เริ่มต้นล้างข้อมูลเดิมใน Database...');

  // 1. ลบข้อมูลตามลำดับ Foreign Keys
  await db('MESSAGES').del();
  await db('PAYMENT_SLIPS').del();
  await db('ORDER_ITEM_CHOICES').del();
  await db('ORDER_ITEMS').del();
  await db('ORDERS').del();
  await db('MENU_OPTION_CHOICES').del();
  await db('MENU_OPTION_GROUPS').del();
  await db('MENU_ITEMS').del();
  await db('DELIVERY_FEES').del();
  await db('MERCHANT_RIDERS').del();
  await db('CUSTOMERS').del();
  await db('MERCHANTS').del();
  await db('DORMITORIES').del();
  await db('SOIS').del();

  console.log('✅ ล้างข้อมูลทั้งหมดเรียบร้อยแล้ว');

  // 2. ข้อมูลซอย
  console.log('📍 กำลังเพิ่มข้อมูลซอย...');
  const sois = [
    { id: 1, name: 'ซอย 7' },
    { id: 2, name: 'ซอย 9' },
    { id: 3, name: 'ซอย 11' },
    { id: 4, name: 'ซอย 13' },
    { id: 5, name: 'ซอย 15' },
    { id: 6, name: 'ซอย 19' },
  ];
  await db('SOIS').insert(sois);

  const soiMap = {
    'ซอย 7': 1,
    'ซอย 9': 2,
    'ซอย 11': 3,
    'ซอย 13': 4,
    'ซอย 15': 5,
    'ซอย 19': 6,
  };

  // 3. ข้อมูลหอพัก
  console.log('🏢 กำลังเพิ่มข้อมูลหอพัก...');
  const dormsRaw = [
    ["S9 Residence","ซอย 11","https://maps.app.goo.gl/sLoiPPiShVnym9Ag9"],
    ["SP Apartment","ซอย 11","https://maps.app.goo.gl/TtuLud2b6bS7rUD58"],
    ["ST Place","ซอย 11","https://maps.app.goo.gl/b1AP4wLNGituVH7i9"],
    ["The Mira","ซอย 11","https://maps.app.goo.gl/EgPpPCjHfYEAJJ298"],
    ["Soul Dormitory","ซอย 11","https://maps.app.goo.gl/dBRiaqWH7eWEhS9t8"],
    ["Bless Salcha","ซอย 11","https://maps.app.goo.gl/p1f25EyaPC7SpMsBA"],
    ["B.T. Camp","ซอย 11","https://maps.app.goo.gl/iZxUtrmqyxPUDwSZ7"],
    ["View point","ซอย 11","https://maps.app.goo.gl/CbF14DUWifMJ5PuJ9"],
    ["The Mentor","ซอย 11","https://maps.app.goo.gl/5D5t4JDBbpLcb3PC7"],
    ["U Life Prime","ซอย 11","https://maps.app.goo.gl/jef7RQ7Z1gQydvzHA"],
    ["The Curve","ซอย 11","https://maps.app.goo.gl/nXWH59udAWnDCPeH7"],
    ["Kinhouse","ซอย 11","https://maps.app.goo.gl/JavYVecgfBAjjoLp9"],
    ["RS Mansion","ซอย 11","https://maps.app.goo.gl/7eydM1C225YLiLUS6"],
    ["หอพักคาซ่า (Casa)","ซอย 11","https://maps.app.goo.gl/okQT7pjfUcBc3bh2A"],
    ["The Garden Dormitory","ซอย 11","https://maps.app.goo.gl/NGVzorCk39ivam2i9"],
    ["The Charisma","ซอย 11","https://maps.app.goo.gl/UXKf6RWnpGGcEi929"],
    ["Grove residences","ซอย 11","https://maps.app.goo.gl/wtRqKjbvxV2w18f1A"],
    ["Time Mansion","ซอย 11","https://maps.app.goo.gl/oSort4HWupEuVbMb7"],
    ["เรือนไม้น้ำ","ซอย 11","https://maps.app.goo.gl/QXNCS7qvtsoDpiJR8"],
    ["หมู่บ้านสิรินปาร์ค 1","ซอย 11","https://maps.app.goo.gl/9sPAV6iUg7Sdv7SC7"],
    ["หมู่บ้านสิรินปาร์ค 2","ซอย 11","https://maps.app.goo.gl/QhLjfTFSpVcXEnYUA"],
    ["หอพักรุ่งนภา แมนชั่น","ซอย 11","https://maps.app.goo.gl/u5DmZV59nmsZuu3D6"],
    ["Bliss Salcha","ซอย 11","https://maps.app.goo.gl/DWbjJVM4VJofPtcb6"],
    ["หอพักสวนพุด","ซอย 11","https://maps.app.goo.gl/w9F3WU8VvnHGmF7Z7"],
    ["หอพักหญิงบ้านตั้งใจ","ซอย 11","https://maps.app.goo.gl/jXmzMekZPdTfG4zk8"],
    ["หอพักริมน้ำ","ซอย 11","https://maps.app.goo.gl/TR8cMonZaYNU85QU6"],
    ["Atom Place","ซอย 11","https://maps.app.goo.gl/EG4ZgWoRFjNxpAP3A"],
    ["The Riches NB","ซอย 9","https://maps.app.goo.gl/3gMqx5H7VJ3CQ8m5A"],
    ["PK Place Wongsawang Bangsue","ซอย 13","https://maps.app.goo.gl/MJDMnazgHWdnSG5D9"],
    ["หอพักอารีญา","ซอย 11","https://maps.app.goo.gl/SFCMSvZj82jQ9rcKA"],
    ["แอทไซน์","ซอย 11","https://maps.app.goo.gl/LVvTayH9F4yg2wDa9"],
    ["The K Family","ซอย 11","https://maps.app.goo.gl/ShhpF5TgGpWXCWvm7"],
    ["อินเตอร์แมนชั่น","ซอย 11","https://maps.app.goo.gl/DfFft8KZ9dakE3Yw7"],
    ["สมาร์ท เพลส","ซอย 11","https://maps.app.goo.gl/MxybxAApTcrYN6Cs8"],
    ["บ้านเอื้องฟ้า","ซอย 11","https://maps.app.goo.gl/P7o3SU6RDU5QsE2ZA"],
    ["หอพักสตรี บ้านสราญสุข","ซอย 11","https://maps.app.goo.gl/q9nGZ5d2wT5ZYB988"],
    ["หอพักหญิงปิ่นสุข","ซอย 11","https://maps.app.goo.gl/ptLWp1XX6Q8BssLeA"],
    ["หอพักหญิงกาญจน์","ซอย 11","https://maps.app.goo.gl/xb2sHr86UXre4svu5"],
    ["หอพักชายจินตนา","ซอย 11","https://maps.app.goo.gl/bRiP1XHt24pfDW4Y9"],
    ["หอพักหญิง A & K","ซอย 11","https://maps.app.goo.gl/bkMYAq72DuDYka2z9"],
    ["หอพักสตรีบัณฑิตา","ซอย 11","https://maps.app.goo.gl/zUgtKHBV4ScLPZm29"],
    ["หอพักหญิงศิริสุข","ซอย 11","https://maps.app.goo.gl/QjA9yuexRQ5EaCwR6"],
    ["หอพัก The North","ซอย 11","https://maps.app.goo.gl/L8y5p8XLqLJgUrmt6"],
    ["Grace Resident","ซอย 11","https://maps.app.goo.gl/D65noNuX8NQXpMqs6"],
    ["U Life Apartment","ซอย 19","https://maps.app.goo.gl/UZ1kyHhDd3JGnsru5"],
    ["หอพักอากาศ","ซอย 11","https://maps.app.goo.gl/2jQom5LomUKjbcd17"],
    ["สุนทรีย์ แมนชั่น","ซอย 11","https://maps.app.goo.gl/wHSYxjUpLBZzbMDo6"]
  ];

  const dorms = dormsRaw.map((d, index) => ({
    id: index + 1,
    name: d[0],
    soi_id: soiMap[d[1]] || 3,
    location: d[2]
  }));
  await db('DORMITORIES').insert(dorms);

  // 4. ข้อมูลร้านค้า (7 ร้าน)
  console.log('🏪 กำลังเพิ่มข้อมูลร้านค้า 7 ร้าน...');
  const merchantPw = await hashPassword('merchant1234');
  const customerPw = await hashPassword('password123');
  const merchantsData = [
    {
      id: 1,
      username: 'kinraidee',
      password_hash: merchantPw,
      store_name: 'KIN RAI DEE',
      promptpay_id: '0811111111',
      prefix: 'KRD',
      is_open: true,
      is_approved: true,
      location: 'หลังมอ มจพ. ซอย 11',
      store_image_url: null
    },
    {
      id: 2,
      username: 'kinkhaomai',
      password_hash: merchantPw,
      store_name: 'กินข้าวมั้ย',
      promptpay_id: '0822222222',
      prefix: 'KKM',
      is_open: true,
      is_approved: true,
      location: 'หลังมอ มจพ. ซอย 11',
      store_image_url: null
    },
    {
      id: 3,
      username: 'muangnon',
      password_hash: merchantPw,
      store_name: 'เมืองนนท์หมูกระทะ',
      promptpay_id: '0833333333',
      prefix: 'MNM',
      is_open: true,
      is_approved: true,
      location: 'ซอยวงศ์สว่าง 11',
      store_image_url: null
    },
    {
      id: 4,
      username: 'kruamaesri',
      password_hash: merchantPw,
      store_name: 'ครัวแม่ศรี หรอยแรง แกงใต้',
      promptpay_id: '0844444444',
      prefix: 'KMS',
      is_open: true,
      is_approved: true,
      location: 'หลังมอ มจพ.',
      store_image_url: null
    },
    {
      id: 5,
      username: 'yentafo',
      password_hash: merchantPw,
      store_name: 'ก๋วยเตี๋ยวลูกชิ้นปลาเย็นตาโฟ',
      promptpay_id: '0855555555',
      prefix: 'KTP',
      is_open: true,
      is_approved: true,
      location: 'หลังมอ มจพ.',
      store_image_url: null
    },
    {
      id: 6,
      username: 'chefjenny',
      password_hash: merchantPw,
      store_name: 'ตามสั่ง by เชฟเจนนี่',
      promptpay_id: '0866666666',
      prefix: 'CJN',
      is_open: true,
      is_approved: true,
      location: 'หลังมอ ซอย 11',
      store_image_url: null
    },
    {
      id: 7,
      username: 'meekaichik',
      password_hash: merchantPw,
      store_name: 'หมี่ไก่ฉีก by JK',
      promptpay_id: '0877777777',
      prefix: 'MJK',
      is_open: true,
      is_approved: true,
      location: 'หลังมอ ซอย 11',
      store_image_url: null
    }
  ];
  await db('MERCHANTS').insert(merchantsData);

  // 5. ค่าจัดส่งเริ่มต้นของร้านค้า (10 บาททุกซอย)
  console.log('🛵 กำลังเพิ่มค่าจัดส่งร้านค้า...');
  const deliveryFees = [];
  let feeId = 1;
  for (let m = 1; m <= 7; m++) {
    for (let s = 1; s <= 6; s++) {
      deliveryFees.push({
        id: feeId++,
        fee: 10.00,
        merchant_id: m,
        soi_id: s
      });
    }
  }
  await db('DELIVERY_FEES').insert(deliveryFees);

  // 6. ข้อมูลเมนูอาหาร (128 รายการ)
  console.log('🍲 กำลังเพิ่มเมนูอาหาร 128 รายการ...');
  const menuRaw = [
    // ก๋วยเตี๋ยวลูกชิ้นปลาเย็นตาโฟ (id: 5)
    ["จั๊บญวณหมูยอหมูเด้ง",60,"ก๋วยเตี๋ยวลูกชิ้นปลาเย็นตาโฟ"],
    ["ปลาเส้นโฟยำ",60,"ก๋วยเตี๋ยวลูกชิ้นปลาเย็นตาโฟ"],
    ["หมี่ขาวต้มยำปลารวมหมูสับใส่ไข่",60,"ก๋วยเตี๋ยวลูกชิ้นปลาเย็นตาโฟ"],
    ["ต้มยำหมูเด้งใส่ไข่",60,"ก๋วยเตี๋ยวลูกชิ้นปลาเย็นตาโฟ"],
    ["บะหมี่แห้งปลา",50,"ก๋วยเตี๋ยวลูกชิ้นปลาเย็นตาโฟ"],
    ["โฟยำหมูรวมไข่",60,"ก๋วยเตี๋ยวลูกชิ้นปลาเย็นตาโฟ"],
    ["ต้มยำหมูสับ",50,"ก๋วยเตี๋ยวลูกชิ้นปลาเย็นตาโฟ"],
    ["เส้นใหญ่เย็นตาโฟ",50,"ก๋วยเตี๋ยวลูกชิ้นปลาเย็นตาโฟ"],

    // เมืองนนท์หมูกระทะ (id: 3)
    ["หมูกระทะ ถ้วยไซส์ M",49,"เมืองนนท์หมูกระทะ"],
    ["หมูกระทะ ถ้วยไซส์ M หมูเกาหลี",55,"เมืองนนท์หมูกระทะ"],
    ["หมูกระทะ ถ้วยไซส์ M หมูหมาล่า",55,"เมืองนนท์หมูกระทะ"],
    ["หมูกระทะ ถ้วยไซส์ L",69,"เมืองนนท์หมูกระทะ"],
    ["หมูกระทะ ถ้วยไซส์ L หมูเกาหลี",79,"เมืองนนท์หมูกระทะ"],
    ["หมูกระทะ ถ้วยไซส์ L หมูหมาล่า",79,"เมืองนนท์หมูกระทะ"],
    ["หมูกระทะ ถ้วยไซส์ XL",129,"เมืองนนท์หมูกระทะ"],
    ["หมูกระทะ ถ้วยไซส์ XL หมูเกาหลี",139,"เมืองนนท์หมูกระทะ"],
    ["หมูกระทะ ถ้วยไซส์ XL หมูหมาล่า",139,"เมืองนนท์หมูกระทะ"],
    ["ข้าวเนยกระเทียม",69,"เมืองนนท์หมูกระทะ"],
    ["ข้าวเนยกระเทียมหมูเกาหลี",79,"เมืองนนท์หมูกระทะ"],
    ["ข้าวเนยกระเทียมหมูหมาล่า",79,"เมืองนนท์หมูกระทะ"],

    // ตามสั่ง by เชฟเจนนี่ (id: 6)
    ["ข้าวผัดอเมริกัน",60,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวผัดน้ำพริกกุ้ง",60,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวผัดน้ำพริกปลาทู",60,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวผัดเบคอน",60,"ตามสั่ง by เชฟเจนนี่"],
    ["มาม่าผัดขี้เมาไก่",50,"ตามสั่ง by เชฟเจนนี่"],
    ["ก๋วยเตี๋ยวคั่วไก่",50,"ตามสั่ง by เชฟเจนนี่"],
    ["ผัดซีอิ๊วไก่",50,"ตามสั่ง by เชฟเจนนี่"],
    ["เส้นหมี่ผัดกระเฉดไก่",50,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวราดกุ้งคั่วเกลือ",80,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวราดห่อหมกทะเล",80,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวราดปลาคั่วเกลือ",70,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวราดหมึกผัดไข่เค็ม",70,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวคะน้าเนื้อสับไข่เจียว",70,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวราดพะแนงไก่ตุ๋น",70,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวกะเพราเนื้อสับ",60,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวไก่กระเทียม",50,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวราดไก่ทอดซอสน้ำปลา",50,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวราดไก่ทอดผัดซอสเจนนี่",50,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวราดไก่ผัดเม็ดมะม่วง",60,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวราดปลากะพงผัดฉ่า",70,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวราดปลาผัดขึ้นฉ่าย",70,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวปลาพริกไทยดำ",70,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวราดกุ้งผัดพริกสด",80,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวแกงเขียวหวานเนื้อ",60,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวราดหอยลายผัดพริกเผา",60,"ตามสั่ง by เชฟเจนนี่"],
    ["ยำมาม่าไส้กรอก",60,"ตามสั่ง by เชฟเจนนี่"],
    ["กุ้งอบวุ้นเส้น",80,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวแกงเขียวหวานไก่ทอด",50,"ตามสั่ง by เชฟเจนนี่"],
    ["ออมเล็ต",45,"ตามสั่ง by เชฟเจนนี่"],
    ["ไข่กระทะ",45,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวไก่ตุ๋น",70,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวราดไก่รวนเค็ม",70,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวโดนัทกุ้งทอด",70,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวไข่ขยี้เบค่อน",60,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวไข่ขยี้กุ้ง",60,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวกุ้งกระเทียม",80,"ตามสั่ง by เชฟเจนนี่"],
    ["สปาเก็ตตี้ต้มยำทะเล",80,"ตามสั่ง by เชฟเจนนี่"],
    ["สปาเก็ตตี้คาโบนาร่าแฮมไส้กรอก",70,"ตามสั่ง by เชฟเจนนี่"],
    ["สปาเก็ตตี้ปลาทอด",70,"ตามสั่ง by เชฟเจนนี่"],
    ["สปาเก็ตตี้ผัดหอยลายพริกกระเทียม",70,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวไก่เกาหลี",60,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวยำไก่แซ่บ",60,"ตามสั่ง by เชฟเจนนี่"],
    ["ข้าวราดกระเฉดไก่กรอบ",50,"ตามสั่ง by เชฟเจนนี่"],

    // หมี่ไก่ฉีก by JK (id: 7)
    ["หมี่ไก่ฉีก",50,"หมี่ไก่ฉีก by JK"],
    ["หมี่ไก่ฉีกต้มยำ",60,"หมี่ไก่ฉีก by JK"],
    ["น้ำพริกกากหมูใหญ่",35,"หมี่ไก่ฉีก by JK"],

    // KIN RAI DEE (id: 1)
    ["ข้าวหน้าหมูเกาหลี",65,"KIN RAI DEE"],
    ["ข้าวหน้าหมูกิมจิ",65,"KIN RAI DEE"],
    ["ข้าวหน้าหมูสุกี้",65,"KIN RAI DEE"],
    ["ข้าวหน้าหมูญี่ปุ่น",65,"KIN RAI DEE"],
    ["ข้าวหน้าหมูโคชูจัง",65,"KIN RAI DEE"],
    ["ข้าวหน้าหมูเทอริยากิ",65,"KIN RAI DEE"],
    ["ข้าวหน้าหมูสไปรซี่",65,"KIN RAI DEE"],
    ["ข้าวหน้าหมูเตาถ่าน",65,"KIN RAI DEE"],
    ["ข้าวหน้าหมูสับญี่ปุ่นไข่เยิ้ม",65,"KIN RAI DEE"],
    ["ข้าวหน้าหมูหมาล่า",65,"KIN RAI DEE"],
    ["ข้าวหน้าหมูกรอบกิมจิ",65,"KIN RAI DEE"],
    ["ไก่กรอบหมาล่าทันมูจิ",65,"KIN RAI DEE"],
    ["ข้าวกรอบเห็ดทันมูจิ",65,"KIN RAI DEE"],
    ["ข้าวหน้าไก่กรอบหมาล่าขิงดอง",65,"KIN RAI DEE"],
    ["ข้าวหน้าไก่กรอบหมาล่า",65,"KIN RAI DEE"],
    ["ข้าวหน้าไก่กรอบกาลิค",65,"KIN RAI DEE"],
    ["ไก่กรอบยกเซต",70,"KIN RAI DEE"],
    ["ข้าวหน้าหมูซูชิ",70,"KIN RAI DEE"],
    ["ข้าวหน้าหมูสับพริกแกงใต้",65,"KIN RAI DEE"],
    ["ข้าวหน้าหมูสับคั่วกลิ้ง",65,"KIN RAI DEE"],
    ["ข้าวหน้ากะเพราเนื้อ",65,"KIN RAI DEE"],
    ["ข้าวหน้าเนื้อผัดพริกแกง",65,"KIN RAI DEE"],
    ["ข้าวหน้าหมูสับกระเทียม",65,"KIN RAI DEE"],
    ["ข้าวหน้าลาบหมูสับ",65,"KIN RAI DEE"],
    ["ข้าวยำปลากระป๋อง",65,"KIN RAI DEE"],
    ["ข้าวยำไก่กรอบ",65,"KIN RAI DEE"],
    ["ข้าวหน้าน้ำตกเนื้อมะนาว",65,"KIN RAI DEE"],
    ["ข้าวหน้าหมูผัดพริกหยวก",65,"KIN RAI DEE"],
    ["ข้าวหน้ากะเพราตับไก่โบราณ",65,"KIN RAI DEE"],
    ["ข้าวพริกแกงไก่กรอบ",65,"KIN RAI DEE"],
    ["ข้าวหน้าตับไก่กระเทียม",65,"KIN RAI DEE"],

    // กินข้าวมั้ย (id: 2)
    ["กะเพราหมูสับ",60,"กินข้าวมั้ย"],
    ["หมูกระเทียม",60,"กินข้าวมั้ย"],
    ["พริกแกงหมูสามชั้น",60,"กินข้าวมั้ย"],
    ["ข้าวผัดกุนเชียง",60,"กินข้าวมั้ย"],
    ["สามชั้นผัดกะปิ",60,"กินข้าวมั้ย"],
    ["ข้าวหมูหวาน",60,"กินข้าวมั้ย"],
    ["ไข่ขยี้ปลากระป๋อง",65,"กินข้าวมั้ย"],
    ["กะเพรามาม่าหมูสับ",65,"กินข้าวมั้ย"],
    ["พริกเกลือหมูกรอบ",70,"กินข้าวมั้ย"],
    ["คะน้าหมูกรอบ",70,"กินข้าวมั้ย"],
    ["ปลาหมึกผัดไข่เค็ม",70,"กินข้าวมั้ย"],
    ["ไข่ดาว",10,"กินข้าวมั้ย"],
    ["ไข่เจียว",10,"กินข้าวมั้ย"],
    ["ไข่ข้น",10,"กินข้าวมั้ย"],
    ["กุนเชียง",12,"กินข้าวมั้ย"],
    ["ไข่เยี่ยวม้า",12,"กินข้าวมั้ย"],
    ["ข้าวหมูกระจกไข่ดาว",65,"กินข้าวมั้ย"],
    ["ข้าวหมูเค็ม",60,"กินข้าวมั้ย"],
    ["ฉู่ฉี่หมูสามชั้น",60,"กินข้าวมั้ย"],
    ["ไข่ข้นห่อหมกทะเล",70,"กินข้าวมั้ย"],
    ["ข้าวหมูผัดสุกี้",60,"กินข้าวมั้ย"],
    ["สุกี้แห้งหมู",65,"กินข้าวมั้ย"],
    ["ผัดผักบุ้งหมูกรอบ",70,"กินข้าวมั้ย"],

    // ครัวแม่ศรี หรอยแรง แกงใต้ (id: 4)
    ["ข้าวหมกไก่ต้ม/ไก่ย่าง/ไก่กรอบ",60,"ครัวแม่ศรี หรอยแรง แกงใต้"],
    ["ข้าวกุ้งผัดกะปิสะตอ",70,"ครัวแม่ศรี หรอยแรง แกงใต้"],
    ["ข้าวกุ้งผัดพริกแกงใต้สะตอ",70,"ครัวแม่ศรี หรอยแรง แกงใต้"],
    ["ผัดวุ้นเส้นชะอมกุ้ง",70,"ครัวแม่ศรี หรอยแรง แกงใต้"],
    ["ราดหน้าหมูเส้นใหญ่",60,"ครัวแม่ศรี หรอยแรง แกงใต้"],
    ["ผัดหมี่ฮกเกี้ยนหมู",60,"ครัวแม่ศรี หรอยแรง แกงใต้"],
    ["ผัดหมี่ฮกเกี้ยนทะเล",70,"ครัวแม่ศรี หรอยแรง แกงใต้"],
    ["เส้นใหญ่ผัดซีอิ๊วหมู",60,"ครัวแม่ศรี หรอยแรง แกงใต้"],
    ["เส้นใหญ่ผัดซีอิ๊วทะเล",70,"ครัวแม่ศรี หรอยแรง แกงใต้"],
    ["ก๋วยเตี๋ยวคั่วหมู",60,"ครัวแม่ศรี หรอยแรง แกงใต้"],
    ["ก๋วยเตี๋ยวคั่วทะเล",70,"ครัวแม่ศรี หรอยแรง แกงใต้"],
    ["สุกี้น้ำ/แห้ง หมู",60,"ครัวแม่ศรี หรอยแรง แกงใต้"],
    ["สุกี้น้ำ/แห้ง ทะเล",70,"ครัวแม่ศรี หรอยแรง แกงใต้"],
    ["ขนมจีนแกงเขียวหวานไก่/ไก่ย่าง/ไก่ย่าง/ไก่กรอบ",60,"ครัวแม่ศรี หรอยแรง แกงใต้"],
    ["ข้าวไก่ย่าง/ไก่กรอบ ซอสเขียวหวาน",60,"ครัวแม่ศรี หรอยแรง แกงใต้"],
    ["ข้าวไก่ย่าง/ไก่กรอบ ซอสพะแนง",60,"ครัวแม่ศรี หรอยแรง แกงใต้"],
    ["ข้าวคลุกกะปิ",60,"ครัวแม่ศรี หรอยแรง แกงใต้"],
    ["เฟรนฟราย",39,"ครัวแม่ศรี หรอยแรง แกงใต้"],
    ["เฟรนฟราย 2 กล่อง",69,"ครัวแม่ศรี หรอยแรง แกงใต้"],
    ["ไก่ป๊อบ",29,"ครัวแม่ศรี หรอยแรง แกงใต้"],
    ["ไก่ป๊อบ + เฟรนฟราย",59,"ครัวแม่ศรี หรอยแรง แกงใต้"],
  ];

  const storeMap = {
    'KIN RAI DEE': 1,
    'กินข้าวมั้ย': 2,
    'เมืองนนท์หมูกระทะ': 3,
    'ครัวแม่ศรี หรอยแรง แกงใต้': 4,
    'ก๋วยเตี๋ยวลูกชิ้นปลาเย็นตาโฟ': 5,
    'ตามสั่ง by เชฟเจนนี่': 6,
    'หมี่ไก่ฉีก by JK': 7
  };

  const menuItems = menuRaw.map((item, index) => ({
    id: index + 1,
    name: item[0],
    description: `${item[0]} ปรุงสดใหม่จาก ${item[2]}`,
    price: Number(item[1]),
    is_available: true,
    image_url: '/menu-krapao.webp',
    merchant_id: storeMap[item[2]] || 1
  }));

  // แบ่ง insert เป็น batch
  const chunkSize = 40;
  for (let i = 0; i < menuItems.length; i += chunkSize) {
    await db('MENU_ITEMS').insert(menuItems.slice(i, i + chunkSize));
  }

  // 7. ผู้ใช้งานเริ่มต้น (Customer)
  console.log('👤 กำลังเพิ่มผู้ใช้ทดสอบ...');
  await db('CUSTOMERS').insert([
    {
      id: 1,
      username: 'student',
      email: 'student@kmutnb.ac.th',
      password_hash: customerPw,
      phone: '0812345678',
      room_number: '101',
      dormitory_id: 1
    }
  ]);

  // 8. ไรเดอร์เริ่มต้น (Riders)
  console.log('🛵 กำลังเพิ่มไรเดอร์ทดสอบ...');
  const riderPw = await hashPassword('rider1234');
  await db('MERCHANT_RIDERS').insert([
    { id: 1, username: 'rider1', password_hash: riderPw, full_name: 'สมศักดิ์ ไรเดอร์ซิ่ง', phone: '089-111-2222', is_active: true, merchant_id: 1 },
    { id: 2, username: 'rider2', password_hash: riderPw, full_name: 'มานะ ส่งไว', phone: '089-333-4444', is_active: true, merchant_id: 2 },
    { id: 3, username: 'rider_jenny', password_hash: riderPw, full_name: 'สายฟ้า เดลิเวอรี่ (เชฟเจนนี่)', phone: '089-555-6666', is_active: true, merchant_id: 6 },
    { id: 4, username: 'rider', password_hash: riderPw, full_name: 'ไรเดอร์หลัง มจพ.', phone: '089-777-8888', is_active: true, merchant_id: 6 }
  ]);

  // 9. คำสั่งซื้อเริ่มต้นในระบบ (Real Orders in DB)
  console.log('📦 กำลังเพิ่มออเดอร์จริงในฐานข้อมูล...');
  const seedTemplates = [
    { status: 'PENDING_ACCEPT', room: '302', dormId: 1, note: 'ไม่ใส่ผักชี ไม่หวาน', minsAgo: 2 },
    { status: 'PAID', room: '415', dormId: 2, note: 'ขอช้อนส้อมด้วยครับ', minsAgo: 5 },
    { status: 'PREPARING', room: '208', dormId: 3, note: 'เผ็ดน้อย แยกน้ำ', minsAgo: 8 },
    { status: 'READY_FOR_DELIVERY', room: '512', dormId: 4, note: 'วางไว้โต๊ะหน้าหอ', minsAgo: 12 }
  ];

  for (const m of merchantsData) {
    const storeMenus = menuItems.filter(mi => mi.merchant_id === m.id);
    if (!storeMenus || storeMenus.length === 0) continue;

    let orderNum = 0;
    for (const tpl of seedTemplates) {
      orderNum++;
      const customCode = `${m.prefix}-${String(orderNum).padStart(4, '0')}`;
      const selectedItem = storeMenus[(orderNum - 1) % storeMenus.length];
      const deliveryFee = 10.00;
      const totalAmount = parseFloat(selectedItem.price) + deliveryFee;

      const [order] = await db('ORDERS').insert({
        order_code: customCode,
        merchant_order_number: orderNum,
        customer_id: 1,
        merchant_id: m.id,
        delivery_dormitory_id: tpl.dormId,
        delivery_room_number: `ห้อง ${tpl.room} (หอพัก #${tpl.dormId})`,
        delivery_fee: deliveryFee,
        total_amount: totalAmount,
        status: tpl.status,
        customer_last_read_message_id: 0,
        merchant_last_read_message_id: 0,
        created_at: new Date(Date.now() - (tpl.minsAgo * 60 * 1000))
      }).returning('*');

      await db('ORDER_ITEMS').insert({
        order_id: order.id,
        menu_item_id: selectedItem.id,
        quantity: 1,
        unit_price: selectedItem.price,
        note: tpl.note,
        is_completed: ['READY_FOR_DELIVERY', 'IN_DELIVERY', 'COMPLETED'].includes(tpl.status)
      });
    }

    await db('MERCHANTS').where('id', m.id).update({ last_order_number: orderNum });
  }

  console.log('🎉 Reset and Seed เสร็จสมบูรณ์!');
  console.log(`- ซอย: ${sois.length}`);
  console.log(`- หอพัก: ${dorms.length}`);
  console.log(`- ร้านค้า: ${merchantsData.length}`);
  console.log(`- เมนูอาหาร: ${menuItems.length}`);
  console.log(`- ออเดอร์จริงในระบบ: ${merchantsData.length * 4}`);
  process.exit(0);
}

run().catch(err => {
  console.error('💥 Error seeding database:', err);
  process.exit(1);
});
