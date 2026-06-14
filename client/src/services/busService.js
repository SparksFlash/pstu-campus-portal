import api from './api';

export const busService = {
  getAllBusSchedules: () =>
    api.get('/bus-schedule'),

  getBusScheduleById: (scheduleId) =>
    api.get(`/bus-schedule/${scheduleId}`),

  createBusSchedule: (scheduleData) =>
    api.post('/bus-schedule', scheduleData),

  updateBusSchedule: (scheduleId, data) =>
    api.put(`/bus-schedule/${scheduleId}`, data),

  deleteBusSchedule: (scheduleId) =>
    api.delete(`/bus-schedule/${scheduleId}`),

  getBusRoutes: () =>
    api.get('/bus-schedule/routes'),

  searchBusSchedules: (query) =>
    api.get('/bus-schedule/search', { params: { q: query } }),
};
