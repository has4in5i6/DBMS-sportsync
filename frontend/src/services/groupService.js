import { request } from './api';

export const fetchGroups = () => request('/groups');
export const fetchMyGroups = () => request('/groups/mine');
export const fetchMyJoinRequests = () => request('/groups/requests/mine');
export const fetchGroupById = (groupId) => request(`/groups/${groupId}`);
export const fetchGroupJoinRequests = (groupId) => request(`/groups/${groupId}/requests`);
export const createGroup = (payload) => request('/groups', {
  method: 'POST',
  body: JSON.stringify(payload),
});
export const joinGroup = (groupId) => request(`/groups/${groupId}/join`, {
  method: 'POST',
});
export const approveJoinRequest = (requestId) => request(`/groups/requests/${requestId}/accept`, {
  method: 'PATCH',
});
export const rejectJoinRequest = (requestId) => request(`/groups/requests/${requestId}/reject`, {
  method: 'PATCH',
});
export const clearRejectedJoinRequest = (requestId) => request(`/groups/requests/${requestId}`, {
  method: 'DELETE',
});
export const postGroupMessage = (groupId, messageText) => request(`/groups/${groupId}/messages`, {
  method: 'POST',
  body: JSON.stringify({ messageText }),
});
