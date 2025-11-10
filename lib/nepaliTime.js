import NepaliDate from 'nepali-datetime';

// Convert JavaScript Date to Nepali date string for display
export function toNepaliTime(jsDate, options = {}) {
  if (!jsDate) return 'N/A';
  
  try {
    const nepaliDate = new NepaliDate(jsDate);
    
    if (options.dateStyle && options.timeStyle) {
      return nepaliDate.format('YYYY-MM-DD hh:mm:ss A');
    } else if (options.dateStyle) {
      return nepaliDate.format('YYYY-MM-DD');
    } else if (options.timeStyle) {
      return nepaliDate.format('hh:mm:ss A');
    } else {
      return nepaliDate.format('YYYY-MM-DD hh:mm:ss A');
    }
  } catch (error) {
    console.error('Error converting to Nepali time:', error);
    return 'Invalid Date';
  }
}

// Get current Nepali date and time
export function getCurrentNepaliTime() {
  const now = new NepaliDate();
  return {
    date: now.format('YYYY-MM-DD'),
    time: now.format('hh:mm:ss A'),
    dateTime: now.format('YYYY-MM-DD hh:mm:ss A'),
    timestamp: now.toJsDate()
  };
}

// Check if two JavaScript dates are the same Nepali day
export function isSameNepaliDay(date1, date2) {
  const nepaliDate1 = new NepaliDate(date1).format('YYYY-MM-DD');
  const nepaliDate2 = new NepaliDate(date2).format('YYYY-MM-DD');
  return nepaliDate1 === nepaliDate2;
}