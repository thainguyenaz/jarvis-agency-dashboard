const PROXY = '/api/proxy';

export async function jarvisFetch(path: string, token?: string) {
  const authToken =
    token ||
    (typeof window !== 'undefined' ? localStorage.getItem('jarvis_token') || '' : '');
  const res = await fetch(`${PROXY}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    },
  });
  if (res.status === 401) {
    // Token expired or invalid — clear and redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jarvis_token');
      localStorage.removeItem('jarvis_user');
      window.location.href = '/';
    }
    throw new Error('Session expired — redirecting to login');
  }
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    fetch(`${PROXY}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }).then(r => r.json()),

  // Kipu
  getCensus: (token: string) =>
    jarvisFetch('/api/kipu/census', token),

  // Google Ads
  getGoogleAdsPerformance: (token: string) =>
    jarvisFetch('/api/google-ads/performance', token),
  getGoogleAdsCampaigns: (token: string) =>
    jarvisFetch('/api/google-ads/campaigns', token),
  getGoogleAdsChangeHistory: (token: string) =>
    jarvisFetch('/api/google-ads/change-history', token),

  // GA4
  getGA4Overview: (token: string) =>
    jarvisFetch('/api/ga4/overview', token),

  // CTM
  getCTMSummary: (token: string) =>
    jarvisFetch('/api/ctm/summary', token),
  getCTMSourceBreakdown: (token: string) =>
    jarvisFetch('/api/ctm/source-breakdown', token),
  getCTMSourceDetail: (key: string, token: string) =>
    jarvisFetch(`/api/ctm/source-detail/${encodeURIComponent(key)}`, token),

  // HubSpot
  getHubSpotPipeline: (token: string) =>
    jarvisFetch('/api/hubspot/pipeline', token),
  getHubSpotContacts: (token: string) =>
    jarvisFetch('/api/hubspot/contacts', token),

  // QBO
  getFinanceOverview: (token: string) =>
    jarvisFetch('/api/finance/overview', token),

  // Agents
  getAgentStatus: () =>
    fetch(`${PROXY}/api/marketing-agency/status`)
      .then(r => r.json()),
  getApiHealth: () =>
    fetch(`${PROXY}/health`)
      .then(r => r.json()),

  // Alerts
  getAlerts: (token: string) =>
    jarvisFetch('/api/alerts', token),

  // Pending approvals
  getPendingApprovals: (token: string) =>
    jarvisFetch('/api/agents/pending-approvals', token),
};
