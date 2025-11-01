/**
 * NiFi API Client - Simplified version for Chrome Extension
 * Handles authentication and API calls to Apache NiFi
 */

class NiFiApiClient {
  constructor() {
    this.baseUrl = 'https://localhost:8443/nifi-api';
    this.token = null;
    this.authenticated = false;
    this.username = 'admin';
    this.password = 'ctsBtRBKHRAx69EqUghvvgEvjnaLjFEB';
  }

  /**
   * Authenticate with NiFi
   */
  async authenticate() {
    try {
      const response = await fetch(`${this.baseUrl}/access/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `username=${encodeURIComponent(this.username)}&password=${encodeURIComponent(this.password)}`
      });

      if (response.ok) {
        this.token = await response.text();
        this.authenticated = true;
        console.log('[NiFi API] Authentication successful');
        return true;
      } else {
        console.error('[NiFi API] Authentication failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('[NiFi API] Authentication error:', error);
      return false;
    }
  }

  /**
   * Make authenticated API request
   */
  async request(endpoint, options = {}) {
    if (!this.authenticated) {
      await this.authenticate();
    }

    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`API request failed: ${response.status}`);
      }
    } catch (error) {
      console.error('[NiFi API] Request error:', error);
      throw error;
    }
  }

  /**
   * Get process groups
   */
  async getProcessGroups() {
    return await this.request('/flow/process-groups/root');
  }

  /**
   * Get component details
   */
  async getComponent(componentId, componentType = 'processors') {
    return await this.request(`/${componentType}/${componentId}`);
  }

  /**
   * Update component position
   */
  async updateComponentPosition(componentId, x, y, componentType = 'processors') {
    const component = await this.getComponent(componentId, componentType);
    
    const updateData = {
      revision: component.revision,
      component: {
        id: componentId,
        position: { x, y }
      }
    };

    return await this.request(`/${componentType}/${componentId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  /**
   * Get flow content
   */
  async getFlowContent(processGroupId = 'root') {
    return await this.request(`/flow/process-groups/${processGroupId}`);
  }
}

// Global instance
window.nifiApiClient = new NiFiApiClient();