const express = require('express');
const router = express.Router();
const Employee = require('../models/employee');
const User = require('../models/user');

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
        pendingTimeOff: (emp.timeOffRequests || []).filter(t => t.status === 'pending').length,
        contractSigned: emp.contract?.signed || false,
        contractSignedDate: emp.contract?.signedDate || null
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

// Sign contract
router.post('/:id/sign-contract', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    // Get client IP
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';

    employee.contract = {
      signed: true,
      signedDate: new Date(),
      signatureData: req.body.signatureData,
      signedIP: clientIP,
      contractVersion: req.body.contractVersion || '1.0',
      contractType: req.body.contractType || 'independent-contractor',
      agreedTerms: {
        compensation: req.body.agreedTerms?.compensation || false,
        workScope: req.body.agreedTerms?.workScope || false,
        termination: req.body.agreedTerms?.termination || false,
        confidentiality: req.body.agreedTerms?.confidentiality || false,
        taxResponsibility: req.body.agreedTerms?.taxResponsibility || false
      }
    };

    await employee.save();
    res.json({ success: true, employee, message: 'Contract signed successfully' });
  } catch (error) {
    console.error('Error signing contract:', error);
    res.status(500).json({ success: false, error: 'Failed to sign contract' });
  }
});

// Get contract status
router.get('/:id/contract', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    res.json({
      success: true,
      contract: employee.contract,
      employee: {
        firstName: employee.firstName,
        lastName: employee.lastName,
        position: employee.position,
        startDate: employee.startDate,
        payType: employee.payType,
        annualSalary: employee.annualSalary,
        monthlyRate: employee.monthlyRate,
        hasProfitShare: employee.hasProfitShare,
        profitSharePercent: employee.profitSharePercent
      }
    });
  } catch (error) {
    console.error('Error getting contract:', error);
    res.status(500).json({ success: false, error: 'Failed to get contract status' });
  }
});

// Check if employee has a login account
router.get('/:id/login-status', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    // Look for a User account with matching email
    const email = employee.email;
    if (!email) {
      return res.json({ success: true, hasAccount: false, message: 'No email set for employee' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      res.json({
        success: true,
        hasAccount: true,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin || null,
        isActive: user.isActive
      });
    } else {
      res.json({ success: true, hasAccount: false });
    }
  } catch (error) {
    console.error('Error checking login status:', error);
    res.status(500).json({ success: false, error: 'Failed to check login status' });
  }
});

// Create or reset employee login credentials
router.post('/:id/create-login', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    // Update employee email if different
    if (employee.email !== email) {
      employee.email = email;
      await employee.save();
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });
    let created = false;

    if (user) {
      // Update existing user
      user.password = password; // Will be hashed by pre-save hook
      user.role = role || 'farmer';
      user.name = `${employee.firstName} ${employee.lastName}`;
      user.isActive = true;
      user.emailVerified = true;
      if (role === 'farmer') {
        user.employeePermissions = {
          canAddCattleRecords: true,
          canEditCattleRecords: true,
          canDeleteCattleRecords: false,
          canAddEquipmentLogs: true,
          canEditEquipmentLogs: true,
          canAddTransactions: false,
          canEditTransactions: false,
          canViewFinancials: true,
          canViewReports: true,
          accessAreas: ['cattle', 'crops', 'equipment']
        };
      }
      await user.save();
    } else {
      // Create new user
      created = true;
      const userData = {
        name: `${employee.firstName} ${employee.lastName}`,
        email: email.toLowerCase(),
        password: password, // Will be hashed by pre-save hook
        phone: employee.phone || 'Not provided',
        role: role || 'farmer',
        isActive: true,
        emailVerified: true
      };

      if (role === 'farmer') {
        userData.employeePermissions = {
          canAddCattleRecords: true,
          canEditCattleRecords: true,
          canDeleteCattleRecords: false,
          canAddEquipmentLogs: true,
          canEditEquipmentLogs: true,
          canAddTransactions: false,
          canEditTransactions: false,
          canViewFinancials: true,
          canViewReports: true,
          accessAreas: ['cattle', 'crops', 'equipment']
        };
      }

      user = new User(userData);
      await user.save();
    }

    res.json({
      success: true,
      created,
      message: created ? 'Login account created' : 'Login credentials reset',
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Error creating/resetting login:', error);
    // Return specific error message for better debugging
    let errorMessage = 'Failed to create login credentials';
    if (error.code === 11000) {
      errorMessage = 'An account with this email already exists';
    } else if (error.errors) {
      // Mongoose validation error
      const fieldErrors = Object.keys(error.errors).map(key => error.errors[key].message);
      errorMessage = fieldErrors.join(', ');
    } else if (error.message) {
      errorMessage = error.message;
    }
    res.status(500).json({ success: false, error: errorMessage });
  }
});

module.exports = router;
