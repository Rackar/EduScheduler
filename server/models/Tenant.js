const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "trial"],
      default: "trial",
    },
    subscription: {
      plan: {
        type: String,
        enum: ["basic", "professional", "enterprise"],
        default: "basic",
      },
      startDate: Date,
      endDate: Date,
    },
    settings: {
      maxUsers: {
        type: Number,
        default: 100,
      },
      maxSchools: {
        type: Number,
        default: 1,
      },
      features: {
        multipleSchools: {
          type: Boolean,
          default: false,
        },
        advancedReports: {
          type: Boolean,
          default: false,
        },
        api: {
          type: Boolean,
          default: false,
        },
      },
    },
    contact: {
      name: String,
      email: {
        type: String,
        required: true,
      },
      phone: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Tenant", tenantSchema);
