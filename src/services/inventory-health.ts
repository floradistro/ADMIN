/**
 * BULLETPROOF: Inventory Data Health Monitor
 * 
 * Prevents data inconsistency issues by monitoring and validating
 * the Flora API and Magic2 plugin integration
 */

export interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  details?: any;
  timestamp: Date;
}

export interface InventoryHealthReport {
  overall: 'healthy' | 'warning' | 'critical';
  checks: {
    floraApi: HealthCheckResult;
    magic2Plugin: HealthCheckResult;
  };
  recommendations: string[];
}

export class InventoryHealthMonitor {
  private baseUrl = 'https://api.floradistro.com/wp-json';
  private authHeader = `Basic ${Buffer.from('ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5:cs_38194e74c7ddc5d72b6c32c70485728e7e529678').toString('base64')}`;

  /**
   * Run comprehensive health check
   */
  async runHealthCheck(): Promise<InventoryHealthReport> {
    const checks = {
      floraApi: await this.checkFloraApi(),
      magic2Plugin: await this.checkMagic2Plugin()
    };

    const criticalIssues = Object.values(checks).filter(check => check.status === 'critical');
    const warnings = Object.values(checks).filter(check => check.status === 'warning');

    const overall = criticalIssues.length > 0 ? 'critical' : 
                   warnings.length > 0 ? 'warning' : 'healthy';

    const recommendations = this.generateRecommendations(checks);

    return {
      overall,
      checks,
      recommendations
    };
  }

  /**
   * Check Flora API health
   */
  private async checkFloraApi(): Promise<HealthCheckResult> {
    try {
      const response = await fetch(`${this.baseUrl}/flora-filter/v1/locations`, {
        headers: { 'Authorization': this.authHeader }
      });

      if (!response.ok) {
        return {
          status: 'critical',
          message: `Flora API error: ${response.status}`,
          timestamp: new Date()
        };
      }

      const data = await response.json();
      if (!data.success || !data.data || data.data.length === 0) {
        return {
          status: 'warning',
          message: 'Flora API returns no locations',
          timestamp: new Date()
        };
      }

      return {
        status: 'healthy',
        message: `Flora API healthy (${data.data.length} locations)`,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'critical',
        message: `Flora API unreachable: ${error}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Check Magic2 Plugin health
   */
  private async checkMagic2Plugin(): Promise<HealthCheckResult> {
    try {
      const response = await fetch(`${this.baseUrl}/flora-inventory-matrix/v1/health`, {
        headers: { 'Authorization': this.authHeader }
      });

      if (!response.ok) {
        return {
          status: 'critical',
          message: `Magic2 Plugin API error: ${response.status}`,
          timestamp: new Date()
        };
      }

      const data = await response.json();
      if (!data || !data.success) {
        return {
          status: 'warning',
          message: 'Magic2 Plugin returns invalid data format',
          timestamp: new Date()
        };
      }

      return {
        status: 'healthy',
        message: 'Magic2 Plugin healthy',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'critical',
        message: `Magic2 Plugin unreachable: ${error}`,
        timestamp: new Date()
      };
    }
  }



  /**
   * Generate recommendations based on health check results
   */
  private generateRecommendations(checks: any): string[] {
    const recommendations: string[] = [];

    if (checks.floraApi.status === 'critical') {
      recommendations.push('Flora API is down - check plugin activation and server status');
    }

    if (checks.magic2Plugin.status === 'critical') {
      recommendations.push('Magic2 Plugin is down - check plugin activation and authentication');
    }

    if (recommendations.length === 0) {
      recommendations.push('All systems healthy - no action required');
    }

    return recommendations;
  }

  /**
   * Quick health check for real-time monitoring
   */
  async quickHealthCheck(): Promise<'healthy' | 'warning' | 'critical'> {
    try {
      const floraCheck = await this.checkFloraApi();
      const magic2Check = await this.checkMagic2Plugin();

      if (floraCheck.status === 'critical' || magic2Check.status === 'critical') {
        return 'critical';
      }

      if (floraCheck.status === 'warning' || magic2Check.status === 'warning') {
        return 'warning';
      }

      return 'healthy';
    } catch (error) {
      return 'critical';
    }
  }
}

export const inventoryHealthMonitor = new InventoryHealthMonitor();