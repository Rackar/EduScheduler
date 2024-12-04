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

// 添加 toJSON 转换
tenantSchema.set("toJSON", {
  transform: function (doc, ret, options) {
    // 转换 _id
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;

    // 处理日期
    if (ret.subscription) {
      if (ret.subscription.startDate) {
        ret.subscription.startDate = ret.subscription.startDate.toISOString();
      }
      if (ret.subscription.endDate) {
        ret.subscription.endDate = ret.subscription.endDate.toISOString();
      }
    }

    return ret;
  },
});

module.exports = mongoose.model("Tenant", tenantSchema);
