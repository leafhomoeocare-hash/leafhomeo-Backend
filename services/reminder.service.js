const { Appointment, Patient, Doctor, Notification, User ,Payment} = require('../models');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');
const admin = require('../config/firebase');

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

// IST helpers - server runs in UTC, all appointment times are IST wall-clock
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const nowIST = () => new Date(Date.now() + IST_OFFSET_MS); // shifted clock: UTC fields = IST wall time

// Returns [startUtc, endUtc] Date instants for an IST day `offsetDays` from today
const istDayBounds = (offsetDays) => {
  const n = nowIST();
  const startWallUtc = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + offsetDays);
  const startUtc = new Date(startWallUtc - IST_OFFSET_MS);
  return [startUtc, new Date(startUtc.getTime() + 24 * 60 * 60 * 1000 - 1)];
};

// Returns [startUtc, endUtc] for the IST clock-hour that is `hoursAhead` from now
const istHourBounds = (hoursAhead) => {
  const t = new Date(nowIST().getTime() + hoursAhead * 60 * 60 * 1000);
  const startWallUtc = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), t.getUTCHours());
  const startUtc = new Date(startWallUtc - IST_OFFSET_MS);
  return [startUtc, new Date(startUtc.getTime() + 60 * 60 * 1000 - 1)];
};

const formatISTTime = (date) =>
  new Date(date).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });

const formatISTDateTime = (date) =>
  new Date(date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/**
 * Check and send appointment reminders
 * - 24 hours before appointment time
 */
const sendAppointmentReminders = async () => {
  try {
    console.log('Checking appointment reminders...');

    const now = new Date();
    const [tomorrowStart, tomorrowEnd] = istDayBounds(1); // tomorrow in IST

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
      if (!appointment.patient || !appointment.doctor) {
        console.log(`Missing patient/doctor for appointment ${appointment.id}, skipping`);
        continue;
      }

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
              <p style="color: #374151; line-height: 1.6; font-size: 15px;">Your appointment with <strong style="color: #64a281;">Dr. ${doctor.name}</strong> is scheduled for tomorrow at <strong>${formatISTTime(appointment.appointmentDateTime)}</strong>.</p>
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
        message: `Your appointment with Dr. ${doctor.name} is scheduled for tomorrow at ${formatISTTime(appointment.appointmentDateTime)}`,
        type: 'appointment_reminder',
        referenceId: appointment.id,
        isRead: false
      });

      // FCM push notification
      if (patient.fcmToken) {
        try {
          await admin.messaging().send({
            token: patient.fcmToken,
            notification: {
              title: 'Appointment Tomorrow',
              body: `Your appointment with Dr. ${doctor.name} is tomorrow at ${formatISTTime(appointment.appointmentDateTime)}`,
            },
            data: {
              type: 'appointment_reminder',
              referenceId: String(appointment.id),
            },
          });
        } catch (pushErr) {
          console.error('FCM push error (appointment reminder):', pushErr.message);
        }
      }

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
    const [oneHourStart, oneHourEnd] = istHourBounds(1); // the IST clock-hour ~1h from now

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
      if (!appointment.patient || !appointment.doctor) {
        console.log(`Missing patient/doctor for appointment ${appointment.id}, skipping`);
        continue;
      }

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

      // FCM push notification
      if (patient.fcmToken) {
        try {
          await admin.messaging().send({
            token: patient.fcmToken,
            notification: {
              title: 'Payment Required',
              body: `Please complete payment for your appointment with Dr. ${doctor.name} starting in 1 hour`,
            },
            data: {
              type: 'payment_reminder',
              referenceId: String(appointment.id),
            },
          });
        } catch (pushErr) {
          console.error('FCM push error (payment reminder):', pushErr.message);
        }
      }

      console.log(`Payment reminder sent for appointment ${appointment.id}`);
    }

    console.log('Payment reminders check completed');
  } catch (error) {
    console.error('Error sending payment reminders:', error);
  }
};

/**
 * Cancel pending/accepted/paid appointments after 30 minutes of appointment time
 * - Cancels appointments with status 'pending', 'payment_pending', 'accepted', or 'paid' if 30 minutes have passed since appointment time
 * - Only 'completed' appointments are not cancelled
 */
