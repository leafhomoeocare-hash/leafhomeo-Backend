const { Appointment, Patient, Doctor, Notification, User, Payment } = require('../models');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@leafhomeo.com',
      to,
      subject,
      html
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

/**
 * Check and send appointment reminders
 * - 24 hours before appointment time
 */
const sendAppointmentReminders = async () => {
  try {
    console.log('Checking appointment reminders...');

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0));
    const tomorrowEnd = new Date(tomorrow.setHours(23, 59, 59, 999));

    // Find appointments scheduled for tomorrow
    const appointments = await Appointment.findAll({
      where: {
        appointmentDateTime: {
          [Op.between]: [tomorrowStart, tomorrowEnd]
        },
        status: 'accepted'
      },
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'userId']
        },
        {
          model: Doctor,
          as: 'doctor',
          attributes: ['id', 'userId']
        }
      ]
    });

    console.log(`Found ${appointments.length} appointments for tomorrow`);

    for (const appointment of appointments) {
      // Get patient and doctor user details
      const patient = await User.findByPk(appointment.patient.userId);
      const doctor = await User.findByPk(appointment.doctor.userId);

      if (!patient || !doctor) {
        console.log(`Missing user data for appointment ${appointment.id}`);
        continue;
      }

      // Check if reminder already sent
      const existingReminder = await Notification.findOne({
        where: {
          userId: patient.id,
          type: 'appointment_reminder',
          referenceId: appointment.id
        }
      });

      if (existingReminder) {
        console.log(`Reminder already sent for appointment ${appointment.id}`);
        continue;
      }

      // Send email to patient
      await sendEmail({
        to: patient.email,
        subject: 'Appointment Reminder - Leaf Homeo',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #64a281 0%, #145656 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <img src="https://your-domain.com/Leaf-LOGO-Kit/PNG/App%20icon/final%20leaf%20logo_App%20icon.png" alt="Leaf Homeo Care Logo" style="width: 80px; height: 80px; margin-bottom: 15px; border-radius: 16px; background: white; padding: 10px;" />
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Leaf Homeo Care</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Natural Healing, Personalized Care</p>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
              <h2 style="color: #145656; margin-top: 0; font-size: 22px; font-weight: bold;">Appointment Reminder</h2>
              <p style="color: #374151; line-height: 1.6; font-size: 15px;">Dear ${patient.name},</p>
              <p style="color: #374151; line-height: 1.6; font-size: 15px;">Your appointment with <strong style="color: #64a281;">Dr. ${doctor.name}</strong> is scheduled for tomorrow at <strong>${new Date(appointment.appointmentDateTime).toLocaleTimeString()}</strong>.</p>
              <p style="color: #374151; line-height: 1.6; font-size: 15px;">Please make sure to complete your payment before the consultation.</p>
              <div style="background: linear-gradient(135deg, #64a281 0%, #528f6e 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                <p style="margin: 0; font-weight: bold; font-size: 16px;">🌿 Natural Healing, Personalized Care</p>
              </div>
              <p style="color: #6b7280; margin-bottom: 0; font-size: 14px;">Thank you,<br><strong style="color: #145656;">Leaf Homeo Team</strong></p>
            </div>
          </div>
        `
      });

      // Create notification
      await Notification.create({
        userId: patient.id,
        senderId: doctor.id, // Doctor as sender
        title: 'Appointment Tomorrow',
        message: `Your appointment with Dr. ${doctor.name} is scheduled for tomorrow at ${new Date(appointment.appointmentDateTime).toLocaleTimeString()}`,
        type: 'appointment_reminder',
        referenceId: appointment.id,
        isRead: false
      });

      console.log(`Appointment reminder sent for appointment ${appointment.id}`);
    }

    console.log('Appointment reminders check completed');
  } catch (error) {
    console.error('Error sending appointment reminders:', error);
  }
};

/**
 * Check and send payment reminders
 * - 1 hour before appointment time (if unpaid)
 */
const sendPaymentReminders = async () => {
  try {
    console.log('Checking payment reminders...');

    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const oneHourStart = new Date(oneHourLater.setMinutes(0, 0, 0));
    const oneHourEnd = new Date(oneHourLater.setMinutes(59, 59, 999));

    // Find appointments in 1 hour that are unpaid
    const appointments = await Appointment.findAll({
      where: {
        appointmentDateTime: {
          [Op.between]: [oneHourStart, oneHourEnd]
        },
        status: {
          [Op.in]: ['accepted', 'payment_pending']
        }
      },
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'userId']
        },
        {
          model: Doctor,
          as: 'doctor',
          attributes: ['id', 'userId']
        }
      ]
    });

    console.log(`Found ${appointments.length} unpaid appointments in 1 hour`);

    for (const appointment of appointments) {
      // Get patient and doctor user details
      const patient = await User.findByPk(appointment.patient.userId);
      const doctor = await User.findByPk(appointment.doctor.userId);

      if (!patient || !doctor) {
        console.log(`Missing user data for appointment ${appointment.id}`);
        continue;
      }

      // Check if reminder already sent
      const existingReminder = await Notification.findOne({
        where: {
          userId: patient.id,
          type: 'payment_reminder',
          referenceId: appointment.id
        }
      });

      if (existingReminder) {
        console.log(`Payment reminder already sent for appointment ${appointment.id}`);
        continue;
      }

      // Send email to patient
      await sendEmail({
        to: patient.email,
        subject: 'Payment Reminder - Leaf Homeo',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #64a281 0%, #145656 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <img src="https://your-domain.com/Leaf-LOGO-Kit/PNG/App%20icon/final%20leaf%20logo_App%20icon.png" alt="Leaf Homeo Care Logo" style="width: 80px; height: 80px; margin-bottom: 15px; border-radius: 16px; background: white; padding: 10px;" />
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Leaf Homeo Care</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Natural Healing, Personalized Care</p>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
              <h2 style="color: #145656; margin-top: 0; font-size: 22px; font-weight: bold;">Payment Reminder</h2>
              <p style="color: #374151; line-height: 1.6; font-size: 15px;">Dear ${patient.name},</p>
              <p style="color: #374151; line-height: 1.6; font-size: 15px;">Your appointment with <strong style="color: #64a281;">Dr. ${doctor.name}</strong> is starting in 1 hour.</p>
              <p style="color: #374151; line-height: 1.6; font-size: 15px;">Please complete your payment before the consultation starts.</p>
              <div style="background: linear-gradient(135deg, #145656 0%, #0f4444 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                <p style="margin: 0; font-weight: bold; font-size: 16px;">⚠️ Payment Required</p>
              </div>
              <p style="color: #6b7280; margin-bottom: 0; font-size: 14px;">Thank you,<br><strong style="color: #145656;">Leaf Homeo Team</strong></p>
            </div>
          </div>
        `
      });

      // Create notification
      await Notification.create({
        userId: patient.id,
        senderId: doctor.id, // Doctor as sender
        title: 'Payment Required',
        message: `Please complete payment for your appointment with Dr. ${doctor.name} starting in 1 hour`,
        type: 'payment_reminder',
        referenceId: appointment.id,
        isRead: false
      });

      console.log(`Payment reminder sent for appointment ${appointment.id}`);
    }

    console.log('Payment reminders check completed');
  } catch (error) {
    console.error('Error sending payment reminders:', error);
  }
};

