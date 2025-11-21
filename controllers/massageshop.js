const Appointment = require("../models/Appointment.js");
const MassageShop = require("../models/MassageShop.js");

// @desc    Get All Massage Shops
// @route   GET /api/v1/massageshops
// @access  Public
exports.getMassageShops = async (req, res, next) => {
  try {
    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ["select", "sort", "page", "limit"];
    removeFields.forEach((param) => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`
    );

    // Find and populate appointments
    let query = MassageShop.find(JSON.parse(queryStr)).populate("appointments");

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(",").join(" ");
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const total = await MassageShop.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const massageShops = await query;

    // Pagination result
    const pagination = {};
    if (endIndex < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json({
      success: true,
      count: massageShops.length,
      pagination,
      data: massageShops,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get Single Massage Shop
// @route   GET /api/v1/massageshops/:id
// @access  Public
exports.getMassageShop = async (req, res, next) => {
  try {
    const massageShop = await MassageShop.findById(req.params.id).populate(
      "appointments"
    );

    if (!massageShop) {
      return res.status(404).json({
        success: false,
        error: `No massage shop found with the ID of ${req.params.id}`,
      });
    }

    res.status(200).json({ success: true, data: massageShop });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Create new massage shop
// @route   POST /api/v1/massageshops
// @access  Private
// @desc    Create new massage shop
// @route   POST /api/v1/massageshops
// @access  Private
// @desc    Create new massage shop
// @route   POST /api/v1/massageshops
// @access  Private
exports.createMassageShop = async (req, res, next) => {
  try {
    req.body.user = req.user.id;

    const massageShop = await MassageShop.create(req.body);

    res.status(201).json({
      success: true,
      data: massageShop,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};


// @desc    Update Massage Shop
// @route   PUT /api/v1/massageshops/:id
// @access  Private (Admin or Owner)
exports.updateMassageShop = async (req, res, next) => {
  try {
    // ✅ รองรับทั้ง name และ shopName
    const shopName = req.body.shopName || req.body.name;
    const { address, telephone, openTime, closeTime } = req.body;

    // 🔍 ค้นหาร้านนวดจาก ID
    const massageShop = await MassageShop.findById(req.params.id);

    if (!massageShop) {
      return res.status(404).json({
        success: false,
        message: `No massage shop found with the ID of ${req.params.id}`,
      });
    }

    // 🔐 ตรวจสอบสิทธิ์
    if (!massageShop.user) {
      if (req.user.role === "admin") {
        console.log("⚙️ Admin overriding: massage shop has no owner.");
      } else {
        return res.status(400).json({
          success: false,
          message: "This massage shop has no owner assigned.",
        });
      }
    } else if (
      massageShop.user.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this massage shop",
      });
    }

    // 🧩 อัปเดตเฉพาะฟิลด์ที่ส่งมา
    if (shopName) massageShop.shopName = shopName; // ✅ เปลี่ยนตรงนี้
    if (address) massageShop.address = address;
    if (telephone) massageShop.telephone = telephone;
    if (openTime) massageShop.openTime = openTime;
    if (closeTime) massageShop.closeTime = closeTime;

    // 💾 บันทึกลงฐานข้อมูล
    await massageShop.save({ runValidators: true });

    res.status(200).json({
      success: true,
      data: massageShop,
    });
  } catch (error) {
    console.error("Error updating massage shop:", error.message);
    res.status(500).json({
      success: false,
      message: "Cannot update massage shop",
    });
  }
};




// @desc    Delete Massage Shop
// @route   DELETE /api/v1/massageshops/:id
// @access  Private
exports.deleteMassageShop = async (req, res, next) => {
  try {
    const massageShop = await MassageShop.findById(req.params.id);

    if (!massageShop) {
      return res.status(404).json({
        success: false,
        error: `No massage shop found with the ID of ${req.params.id}`,
      });
    }

    // ลบ appointments ทั้งหมดที่เกี่ยวข้องกับร้านนี้
    await Appointment.deleteMany({ massageShop: req.params.id });
    // ลบร้านนวดเอง
    await MassageShop.deleteOne({ _id: req.params.id });

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};
