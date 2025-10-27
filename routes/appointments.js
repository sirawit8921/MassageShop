const express = require('express');
const {protect, authorize } = require('../middleware/auth');
const {
  getAppointments,
  getAppointment,
  addAppointment,
  updateAppointment,
  deleteAppointment
} = require('../controllers/appointments');

const router = express.Router({ mergeParams: true });

router.route('/')
  .get(protect, authorize('admin', 'staff'), getAppointments)
  .post(protect, addAppointment);

router.route('/:id')
  .get(protect, getAppointment)
  .put(protect, authorize('admin'), updateAppointment)
  .delete(protect, authorize('admin'), deleteAppointment);


module.exports = router;
