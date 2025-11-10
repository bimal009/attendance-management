// models/Attendance.js
import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  checkIn: {
    time: String,
    location: {
      lat: Number,
      lng: Number,
      distanceFromOffice: Number,
      withinRange: Boolean
    }
  },
  checkOut: {
    time: String,
    location: {
      lat: Number,
      lng: Number,
      distanceFromOffice: Number,
      withinRange: Boolean
    }
  },
  totalHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day'],
    default: 'present'
  },
  workHours: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);