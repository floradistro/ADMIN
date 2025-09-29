/**
 * Centralized API Client using Axios
 * Provides a consistent interface for all API calls with authentication and error handling
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from '@/lib/logger';

export interface ApiConfig {
  baseUrl: string;
  wpBaseUrl: string;
  wcBaseUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

class ApiClient {
  private static instance: ApiClient;
  private config: ApiConfig;
  private floraClient: AxiosInstance;
  private wpClient: AxiosInstance;
  private wcClient: AxiosInstance;

  private constructor() {
    this.config = {
      baseUrl: 'https://api.floradistro.com/wp-json/flora-im/v1',
      wpBaseUrl: 'https://api.floradistro.com/wp-json/wp/v2',
      wcBaseUrl: 'https://api.floradistro.com/wp-json/wc/v3',
      consumerKey: 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5',
      consumerSecret: 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'
    };

    // Flora IM API client
    this.floraClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // WordPress API client
    this.wpClient = axios.create({
      baseURL: this.config.wpBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // WooCommerce API client
    this.wcClient = axios.create({
      baseURL: this.config.wcBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      auth: {
        username: this.config.consumerKey,
        password: this.config.consumerSecret,
      },
    });

    this.setupInterceptors();
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private setupInterceptors(): void {
    // Flora API interceptors
    this.floraClient.interceptors.request.use(
      (config) => {
        // Add auth parameters to Flora API requests
        const separator = config.url?.includes('?') ? '&' : '?';
        config.url = `${config.url}${separator}consumer_key=${this.config.consumerKey}&consumer_secret=${this.config.consumerSecret}`;
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptors for error handling
    [this.floraClient, this.wpClient, this.wcClient].forEach(client => {
      client.interceptors.response.use(
        (response) => response,
        (error) => {
          logger.error('API Error', error, {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
          });
          return Promise.reject(error);
        }
      );
    });
  }

  // Flora IM API methods
  public flora<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.floraClient(config);
  }

  // WordPress API methods
  public wordpress<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.wpClient(config);
  }

  // WooCommerce API methods
  public woocommerce<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.wcClient(config);
  }

  // Convenience methods
  public get<T = any>(endpoint: string, params?: Record<string, any>, client: 'flora' | 'wp' | 'wc' = 'flora'): Promise<AxiosResponse<T>> {
    const clientInstance = client === 'wp' ? this.wpClient : client === 'wc' ? this.wcClient : this.floraClient;
    return clientInstance.get(endpoint, { params });
  }

  public post<T = any>(endpoint: string, data?: any, client: 'flora' | 'wp' | 'wc' = 'flora'): Promise<AxiosResponse<T>> {
    const clientInstance = client === 'wp' ? this.wpClient : client === 'wc' ? this.wcClient : this.floraClient;
    return clientInstance.post(endpoint, data);
  }

  public put<T = any>(endpoint: string, data?: any, client: 'flora' | 'wp' | 'wc' = 'flora'): Promise<AxiosResponse<T>> {
    const clientInstance = client === 'wp' ? this.wpClient : client === 'wc' ? this.wcClient : this.floraClient;
    return clientInstance.put(endpoint, data);
  }

  public delete<T = any>(endpoint: string, client: 'flora' | 'wp' | 'wc' = 'flora'): Promise<AxiosResponse<T>> {
    const clientInstance = client === 'wp' ? this.wpClient : client === 'wc' ? this.wcClient : this.floraClient;
    return clientInstance.delete(endpoint);
  }
}

export const apiClient = ApiClient.getInstance();
