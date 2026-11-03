import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    scholarshipName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Submitted", "Under Review", "Correction Required", "Approved", "Rejected"],
      default: "Submitted",
    },
    correctionRemarks: {
      type: String,
      default: "",
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studentDetails: {
      rollNumber: { type: String, default: "" },
      department: { type: String, default: "" },
      year: { type: String, default: "" },
      category: { type: String, default: "OPEN" },
      annualIncome: { type: Number, default: 0 },
    },
    attachedDocuments: [
      {
        documentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Document",
        },
        title: { type: String, default: "" },
        fileName: { type: String, default: "" },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Application = mongoose.model("Application", applicationSchema);

export default Application;
