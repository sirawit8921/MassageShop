const Appointment = require("../models/Appointment");
const MassageShop = require("../models/MassageShop");

// @desc     Get all appointments
// @route    GET /api/v1/appointments
// @access   Private
exports.getAppointments = async (req, res, next) => {
  let query;

  if (!req.user) {
    return res.status(401).json({ success: false, error: "Not authorized" });
  }

  if (req.user.role !== "admin") {
    // ผู้ใช้ทั่วไปเห็นเฉพาะของตัวเอง
    query = Appointment.find({ user: req.user.id }).populate({
      path: "massageShop",
      select: "name address telephone",
    });
  } else {
    if (req.params.massageShopId) {
      query = Appointment.find({ massageShop: req.params.massageShopId }).populate({
        path: "massageShop",
        select: "name address telephone",
      });
    } else {
      query = Appointment.find().populate({
        path: "massageShop",
        select: "name address telephone",
      });
    }
  }

  try {
    const appointments = await query;
    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Cannot get appointments",
    });
  }
};

// @desc    Get single appointment
// @route   GET /api/v1/appointments/:id
// @access  Private
exports.getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate({
      path: "massageShop",
      select: "name address telephone",
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: `No appointment found with the ID of ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Cannot find appointment",
    });
  }
};

// @desc    Add appointment
// @route   POST /api/v1/appointments
// @access  Private
exports.addAppointment = async (req, res, next) => {
  try {
    const { massageShop, date } = req.body;

    // ตรวจสอบว่ามีการส่งชื่อร้านมาหรือไม่
    if (!massageShop) {
      return res.status(400).json({
        success: false,
        message: "Please provide massageShop name",
      });
    }

    const foundShop = await MassageShop.findOne({ shopName: massageShop });

    if (!foundShop) {
      return res.status(404).json({
        success: false,
        message: `No massage shop found with name "${massageShop}"`,
      });
    }

    // จำกัดจำนวนการจองสูงสุด 3 ครั้งต่อผู้ใช้ (ยกเว้น admin)
    const existingAppointments = await Appointment.find({ user: req.user.id });
    if (existingAppointments.length >= 3 && req.user.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: `User with ID ${req.user.id} has already made 3 appointments`,
      });
    }

    // สร้าง appointment ใหม่ (เก็บ id ของร้านเพื่อ populate ทีหลัง)
    const appointment = await Appointment.create({
      user: req.user.id,
      massageShop: foundShop._id,
      date,
    });

    res.status(201).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error("Error creating appointment:", error.message);
    return res.status(500).json({
      success: false,
      message: "Cannot create appointment",
    });
  }
};

// @desc    Update appointment
// @route   PUT /api/v1/appointments/:id
// @access  Private
exports.updateAppointment = async (req, res, next) => {
  try {
    const { massageShop, date, status } = req.body;

    // หา appointment ก่อน
    let appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: `No appointment found with the ID of ${req.params.id}`,
      });
    }

    // ตรวจสอบสิทธิ์: เจ้าของหรือ admin เท่านั้นที่แก้ได้
    if (
      appointment.user.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this appointment",
      });
    }

    // ถ้ามีชื่อร้าน ให้ตรวจสอบว่าร้านมีอยู่จริง
    let updatedShop = appointment.massageShop; // ค่าเดิม
    if (massageShop) {
      const foundShop = await MassageShop.findOne({ shopName: massageShop });
      if (!foundShop) {
        return res.status(404).json({
          success: false,
          message: `No massage shop found with name "${massageShop}"`,
        });
      }
      updatedShop = foundShop._id; // ✅ ใช้ id ของร้าน
    }

    // อัปเดตข้อมูลการจอง
    appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        massageShop: updatedShop,
        date: date || appointment.date,
        status: status || appointment.status,
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate({
      path: "massageShop",
      select: "shopName address telephone",
    });

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error("Error updating appointment:", error.message);
    res.status(500).json({
      success: false,
      message: "Cannot update appointment",
    });
  }
};

// @desc    Delete appointment
// @route   DELETE /api/v1/appointments/:id
// @access  Private
exports.deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: `No appointment found with the ID of ${req.params.id}`,
      });
    }

    // เช็คสิทธิ์ในการลบว่าเป็น admin มั้ย
    if (
      appointment.user.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this appointment`,
      });
    }

    // ลบ appointment
    await appointment.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Cannot delete appointment",
    });
  }
};
