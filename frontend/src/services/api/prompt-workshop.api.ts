import axios from 'axios';
import { PromptWorkshopItem, PromptSubmission, PromptSubmissionCreate } from '../../types/index.js';

const promptWorkshopApi = {
  getStatus: () => axios.get('/api/prompt-workshop/status').then(res => res.data),
  
  getItems: (params: { 
    category?: string, 
    search?: string, 
    sort?: string,
    page?: number,
    page_size?: number
  }) => axios.get('/api/prompt-workshop/items', { params }).then(res => res.data),
  
  getItem: (itemId: string) => axios.get(`/api/prompt-workshop/items/${itemId}`).then(res => res.data),
  
  importItem: (itemId: string) => axios.post(`/api/prompt-workshop/items/${itemId}/import`).then(res => res.data),
  
  toggleLike: (itemId: string) => axios.post(`/api/prompt-workshop/items/${itemId}/like`).then(res => res.data),
  
  submit: (data: PromptSubmissionCreate) => axios.post('/api/prompt-workshop/submit', data).then(res => res.data),
  
  getMySubmissions: () => axios.get('/api/prompt-workshop/my-submissions').then(res => res.data),
  
  withdrawSubmission: (submissionId: string, force: boolean = false) => 
    axios.delete(`/api/prompt-workshop/submissions/${submissionId}`, { params: { force } }).then(res => res.data),
    
  deleteItem: (itemId: string) => axios.delete(`/api/prompt-workshop/items/${itemId}`).then(res => res.data),

  // Admin APIs
  adminGetSubmissions: (params: { status?: string, page?: number, page_size?: number }) => 
    axios.get('/api/prompt-workshop/admin/submissions', { params }).then(res => res.data),
    
  adminReviewSubmission: (submissionId: string, data: { status: 'approved' | 'rejected', review_notes?: string }) => 
    axios.post(`/api/prompt-workshop/admin/submissions/${submissionId}/review`, data).then(res => res.data),
};

export default promptWorkshopApi;
