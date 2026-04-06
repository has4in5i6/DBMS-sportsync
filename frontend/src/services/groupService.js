import { request } from './api';

export const fetchGroups = () => request('/groups');
export const fetchMyGroups = () => request('/groups/mine');
export const fetchGroupById = (groupId) => request(`/groups/${groupId}`);
export const createGroup = (payload) => request('/groups', {
  method: 'POST',
  body: JSON.stringify(payload),
});
export const joinGroup = (groupId) => request(`/groups/${groupId}/join`, {
  method: 'POST',
});
export const postGroupMessage = (groupId, messageText) => request(`/groups/${groupId}/messages`, {
  method: 'POST',
  body: JSON.stringify({ messageText }),
});
