const Subject = require("../models/Subject");

exports.createSubject = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ message: "Name and code are required." });
    }

    const existing = await Subject.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: "Subject code already exists" });
    }

    const subject = new Subject({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      department: req.body.department || ""
    });

    await subject.save();
    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSubjects = async (req, res) => {
  const subjects = await Subject.find().sort({ name: 1 });
  res.json(subjects);
};

exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }
    res.json({ message: "Subject deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.assignFaculty = async (req, res) => {
  const { subjectId, facultyIds, classNames } = req.body;
  try {
    if (!facultyIds || !Array.isArray(facultyIds) || facultyIds.length === 0) {
      return res.status(400).json({ message: "facultyIds are required" });
    }

    const subjectIds = Array.isArray(subjectId) ? subjectId : [subjectId];
    if (!subjectIds[0]) {
      return res.status(400).json({ message: "subjectId is required" });
    }

    const update = { $addToSet: { faculty: { $each: facultyIds } } };
    if (Array.isArray(classNames) && classNames.length > 0) {
      update.$addToSet.classNames = { $each: classNames.map((c) => c.trim().toUpperCase()) };
    }

    await Subject.updateMany(
      { _id: { $in: subjectIds } },
      update,
      { runValidators: true }
    );

    const updatedSubjects = await Subject.find({ _id: { $in: subjectIds } });
    res.json(updatedSubjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFacultyClasses = async (req, res) => {
  try {
    const facultyId = req.user.id;
    const subjects = await Subject.find({ faculty: facultyId }).select("name code classNames");

    const classMap = new Map();
    subjects.forEach((subject) => {
      (subject.classNames || []).forEach((className) => {
        if (!classMap.has(className)) {
          classMap.set(className, []);
        }
        classMap.get(className).push({
          subjectId: subject._id,
          subjectName: subject.name,
          subjectCode: subject.code
        });
      });
    });

    const classes = Array.from(classMap.keys()).sort();
    res.json({
      classes,
      byClass: Object.fromEntries(classMap)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