const cancelPendingAppointments = async () => {
  try {
    console.log('Checking pending/accepted/paid appointments for cancellation...');

    const now = new Date();

    // Get pending, payment_pending, accepted, and paid appointments that are 30 minutes past their time
    const appointments = await Appointment.findAll({
      where: {
        status: {
          [Op.in]: ['pending', 'payment_pending', 'accepted', 'paid']
        },
        appointmentDateTime: {
          [Op.lt]: new Date(now.getTime() - 30 * 60 * 1000) // 30 minutes ago
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

    console.log(`Found ${appointments.length} appointments past their time with pending/accepted/paid status`);

    for (const appointment of appointments) {
      await Appointment.update(
        {
          status: 'cancelled'
        },
        { where: { id: appointment.id } }
      );

      // Send notification to patient
      if (appointment.patient) {
        const message = 'Your appointment has been automatically cancelled as 30 minutes have passed since the scheduled time.';

        // Skip notification creation (requires DB migration for senderId nullable)
        // await Notification.create({
        //   userId: appointment.patient.userId,
        //   senderId: null,
        //   title: 'Appointment Cancelled',
        //   message: message,
        //   type: 'appointment',
        //   referenceId: appointment.id,
        //   isRead: false
        // });

        // Get patient user details for email
        const patientUser = await User.findByPk(appointment.patient.userId);
        if (patientUser) {
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
                  <p style="color: #374151; line-height: 1.6; font-size: 15px;">Your appointment scheduled for <strong>${formatISTDateTime(appointment.appointmentDateTime)}</strong> has been automatically cancelled as 30 minutes have passed since the scheduled time.</p>
                  <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                    <p style="margin: 0; font-weight: bold; font-size: 16px;">⏰ 30-Minute Window Expired</p>
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
 * Call-time push reminders for paid appointments:
 * - ~10 minutes before: video call window opens
 * - At appointment time: consultation is starting now
 */
const sendCallReminders = async () => {
  try {
    const now = Date.now();
    const TEN_MIN = 10 * 60 * 1000;

    // Window 1: appointment starts in ~5-15 min (fires once thanks to dedupe)
    const upcoming = await Appointment.findAll({
      where: {
        appointmentDateTime: {
          [Op.gte]: new Date(now + 5 * 60 * 1000),
          [Op.lte]: new Date(now + 15 * 60 * 1000),
        },
        status: 'paid',
      },
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'userId'] },
        { model: Doctor, as: 'doctor', attributes: ['id', 'userId'] },
      ],
    });

    // Window 2: appointment started within last ~10 min
    const starting = await Appointment.findAll({
      where: {
        appointmentDateTime: {
          [Op.gte]: new Date(now - TEN_MIN),
          [Op.lte]: new Date(now),
        },
        status: 'paid',
      },
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'userId'] },
        { model: Doctor, as: 'doctor', attributes: ['id', 'userId'] },
      ],
    });

    const sendCallPush = async (appointment, patient, doctor, type, title, body) => {
      const existing = await Notification.findOne({
        where: { userId: patient.id, type, referenceId: appointment.id },
      });
      if (existing) return;

      await Notification.create({
        userId: patient.id,
        senderId: doctor?.id || null,
        title,
        message: body,
        type,
        referenceId: appointment.id,
        isRead: false,
      });

      if (patient.fcmToken) {
        try {
          await admin.messaging().send({
            token: patient.fcmToken,
            notification: { title, body },
            data: { type, referenceId: String(appointment.id) },
          });
        } catch (pushErr) {
          console.error(`FCM push error (${type}):`, pushErr.message);
        }
      }
    };

    for (const appointment of upcoming) {
      if (!appointment.patient) continue;
      const patient = await User.findByPk(appointment.patient.userId);
      const doctor = appointment.doctor ? await User.findByPk(appointment.doctor.userId) : null;
      if (!patient) continue;
      await sendCallPush(
        appointment, patient, doctor,
        'call_window_reminder',
        'Video Call Starting Soon',
        `Your video consultation with Dr. ${doctor?.name || 'your doctor'} starts at ${formatISTTime(appointment.appointmentDateTime)}. Join the call now!`
      );
    }

    for (const appointment of starting) {
      if (!appointment.patient) continue;
      const patient = await User.findByPk(appointment.patient.userId);
      const doctor = appointment.doctor ? await User.findByPk(appointment.doctor.userId) : null;
      if (!patient) continue;
      await sendCallPush(
        appointment, patient, doctor,
        'appointment_starting',
        'Your Appointment is Starting',
        `Your consultation with Dr. ${doctor?.name || 'your doctor'} is starting now. Please join the video call.`
      );
    }
  } catch (error) {
    console.error('Error sending call reminders:', error);
  }
};

/**
 * Run all reminder checks
 */
const runReminderChecks = async () => {
  console.log('Running reminder checks at:', new Date().toISOString());
  await sendAppointmentReminders();
  await sendPaymentReminders();
  await sendCallReminders();
  await cancelPendingAppointments();
  console.log('Reminder checks completed');
};

module.exports = {
  sendAppointmentReminders,
  sendPaymentReminders,
  sendCallReminders,
  cancelPendingAppointments,
  runReminderChecks
};
