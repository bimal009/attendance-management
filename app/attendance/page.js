'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

export default function AttendancePage() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Get user's location
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;

      // Submit attendance
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          lat: latitude,
          lng: longitude
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Attendance marked successfully for ${data.employeeId.name}`);
        setPhone('');
      } else {
        setError(data.error || 'Failed to mark attendance');
      }
    } catch (error) {
      if (error.code === error.PERMISSION_DENIED) {
        setError('Location access is required to mark attendance');
      } else if (error.code === error.TIMEOUT) {
        setError('Location request timed out');
      } else {
        setError('Failed to get location: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Mark Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                required
                disabled={loading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Marking Attendance...' : 'Mark Attendance'}
            </Button>

            {message && (
              <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm">
                {message}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-100 text-red-800 rounded-md text-sm">
                {error}
              </div>
            )}

            <p className="text-xs text-gray-600 text-center">
              Note: Location access is required to verify you are within the office premises.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}