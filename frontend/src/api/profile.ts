import api from './client'

export interface ProfilePayload {
  first_name: string; last_name: string; phone: string
  date_of_birth: string; tax_id_last4: string
  address: { line1: string; city: string; state: string; postal_code: string; country: string }
}

export const createProfile = (payload: ProfilePayload) => api.post('/profile', payload)
export const getProfile = () => api.get('/profile')
