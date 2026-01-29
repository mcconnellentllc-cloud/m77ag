const express = require('express');
const router = express.Router();
const Employee = require('../models/employee');

// Get all employees
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find({ isActive: true }).sort({ lastName: 1 });
    res.json({ success: true, employees });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch employees' });
  }
});

// Get all employees including inactive
router.get('/all', async (req, res) => {
  try {
    const employees = await Employee.find().sort({ lastName: 1 });
    res.json({ success: true, employees });
  } catch (error) {
    console.error('Error fetching all employees:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch employees' });
  }
});

// Get single employee
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    res.json({ success: true, employee });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch employee' });
  }
});

// Get employee summary (for dashboard cards)
router.get('/summary/all', async (req, res) => {
  try {
    const employees = await Employee.find({ isActive: true });

    // Calculate summary for each employee
    const summary = employees.map(emp => {
      // Calculate wages earned based on time since start
      const now = new Date();
      const start = new Date(emp.startDate);
      const monthsWorked = Math.max(0,
        (now.getFullYear() - start.getFullYear()) * 12 +
        (now.getMonth() - start.getMonth()) +
        (now.getDate() >= start.getDate() ? 0 : -1)
      );

      let wagesEarned = 0;
      if (emp.payType === 'salary') {
        wagesEarned = (emp.annualSalary / 12) * monthsWorked;
      } else if (emp.payType === 'monthly') {
        wagesEarned = emp.monthlyRate * monthsWorked;
      }

      // Calculate totals from paychecks
      const totalPaid = (emp.paychecks || [])
        .filter(p => p.paid)
        .reduce((sum, p) => sum + (p.netAmount || 0), 0);

      // Calculate reimbursements
      const reimbursementsOwed = (emp.reimbursements || [])
        .filter(r => r.status === 'approved')
        .reduce((sum, r) => sum + (r.amount || 0), 0);

      const reimbursementsPaid = (emp.reimbursements || [])
        .filter(r => r.status === 'paid')
        .reduce((sum, r) => sum + (r.amount || 0), 0);

      // Credit = wages earned - paid + reimbursements pending
      const creditOwed = wagesEarned - totalPaid + reimbursementsOwed;

      return {
        _id: emp._id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        fullName: `${emp.firstName} ${emp.lastName}`,
        position: emp.position,
        employmentType: emp.employmentType,
        startDate: emp.startDate,
        isClockedIn: emp.isClockedIn,
        hasProfitShare: emp.hasProfitShare,
        profitSharePercent: emp.profitSharePercent,
        payType: emp.payType,
        annualSalary: emp.annualSalary,
        monthlyRate: emp.monthlyRate,
        wagesEarned,
        totalPaid,
        reimbursementsOwed,
        reimbursementsPaid,
        creditOwed,
        pendingTimeOff: (emp.timeOffRequests || []).filter(t => t.status === 'pending').length
      };
    });

    res.json({ success: true, summary });
  } catch (error) {
    console.error('Error fetching employee summary:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch summary' });
  }
});

// Create new employee
router.post('/', async (req, res) => {
  try {
    const employee = new Employee(req.body);
    await employee.save();
    res.json({ success: true, employee });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ success: false, error: 'Failed to create employee' });
  }
});

// Update employee
router.put('/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    res.json({ success: true, employee });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ success: false, error: 'Failed to update employee' });
  }
});

// Clock in
router.post('/:id/clock-in', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    if (employee.isClockedIn) {
      return res.status(400).json({ success: false, error: 'Already clocked in' });
    }

    employee.isClockedIn = true;
    employee.currentClockIn = new Date();
    await employee.save();

    res.json({ success: true, employee, message: 'Clocked in successfully' });
  } catch (error) {
    console.error('Error clocking in:', error);
    res.status(500).json({ success: false, error: 'Failed to clock in' });
  }
});

