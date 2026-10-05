const express = require("express");
const router = express.Router();
const authmiddleware = require("../../middleware/auth");
const rbacMiddleware = require("../../middleware/rbacMiddleware");
const doctorController = require("../../controller/admin/doctorController");
const patientController = require("../../controller/admin/patientController");
const AppointmentController = require("../../controller/admin/appointmentController");
const dashboardController = require("../../controller/admin/dashboardController");
const legalController = require("../../controller/admin/legalController");
const blogController = require("../../controller/admin/blogController");
const {upload, uploadOptional} = require("../../middleware/multer");

router.post("/add", authmiddleware, rbacMiddleware("admin"), upload.single("image"), doctorController.AddDoctor);
router.post("/getdoctors", authmiddleware, rbacMiddleware("admin"), doctorController.GetDoctors);
router.post("/delete", authmiddleware, rbacMiddleware("admin"), doctorController.DeleteDoctor);
router.post("/updatedoctor", authmiddleware, rbacMiddleware("admin"), upload.single("image"), doctorController.UpdateDoctor);

// Patient routes
router.post("/getpatients", authmiddleware, rbacMiddleware("admin"), patientController.GetAllPatients);
router.post("/deletepatient", authmiddleware, rbacMiddleware("admin"), patientController.DeletePatient);
router.post("/updatepatient", authmiddleware, rbacMiddleware("admin"), patientController.UpdatePatient);
router.post("/patient-details", authmiddleware, rbacMiddleware("admin"), patientController.GetPatientDetails);
router.post("/Appointments", authmiddleware, rbacMiddleware("admin"), AppointmentController.GetAppointments);
router.get("/dashboard-stats", authmiddleware, rbacMiddleware("admin"), dashboardController.GetDashboardStats);

// Legal routes (Privacy Policy & Terms & Conditions)
router.post("/privacy-policy/create", authmiddleware, rbacMiddleware("admin"), legalController.CreatePrivacyPolicy);
router.get("/privacy-policy", legalController.GetPrivacyPolicy);
router.put("/privacy-policy/update", authmiddleware, rbacMiddleware("admin"), legalController.UpdatePrivacyPolicy);
router.post("/terms-conditions/create", authmiddleware, rbacMiddleware("admin"), legalController.CreateTermsConditions);
router.get("/terms-conditions", legalController.GetTermsConditions);
router.put("/terms-conditions/update", authmiddleware, rbacMiddleware("admin"), legalController.UpdateTermsConditions);


// Blog routes
router.post("/blog/create", authmiddleware, rbacMiddleware("admin"), uploadOptional.single("image"), blogController.CreateBlog);
router.post("/blog/get-all", authmiddleware, rbacMiddleware("admin"), blogController.GetAllBlogs);
router.post("/blog/get-by-id", authmiddleware, rbacMiddleware("admin"), blogController.GetBlogById);
router.post("/blog/update", authmiddleware, rbacMiddleware("admin"), uploadOptional.single("image"), blogController.UpdateBlog);
router.post("/blog/delete", authmiddleware, rbacMiddleware("admin"), blogController.DeleteBlog);
router.post("/blog/get-authors", authmiddleware, rbacMiddleware("admin"), blogController.GetAuthors);    



module.exports = router;