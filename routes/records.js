const router = require("express").Router();
const pool = require("../db");

const STATUSES = ["Pending", "In progress", "Completed"];

// Check the record information
function validateRecord(body) {
  const { title, category, description, status } = body || {};

  if (
    typeof title !== "string" ||
    typeof category !== "string" ||
    typeof description !== "string" ||
    typeof status !== "string"
  ) {
    return { error: "All four fields must be text." };
  }

  const clean = {
    title: title.trim(),
    category: category.trim(),
    description: description.trim(),
    status: status.trim(),
  };

  if (clean.title.length < 3 || clean.title.length > 80) {
    return { error: "Title must have 3 to 80 characters." };
  }
  if (clean.category.length < 2 || clean.category.length > 40) {
    return { error: "Category must have 2 to 40 characters." };
  }
  if (clean.description.length < 5 || clean.description.length > 300) {
    return { error: "Description must have 5 to 300 characters." };
  }
  if (!STATUSES.includes(clean.status)) {
    return { error: "Status must be Pending, In progress or Completed." };
  }

  return { clean };
}

// Check the ID
function validId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// GET all records
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM records ORDER BY id");
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not get records." });
  }
});

// GET one record
router.get("/:id", async (req, res) => {
  const id = validId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid ID." });

  try {
    const result = await pool.query("SELECT * FROM records WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Record not found." });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not get the record." });
  }
});

// POST a new record
router.post("/", async (req, res) => {
  const { error, clean } = validateRecord(req.body);
  if (error) return res.status(400).json({ message: error });

  try {
    const result = await pool.query(
      `INSERT INTO records (title, category, description, status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [clean.title, clean.category, clean.description, clean.status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not create the record." });
  }
});

// PUT (update) a record
router.put("/:id", async (req, res) => {
  const id = validId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid ID." });

  const { error, clean } = validateRecord(req.body);
  if (error) return res.status(400).json({ message: error });

  try {
    const result = await pool.query(
      `UPDATE records
       SET title = $1, category = $2, description = $3, status = $4
       WHERE id = $5 RETURNING *`,
      [clean.title, clean.category, clean.description, clean.status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Record not found." });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not update the record." });
  }
});

// DELETE a record
router.delete("/:id", async (req, res) => {
  const id = validId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid ID." });

  try {
    const result = await pool.query(
      "DELETE FROM records WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Record not found." });
    }
    res.status(200).json({ message: "Record deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not delete the record." });
  }
});

module.exports = router;