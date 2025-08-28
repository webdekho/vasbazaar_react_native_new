import { postRequest, getRequest } from '../api/baseApi';

// Simple bill payment functions

export const getBillCategories = async (sessionToken) => {
  return await getRequest('bills/categories', {}, sessionToken);
};

export const getBillers = async (categoryId, sessionToken) => {
  const params = { categoryId };
  return await getRequest('bills/billers', params, sessionToken);
};

export const fetchBillDetails = async (billerId, accountNumber, sessionToken) => {
  const payload = { billerId, accountNumber };
  return await postRequest('bills/fetch-bill', payload, sessionToken);
};

export const payBill = async (billerId, accountNumber, amount, sessionToken) => {
  const payload = {
    billerId,
    accountNumber,
    amount,
    transactionId: `BILL${Date.now()}${Math.floor(Math.random() * 1000)}`,
  };
  
  return await postRequest('bills/pay-bill', payload, sessionToken);
};

export const getBillHistory = async (sessionToken, page = 1) => {
  const params = { page, limit: 10 };
  return await getRequest('bills/payment-history', params, sessionToken);
};