/**
 * Cancel pending/accepted appointments immediately when time has passed
 * - Cancels appointments with status 'pending', 'payment_pending', or 'accepted' if appointment time has passed
 * - For 'accepted' status, only cancel if payment is not completed
 */
const cancelPendingAppointments = async () => {
  try {
    console.log('Checking pending/accepted appointments for cancellation...');

    const now = new Date();

    // Get pending, payment_pending, and accepted appointments that are past their time
    const appointments = await Appointment.findAll({
      where: {
        status: {
          [Op.in]: ['pending', 'payment_pending', 'accepted']
        },
        appointmentDateTime: {
          [Op.lt]: now
        }
      },
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'userId']
        },
        {
          model: Payment,
          as: 'payment',
          required: false // Include even if no payment exists
        }
      ]
    });

    console.log(`Found ${appointments.length} appointments past their time with pending/accepted status`);

    for (const appointment of appointments) {
      // For accepted appointments, check if payment is completed
      if (appointment.status === 'accepted') {
        const hasPaidPayment = appointment.payment && appointment.payment.status === 'paid';
        if (hasPaidPayment) {
          console.log(`Skipping appointment ${appointment.id} - Payment already completed`);
          continue; // Don't cancel if payment is done
        }
      }

      const cancellationReason = appointment.status === 'payment_pending' ? 'timeout_paid' :
                                 appointment.status === 'accepted' ? 'timeout_pending' : 'timeout_pending';

      await Appointment.update(
        {
          status: 'cancelled',
          cancellationReason: cancellationReason
        },
        { where: { id: appointment.id } }
      );

      // Send notification to patient
      if (appointment.patient) {
        let message;
        if (appointment.status === 'payment_pending') {
          message = 'Your appointment has been automatically cancelled as the scheduled time has passed and payment was not completed.';
        } else if (appointment.status === 'accepted') {
          message = 'Your appointment has been automatically cancelled as the scheduled time has passed and payment was not completed.';
        } else {
          message = 'Your appointment has been automatically cancelled as the scheduled time has passed and it was not accepted.';
        }

        await Notification.create({
          userId: appointment.patient.userId,
          senderId: null,
          title: 'Appointment Cancelled',
          message: message,
          type: 'appointment',
          referenceId: appointment.id,
          isRead: false
        });

        // Get patient user details for email
        const patientUser = await User.findByPk(appointment.patient.userId);
        if (patientUser) {
          let reasonText;
          if (appointment.status === 'payment_pending') {
            reasonText = 'Payment was not completed before the scheduled time';
          } else if (appointment.status === 'accepted') {
            reasonText = 'Payment was not completed before the scheduled time';
          } else {
            reasonText = 'Appointment was not accepted before the scheduled time';
          }

          await sendEmail({
            to: patientUser.email,
            subject: 'Appointment Cancelled - Leaf Homeo',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #64a281 0%, #145656 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                  <img src="https://your-domain.com/Leaf-LOGO-Kit/PNG/App%20icon/final%20leaf%20logo_App%20icon.png" alt="Leaf Homeo Care Logo" style="width: 80px; height: 80px; margin-bottom: 15px; border-radius: 16px; background: white; padding: 10px;" />
                  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Leaf Homeo Care</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Natural Healing, Personalized Care</p>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
                  <h2 style="color: #145656; margin-top: 0; font-size: 22px; font-weight: bold;">Appointment Cancelled</h2>
                  <p style="color: #374151; line-height: 1.6; font-size: 15px;">Dear ${patientUser.name},</p>
                  <p style="color: #374151; line-height: 1.6; font-size: 15px;">Your appointment scheduled for <strong>${new Date(appointment.appointmentDateTime).toLocaleString()}</strong> has been automatically cancelled.</p>
                  <p style="color: #374151; line-height: 1.6; font-size: 15px;">Reason: ${reasonText}.</p>
                  <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                    <p style="margin: 0; font-weight: bold; font-size: 16px;">⏰ Time Expired</p>
                  </div>
                  <p style="color: #6b7280; margin-bottom: 0; font-size: 14px;">Please book a new appointment at your convenience.<br><strong style="color: #145656;">Leaf Homeo Team</strong></p>
                </div>
              </div>
            `
          });
        }
      }

      console.log(`Cancelled appointment ${appointment.id} - Status was: ${appointment.status}`);
    }

    console.log('Pending appointment cancellation check completed');
  } catch (error) {
    console.error('Error canceling pending appointments:', error);
  }
};

/**
 * Run all reminder checks
 */
const runReminderChecks = async () => {
  console.log('Running reminder checks at:', new Date().toISOString());
  await sendAppointmentReminders();
  await sendPaymentReminders();
  await cancelPendingAppointments();
  console.log('Reminder checks completed');
};

module.exports = {
  sendAppointmentReminders,
  sendPaymentReminders,
  cancelPendingAppointments,
  runReminderChecks
};
