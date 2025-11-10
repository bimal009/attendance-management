import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  time: String,
  location: {
    lat: Number,
    lng: Number,
    distanceFromOffice: Number,
    withinRange: Boolean
  }
});

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);