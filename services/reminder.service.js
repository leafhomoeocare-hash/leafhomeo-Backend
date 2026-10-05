const { Appointment, Patient, Doctor, Notification, User } = require('../models');
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
            <div style="background: linear-gradient(135deg, #64a281 0%, #145656 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Leaf Homeo Care</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
              <h2 style="color: #145656; margin-top: 0;">Appointment Reminder</h2>
              <p style="color: #374151; line-height: 1.6;">Dear ${patient.name},</p>
              <p style="color: #374151; line-height: 1.6;">Your appointment with <strong>Dr. ${doctor.name}</strong> is scheduled for tomorrow at <strong>${new Date(appointment.appointmentDateTime).toLocaleTimeString()}</strong>.</p>
              <p style="color: #374151; line-height: 1.6;">Please make sure to complete your payment before the consultation.</p>
              <div style="background: #64a281; color: white; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold;">🌿 Natural Healing, Personalized Care</p>
              </div>
              <p style="color: #6b7280; margin-bottom: 0;">Thank you,<br>Leaf Homeo Team</p>
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
            <div style="background: linear-gradient(135deg, #64a281 0%, #145656 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Leaf Homeo Care</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
              <h2 style="color: #145656; margin-top: 0;">Payment Reminder</h2>
              <p style="color: #374151; line-height: 1.6;">Dear ${patient.name},</p>
              <p style="color: #374151; line-height: 1.6;">Your appointment with <strong>Dr. ${doctor.name}</strong> is starting in 1 hour.</p>
              <p style="color: #374151; line-height: 1.6;">Please complete your payment before the consultation starts.</p>
              <div style="background: #145656; color: white; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold;">⚠️ Payment Required</p>
              </div>
              <p style="color: #6b7280; margin-bottom: 0;">Thank you,<br>Leaf Homeo Team</p>
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
 * Cancel pending appointments after 45 minutes
 */
const cancelPendingAppointments = async () => {
  try {
    console.log('Checking pending appointments for cancellation...');

    const now = new Date();

    // Get pending appointments that are past their time
    const appointments = await Appointment.findAll({
      where: {
        status: 'pending',
        appointmentDateTime: {
          [Op.lt]: now
        }
      }
    });

    console.log(`Found ${appointments.length} pending appointments past their time`);

    for (const appointment of appointments) {
      const appointmentTime = new Date(appointment.appointmentDateTime);
      const minutesPassed = (now - appointmentTime) / (1000 * 60);

      // Cancel after 45 minutes
      if (minutesPassed >= 45) {
        await Appointment.update(
          {
            status: 'cancelled',
            cancellationReason: 'timeout_pending'
          },
          { where: { id: appointment.id } }
        );

        console.log(`Cancelled pending appointment ${appointment.id} after ${Math.floor(minutesPassed)} minutes`);
      }
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
