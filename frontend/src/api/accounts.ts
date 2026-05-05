import api from './client'

export const createAccount = (account_type: string, initial_deposit: number) =>
  api.post('/accounts', { account_type, initial_deposit })

export const listAccounts = () => api.get('/accounts')

export const getBalance = (id: string) => api.get(`/accounts/${id}/balance`)

export const submitOverdraft = (id: string, payload: object) =>
  api.post(`/accounts/${id}/overdraft-request`, payload)

export const getOverdraft = (id: string) => api.get(`/accounts/${id}/overdraft-request`)
