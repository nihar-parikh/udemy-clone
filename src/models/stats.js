import mongoose from "mongoose";
const { Schema } = mongoose;

const statsSchema = new Schema(
  {
    users: {
      type: Number,
      default: 0,
    },
    subscriptions: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Stats = mongoose.model("Stats", statsSchema);

export default Stats;
