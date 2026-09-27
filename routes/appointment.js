var express = require('express');
var router = express.Router();
const appointmentController = require('../controller/appointment.controller');
const patientController = require('../controller/patient.controller');
const authMiddleware = require('../middleware/auth');
const { upload } = require('../middleware/multer');

router.post('/get-slot',authMiddleware,appointmentController.AvailabilitySlots)
router.post('/book-appointment', authMiddleware, appointmentController.AppointmentBooking);
router.get('/upcoming-appointments', authMiddleware, appointmentController.UpcomingAppointments);
router.get('/my-appointments', authMiddleware, appointmentController.myAppointments);
router.post('/cancel-appointment', authMiddleware, appointmentController.CancelAppointment);
router.post('/get-video-token', authMiddleware, appointmentController.GetVideoToken);
router.post('/end-video-call', authMiddleware, appointmentController.EndVideoCall);
router.post('/appointment-details',authMiddleware, appointmentController.AppointmentDetails)
router.post('/review',authMiddleware,appointmentController.Review)
router.post('/submit-consultation', upload.array('screenshots', 5), authMiddleware, appointmentController.SubmitConsultation)
router.get('/consultation/:consultationId', authMiddleware, appointmentController.getConsultationById)
router.get('/consultation/by-appointment/:appointmentId', authMiddleware, appointmentController.getConsultationByAppointmentId)
router.put('/update-shipping-status/:appointmentId', authMiddleware, appointmentController.updateShippingStatus)
module.exports = router;
