const express = require('express');
const {
  getAppointments,
  getAppointment,
  addAppointment,
  updateAppointment,
  deleteAppointment
} = require('../controllers/appointments');

const {protect, authorize } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.route('/')
  .get(protect, authorize('admin', 'staff'), getAppointments)
  .post(protect, authorize('admin'), addAppointment);

router.route('/:id')
  .get(protect, authorize('admin', 'staff'), getAppointment)
  .put(protect, authorize('admin'), updateAppointment)
  .delete(protect, authorize('admin'), deleteAppointment);


module.exports = router;
