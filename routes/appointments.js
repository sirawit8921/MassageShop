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
  .get(protect, getAppointments)
  .post(protect, authorize, addAppointment);

router.route('/:id')
  .get(protect, getAppointment)
  .put(protect, authorize, updateAppointment)
  .delete(protect, authorize, deleteAppointment);

module.exports = router;