// Clock out
router.post('/:id/clock-out', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    if (!employee.isClockedIn) {
      return res.status(400).json({ success: false, error: 'Not currently clocked in' });
    }

    const clockOut = new Date();
    const clockIn = new Date(employee.currentClockIn);
    const hoursWorked = (clockOut - clockIn) / (1000 * 60 * 60);

    employee.timeEntries.push({
      clockIn: employee.currentClockIn,
      clockOut: clockOut,
      hoursWorked: Math.round(hoursWorked * 100) / 100,
      notes: req.body.notes || ''
    });

    employee.isClockedIn = false;
    employee.currentClockIn = null;
    await employee.save();

    res.json({ success: true, employee, hoursWorked: Math.round(hoursWorked * 100) / 100 });
  } catch (error) {
    console.error('Error clocking out:', error);
    res.status(500).json({ success: false, error: 'Failed to clock out' });
  }
});

// Request time off
router.post('/:id/time-off', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    employee.timeOffRequests.push({
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      type: req.body.type || 'vacation',
      notes: req.body.notes || ''
    });

    await employee.save();
    res.json({ success: true, employee });
  } catch (error) {
    console.error('Error requesting time off:', error);
    res.status(500).json({ success: false, error: 'Failed to request time off' });
  }
});

// Review time off request
router.put('/:id/time-off/:requestId', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const request = employee.timeOffRequests.id(req.params.requestId);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Time off request not found' });
    }

    request.status = req.body.status;
    request.reviewedAt = new Date();
    request.reviewedBy = req.body.reviewedBy || 'Admin';

    await employee.save();
    res.json({ success: true, employee });
  } catch (error) {
    console.error('Error reviewing time off:', error);
    res.status(500).json({ success: false, error: 'Failed to review time off request' });
  }
});

// Add paycheck
router.post('/:id/paycheck', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    employee.paychecks.push({
      payPeriodStart: req.body.payPeriodStart,
      payPeriodEnd: req.body.payPeriodEnd,
      payDate: req.body.payDate,
      grossAmount: req.body.grossAmount,
      deductions: req.body.deductions || 0,
      netAmount: req.body.netAmount || req.body.grossAmount,
      type: req.body.type || 'regular',
      notes: req.body.notes || '',
      checkNumber: req.body.checkNumber,
      paid: req.body.paid || false
    });

    await employee.save();
    res.json({ success: true, employee });
  } catch (error) {
    console.error('Error adding paycheck:', error);
    res.status(500).json({ success: false, error: 'Failed to add paycheck' });
  }
});

// Update paycheck (mark as paid, etc.)
router.put('/:id/paycheck/:paycheckId', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const paycheck = employee.paychecks.id(req.params.paycheckId);
    if (!paycheck) {
      return res.status(404).json({ success: false, error: 'Paycheck not found' });
    }

    Object.assign(paycheck, req.body);
    await employee.save();
    res.json({ success: true, employee });
  } catch (error) {
    console.error('Error updating paycheck:', error);
    res.status(500).json({ success: false, error: 'Failed to update paycheck' });
  }
});

// Add reimbursement
router.post('/:id/reimbursement', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    employee.reimbursements.push({
      date: req.body.date || new Date(),
      amount: req.body.amount,
      description: req.body.description,
      category: req.body.category || 'other',
      receiptUrl: req.body.receiptUrl,
      status: 'pending',
      notes: req.body.notes || ''
    });

    await employee.save();
    res.json({ success: true, employee });
  } catch (error) {
    console.error('Error adding reimbursement:', error);
    res.status(500).json({ success: false, error: 'Failed to add reimbursement' });
  }
});

// Update reimbursement status
router.put('/:id/reimbursement/:reimbursementId', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const reimbursement = employee.reimbursements.id(req.params.reimbursementId);
    if (!reimbursement) {
      return res.status(404).json({ success: false, error: 'Reimbursement not found' });
    }

    Object.assign(reimbursement, req.body);
    if (req.body.status === 'paid') {
      reimbursement.paidDate = new Date();
    }
    await employee.save();
    res.json({ success: true, employee });
  } catch (error) {
    console.error('Error updating reimbursement:', error);
    res.status(500).json({ success: false, error: 'Failed to update reimbursement' });
  }
});

// Delete employee (soft delete - set inactive)
router.delete('/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    res.json({ success: true, message: 'Employee deactivated' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ success: false, error: 'Failed to delete employee' });
  }
});

module.exports = router;
