const express = require("express");
const {
  requireAuth,
  requireRole,
} = require("../middleware/authMiddleware");

const advisor = require("../controllers/advisorController");

const router = express.Router();

router.use(requireAuth, requireRole("advisor"));

router.get("/courses", advisor.getCourses);

router.get("/offerings", advisor.getOfferings);
router.post("/offerings", advisor.createOffering);
router.patch("/offerings/:id", advisor.updateOffering);
router.delete("/offerings/:id", advisor.deleteOffering);

router.get("/students", advisor.getStudents);

router.get(
  "/students/:studentId/records",
  advisor.getStudentRecords
);

router.get(
  "/students/:studentId/registrations",
  advisor.getStudentRegistrations
);

router.get(
  "/students/:studentId/eligible-courses",
  advisor.getEligibleCourses
);

router.post("/registrations", advisor.registerStudent);

router.delete(
  "/registrations/:id",
  advisor.removeRegistration
);

router.patch("/add-drop", advisor.setAddDrop);

module.exports = router;
