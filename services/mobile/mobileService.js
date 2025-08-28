import { postRequest, getRequest } from '../api/baseApi';

// Simple mobile recharge functions

export const getMobileOperators = async (sessionToken) => {
  return await getRequest('mobile/operators', {}, sessionToken);
};

export const validateMobileNumber = async (mobileNumber, sessionToken) => {
  const payload = { mobileNumber };
  return await postRequest('mobile/validate-number', payload, sessionToken);
};

export const getMobilePlans = async (operatorId, circleId, sessionToken) => {
  const params = { operatorId, circleId };
  return await getRequest('mobile/plans', params, sessionToken);
};

export const rechargeMobile = async (mobileNumber, operatorId, amount, sessionToken) => {
  const payload = {
    mobileNumber,
    operatorId,
    amount,
    transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
  };
  
  return await postRequest('mobile/recharge', payload, sessionToken);
};

export const getRechargeHistory = async (sessionToken, page = 1) => {
  const params = { page, limit: 10 };
  return await getRequest('mobile/recharge-history', params, sessionToken);
};

// DTH Services
export const getDthOperators = async (sessionToken) => {
  return await getRequest('dth/operators', {}, sessionToken);
};

export const validateDthNumber = async (dthNumber, sessionToken) => {
  const payload = { dthNumber };
  return await postRequest('dth/validate-number', payload, sessionToken);
};

export const getDthPlans = async (operatorId, sessionToken) => {
  const params = { operatorId };
  return await getRequest('dth/plans', params, sessionToken);
};

export const rechargeDth = async (dthNumber, operatorId, amount, sessionToken) => {
  const payload = {
    dthNumber,
    operatorId,
    amount,
    transactionId: `DTH${Date.now()}${Math.floor(Math.random() * 1000)}`,
  };
  
  return await postRequest('dth/recharge', payload, sessionToken);
};

export const getDthRechargeHistory = async (sessionToken, page = 1) => {
  const params = { page, limit: 10 };
  return await getRequest('dth/recharge-history', params, sessionToken);
};