const express = require('express');
const router = express.Router();
const bankingController = require('../controllers/bankingController');
const bankersOverviewController = require('../controllers/bankersOverviewController');
const { authenticate, isStaff, isAdmin, isBankerOrStaff } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Banking dashboard
router.get('/dashboard', isStaff, bankingController.getBankingDashboard);

// Banker's overview - full financial position (read-only for banker role)
router.get('/bankers-overview', isBankerOrStaff, bankersOverviewController.getBankersOverview);
router.get('/bankers-comments', isBankerOrStaff, bankersOverviewController.getBankerComments);
router.post('/bankers-comments', isBankerOrStaff, bankersOverviewController.addBankerComment);

// Net Worth by Entity
router.get('/net-worth-by-entity', isBankerOrStaff, bankersOverviewController.getNetWorthByEntity);

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
