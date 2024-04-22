const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema({

  otp: { type: String, required: true },
  emailId: { type: String, required: true },
  token : {type :String , default :null},
  createdAt: { type: Date, expires: "60", default: Date.now },
  
});


const Otp = mongoose.model("Otp", OtpSchema);

module.exports = Otp;