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
  nepaliDate: {
    type: String, // Store Nepali date as string (e.g., "2081-07-25")
  },
  checkIn: {
    time: String, // Time in 12-hour format (e.g., "09:30:00 AM")
    timestamp: Date, // Full JavaScript Date object for calculations
    nepaliTime: String, // Nepali time string
    nepaliDate: String, // Nepali date string
    location: {
      lat: Number,
      lng: Number,
      distanceFromOffice: Number,
      withinRange: Boolean,
      timestamp: Date // Location capture time
    }
  },
  checkOut: {
    time: String, // Time in 12-hour format (e.g., "05:45:00 PM")
    timestamp: Date, // Full JavaScript Date object for calculations
    nepaliTime: String, // Nepali time string
    nepaliDate: String, // Nepali date string
    location: {
      lat: Number,
      lng: Number,
      distanceFromOffice: Number,
      withinRange: Boolean,
      timestamp: Date // Location capture time
    }
  },
  totalHours: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'late'],
    default: 'present'
  },
  workHours: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Compound index for efficient queries - one record per employee per day
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Additional indexes for common queries
AttendanceSchema.index({ date: -1 }); // For date-based queries
AttendanceSchema.index({ employeeId: 1, date: -1 }); // For employee history
AttendanceSchema.index({ status: 1, date: -1 }); // For status filtering

// Virtual field to check if employee is currently checked in
AttendanceSchema.virtual('isCheckedIn').get(function() {
  return this.checkIn && !this.checkOut;
});

// Virtual field to check if attendance is complete
AttendanceSchema.virtual('isComplete').get(function() {
  return this.checkIn && this.checkOut;
});

// Pre-save middleware to calculate total hours if checkOut is present
AttendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut && this.checkIn.timestamp && this.checkOut.timestamp) {
    const diffMs = new Date(this.checkOut.timestamp) - new Date(this.checkIn.timestamp);
    const hours = diffMs / (1000 * 60 * 60);
    this.totalHours = Math.round(hours * 100) / 100;
    this.workHours = this.totalHours;
    
    // Auto-set status based on hours worked
    if (this.totalHours < 4) {
      this.status = 'half-day';
    } else {
      this.status = 'present';
    }
  }
  next();
});

// Method to format attendance for display
AttendanceSchema.methods.toDisplayFormat = function() {
  return {
    _id: this._id,
    employee: this.employeeId,
    date: this.date,
    nepaliDate: this.nepaliDate,
    checkIn: this.checkIn ? {
      time: this.checkIn.time,
      nepaliTime: this.checkIn.nepaliTime,
      location: this.checkIn.location
    } : null,
    checkOut: this.checkOut ? {
      time: this.checkOut.time,
      nepaliTime: this.checkOut.nepaliTime,
      location: this.checkOut.location
    } : null,
    totalHours: this.totalHours,
    status: this.status,
    isCheckedIn: this.isCheckedIn,
    isComplete: this.isComplete
  };
};

// Static method to get today's attendance for an employee
AttendanceSchema.statics.getTodayAttendance = async function(employeeId, startOfDay, endOfDay) {
  return this.findOne({
    employeeId,
    date: {
      $gte: startOfDay,
      $lt: endOfDay
    }
  }).populate('employeeId');
};

// Static method to get attendance by date range
AttendanceSchema.statics.getAttendanceByDateRange = async function(employeeId, startDate, endDate) {
  return this.find({
    employeeId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 }).populate('employeeId');
};

// Ensure virtuals are included in JSON
AttendanceSchema.set('toJSON', { virtuals: true });
AttendanceSchema.set('toObject', { virtuals: true });

// Clean up existing model to prevent OverwriteModelError
delete mongoose.models.Attendance;

export default mongoose.model('Attendance', AttendanceSchema);