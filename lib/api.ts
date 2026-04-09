const JARVIS_API = process.env.NEXT_PUBLIC_JARVIS_API_URL || '';

async function jarvisFetch(path: string, token?: string) {
  const res = await fetch(`${JARVIS_API}/api/proxy${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    next: { revalidate: 60 }
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    fetch(`${JARVIS_API}/api/proxy/api/auth/login`, {
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

  // GA4
  getGA4Overview: (token: string) =>
    jarvisFetch('/api/ga4/overview', token),

  // CTM
  getCTMSummary: (token: string) =>
    jarvisFetch('/api/ctm/summary', token),

  // HubSpot
  getHubSpotPipeline: (token: string) =>
    jarvisFetch('/api/hubspot/pipeline', token),

  // QBO
  getFinanceOverview: (token: string) =>
    jarvisFetch('/api/finance/overview', token),

  // Agents
  getAgentStatus: () =>
    fetch(`${JARVIS_API}/api/proxy/api/marketing-agency/status`)
      .then(r => r.json()),

  // Alerts
  getAlerts: (token: string) =>
    jarvisFetch('/api/alerts', token),

  // Pending approvals
  getPendingApprovals: (token: string) =>
    jarvisFetch('/api/agents/pending-approvals', token),
};
