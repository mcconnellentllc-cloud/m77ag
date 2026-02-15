const express = require('express');
const router = express.Router();
const bankingController = require('../controllers/bankingController');
const { authenticate, isStaff, isAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Banking dashboard
router.get('/dashboard', isStaff, bankingController.getBankingDashboard);

// Bank accounts
router.get('/accounts', isStaff, bankingController.getAccounts);
router.get('/accounts/summary', isStaff, bankingController.getAccountsSummary);
router.post('/accounts', isAdmin, bankingController.createAccount);
router.put('/accounts/:id', isAdmin, bankingController.updateAccount);
router.post('/accounts/:id/transaction', isStaff, bankingController.recordBankTransaction);

// Cash flow
router.get('/cash-flow', isStaff, bankingController.getCashFlowSummary);

// Loans
router.get('/loans', isStaff, bankingController.getLoans);
router.get('/loans/portfolio', isStaff, bankingController.getLoanPortfolio);
router.post('/loans', isAdmin, bankingController.createLoan);
router.get('/loans/:id', isStaff, bankingController.getLoan);
router.put('/loans/:id', isAdmin, bankingController.updateLoan);
router.post('/loans/:id/payment', isStaff, bankingController.recordLoanPayment);
router.get('/loans/:id/amortization', isStaff, bankingController.getAmortizationSchedule);

module.exports = router;
