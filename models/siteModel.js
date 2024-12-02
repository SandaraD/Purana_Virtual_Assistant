const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const siteSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String, 
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number], 
        required: true,
      },
    },
    description: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      required: true,
    },
  },
  { timestamps: true }
);


siteSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Site", siteSchema);
