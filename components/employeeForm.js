'use client';
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

export function EmployeeForm({ employee, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    phone: employee?.phone || '',
    department: employee?.department || '',
    role: employee?.role || '',
    email: employee?.email || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="department">Department</Label>
        <Input
          id="department"
          name="department"
          value={formData.department}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="role">Role</Label>
        <Input
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
        />
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {employee ? 'Update' : 'Add'} Employee
        </Button>
      </div>
    </form>
  );
}