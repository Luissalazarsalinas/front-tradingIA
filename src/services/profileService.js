// src/services/profileService.js
import api from './apiClient';
import { profileMock } from './mock/profileMock';
import { USE_MOCK } from './apiClient';

const useMock = USE_MOCK;

export const profileService = {
  getProfile: async () => {
    if (useMock) return profileMock.getProfile();
    const { data } = await api.get('/profile');
    return data;
  },

  updateProfile: async (payload) => {
    if (useMock) return profileMock.updateProfile(payload);
    const { data } = await api.post('/profile', payload);
    return data;
  }
};


// export const profileService = {
//   getProfile: async () => {
//     if (useMock) return mockProfileApi.getProfile();
//     const { data } = await api.get('/user/profile');
//     return data;
//   },

//   updateProfile: async (payload) => {
//     if (useMock) return mockProfileApi.updateProfile(payload);
//     const { data } = await api.patch('/user/profile', payload);
//     return data;
//   },

//   getRiskEstimate: async () => {
//     if (useMock) return mockProfileApi.getRiskEstimate();
//     const { data } = await api.get('/user/risk-estimate');
//     return data;
//   }
// };