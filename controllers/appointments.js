const Appointment = require("../models/Appointment");
const Hospital = require("../models/Hospital");

// @desc     Get all appointments
// @route    GET /api/v1/appointments
// @access   Private (ต้องมี protect ก่อน)
exports.getAppointments = async (req, res, next) => {
  let query;

  if (!req.user) {
    return res.status(401).json({ success: false, error: "Not authorized" });
  }

  if (req.user.role !== "admin") {
    // General users can see only their appointments
    query = Appointment.find({ user: req.user.id }).populate({
      path: "hospital",
      select: "name province tel",
    });
  } else {
    // Admin can see all appointments, or by hospital if param exists
    if (req.params.hospitalId) {
      query = Appointment.find({ hospital: req.params.hospitalId }).populate({
        path: "hospital",
        select: "name province tel",
      });
    } else {
      query = Appointment.find().populate({
        path: "hospital",
        select: "name province tel",
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
      message: "Cannot find Appointment",
    });
  }
};


// @desc    Get single appointment
// @route   GET /api/v1/appointments/:id
// @access  Private
exports.getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate({
      path: "hospital",
      select: "name province tel",
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: `No appointment found with the id of ${req.params.id}`,
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
// @route   POST /api/v1/hospitals/:hospitalId/appointments
// @access  Private
exports.addAppointment = async (req, res, next) => {
  try {
    // เพิ่ม hospitalId จาก params ลงใน body
    req.body.hospital = req.params.hospitalId;

    // เพิ่ม user id จาก token ลงใน body
    req.body.user = req.user.id;

    // ตรวจสอบว่ามี hospital มีจริงในฐานข้อมูลหรือเปล่า
    const hospital = await Hospital.findById(req.params.hospitalId);

    if (!hospital) {
      return res
        .status(404)
        .json({
          success: false,
          message: `No hospital found with the id of ${req.params.hospitalId}`,
        });
    }
    const existedAppointments = await Appointment.find({ user: req.user.id });
    if (existedAppointments.length >= 3 && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: `The user with ID ${req.user.id} has already made 3 appointments`
      });
    }

    // สร้าง appointment
    const appointment = await Appointment.create(req.body);
    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error(error);
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
    // หา appointment ก่อน
    let appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: `No appointment found with the id of ${req.params.id}`,
      });
    }
    if (appointment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this appointment`
      });
    }
    // อัปเดต appointment
    appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,          // คืนค่าที่อัปเดตแล้ว
      runValidators: true // ตรวจ validation ของ schema
    });

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
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
    // หา appointment ตาม id
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: `No appointment found with the id of ${req.params.id}`
      });
    }
    
    if (appointment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this appointment`
      });
    }

    // ลบ appointment
    await appointment.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Cannot delete Appointment"
    });
  }
};








