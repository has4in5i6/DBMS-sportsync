import { request } from './api';

export const fetchReviews = (query = '') => request(`/reviews${query}`);
export const fetchMyReviewTargets = () => request('/reviews/mine/targets');
export const createReview = (payload) => request('/reviews', {
  method: 'POST',
  body: JSON.stringify(payload),
});
