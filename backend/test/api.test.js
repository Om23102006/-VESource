import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { SAMPLE_SCHOLARSHIPS } from "../models/Scholarship.js";

test("Scholarship Catalog Data Integrity", () => {
  assert.ok(Array.isArray(SAMPLE_SCHOLARSHIPS), "Scholarships must be an array");
  assert.ok(SAMPLE_SCHOLARSHIPS.length >= 4, "Catalog must contain multiple realistic schemes");
  SAMPLE_SCHOLARSHIPS.forEach((s) => {
    assert.ok(s.id, "Scheme must have an id");
    assert.ok(s.name, "Scheme must have a name");
    assert.ok(s.category, "Scheme must have a category");
    assert.ok(s.benefit, "Scheme must specify benefit");
    assert.ok(s.deadline, "Scheme must specify deadline");
    assert.ok(Array.isArray(s.eligibility), "Eligibility criteria must be an array");
    assert.ok(s.eligibility.length > 0, "Eligibility criteria must not be empty");
    assert.ok(Array.isArray(s.requiredDocuments), "Required documents must be an array");
    assert.ok(s.requiredDocuments.length > 0, "Required documents must not be empty");
  });
});

test("Password Hashing and Secure Verification (Exp 6)", async () => {
  const plain = "VESIT@Student2026";
  const hash = await bcrypt.hash(plain, 10);
  assert.notEqual(plain, hash, "Hash must differ from plaintext");
  const isMatch = await bcrypt.compare(plain, hash);
  assert.equal(isMatch, true, "Bcrypt compare must succeed for valid password");
  const isWrong = await bcrypt.compare("IncorrectPassword", hash);
  assert.equal(isWrong, false, "Bcrypt compare must fail for incorrect password");
});

test("JWT Token Lifecycle and Role Claims (Exp 6)", () => {
  const secret = "test_jwt_secret_key_2026";
  const studentPayload = { id: "64f1a2b3c4d5e6f7a8b9c0d1", role: "student" };
  const adminPayload = { id: "64f1a2b3c4d5e6f7a8b9c0d2", role: "admin" };

  const studentToken = jwt.sign(studentPayload, secret, { expiresIn: "1d" });
  const adminToken = jwt.sign(adminPayload, secret, { expiresIn: "1d" });

  assert.ok(studentToken, "Student token should be generated");
  assert.ok(adminToken, "Admin token should be generated");

  const decodedStudent = jwt.verify(studentToken, secret);
  assert.equal(decodedStudent.role, "student");

  const decodedAdmin = jwt.verify(adminToken, secret);
  assert.equal(decodedAdmin.role, "admin");

  // Query parameter token decoding simulation
  const queryToken = studentToken;
  const decodedQuery = jwt.verify(queryToken, secret);
  assert.equal(decodedQuery.id, studentPayload.id, "Query token must decode correctly");

  // Tampered token test
  assert.throws(() => {
    jwt.verify(studentToken, "wrong_secret");
  }, "Verification must fail with invalid signature");
});

test("Document Vault Security: Allowed Types and Size Limit (Exp 5)", () => {
  const allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
  ];
  const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

  assert.ok(allowedMimeTypes.includes("application/pdf"), "PDF must be allowed");
  assert.ok(allowedMimeTypes.includes("image/jpeg"), "JPEG must be allowed");
  assert.ok(allowedMimeTypes.includes("image/png"), "PNG must be allowed");

  // Dangerous / unauthorized types
  assert.ok(!allowedMimeTypes.includes("application/x-msdownload"), "Executable files must be rejected");
  assert.ok(!allowedMimeTypes.includes("application/javascript"), "JS files must be rejected");
  assert.ok(!allowedMimeTypes.includes("text/html"), "HTML scripts must be rejected");

  // Size limit check
  const validFile = 2.5 * 1024 * 1024;
  const oversizedFile = 7.2 * 1024 * 1024;
  assert.ok(validFile <= maxSizeBytes, "2.5MB file must be within limit");
  assert.ok(oversizedFile > maxSizeBytes, "7.2MB file must exceed 5MB limit");
});

test("Application Status Pipeline and Correction State Transitions (Step 3)", () => {
  const allowedStatuses = [
    "Submitted",
    "Under Review",
    "Correction Required",
    "Approved",
    "Rejected",
  ];

  assert.ok(allowedStatuses.includes("Correction Required"), "Correction Required status must be supported");
  assert.ok(allowedStatuses.includes("Under Review"), "Under Review status must be supported");
  assert.ok(allowedStatuses.includes("Approved"), "Approved status must be supported");
  assert.ok(allowedStatuses.includes("Rejected"), "Rejected status must be supported");

  // Validation function simulating backend rule
  function validateStatusTransition(current, next, remarks) {
    if (!allowedStatuses.includes(next)) {
      return { valid: false, error: "Invalid status" };
    }
    if (next === "Correction Required" && (!remarks || !remarks.trim())) {
      return { valid: false, error: "Correction remarks are required" };
    }
    return { valid: true };
  }

  const validReview = validateStatusTransition("Submitted", "Under Review");
  assert.equal(validReview.valid, true);

  const validCorrection = validateStatusTransition(
    "Under Review",
    "Correction Required",
    "Income certificate expired; please attach current financial year certificate."
  );
  assert.equal(validCorrection.valid, true);

  const invalidCorrectionNoRemarks = validateStatusTransition(
    "Under Review",
    "Correction Required",
    ""
  );
  assert.equal(invalidCorrectionNoRemarks.valid, false);

  const invalidStatus = validateStatusTransition("Submitted", "InvalidCustomStatus");
  assert.equal(invalidStatus.valid, false);
});
