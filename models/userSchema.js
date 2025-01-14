const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: false,
  },
  googleId: {
    type: String,
    sparse: true,
  },
  profileImage: {
    type: {
      url: {
        type: String, 
        default: '' 
      },
      publicId: {
        type: String, 
        default: ''
      }
    },
    default: {}
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  addresses: [
    {
      type: { type: String },
      name: { type: String },
      phone: { type: Number },
      pincode: { type: Number },
      state: { type: String },
      address: { type: String },
      city: { type: String },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);
module.exports = User;