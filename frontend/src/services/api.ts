import type { Mandapam } from '../types/mandapam';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function fetchMandapams(params?: {
  area?: string;
  search?: string;
}): Promise<Mandapam[]> {
  try {
    const url = new URL(`${API_BASE}/mandapams`, window.location.origin);
    if (params?.area && params.area !== 'all') {
      url.searchParams.set('area', params.area);
    }
    if (params?.search && params.search.trim()) {
      url.searchParams.set('search', params.search.trim());
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch mandapams: ${response.statusText}`);
    }

    const json = await response.json();
    return json.data ?? [];
  } catch (err) {
    console.error('[API] fetchMandapams error:', err);
    return [];
  }
}

export async function fetchFeaturedMandapams(): Promise<Mandapam[]> {
  try {
    const response = await fetch(`${API_BASE}/mandapams/featured`);
    if (!response.ok) {
      throw new Error(`Failed to fetch featured mandapams: ${response.statusText}`);
    }

    const json = await response.json();
    return json.data ?? [];
  } catch (err) {
    console.error('[API] fetchFeaturedMandapams error:', err);
    return [];
  }
}

export async function fetchMandapamById(id: string): Promise<Mandapam | null> {
  try {
    const response = await fetch(`${API_BASE}/mandapams/${id}`);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch mandapam ${id}: ${response.statusText}`);
    }

    const json = await response.json();
    return json.data ?? null;
  } catch (err) {
    console.error('[API] fetchMandapamById error:', err);
    return null;
  }
}

export async function submitMandapam(
  formData: FormData,
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/mandapams`, {
      method: 'POST',
      body: formData,
    });

    const json = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: json.error || 'Failed to submit mandapam',
      };
    }

    return {
      success: true,
      message: json.message || 'Mandapam submitted successfully!',
    };
  } catch (err: any) {
    console.error('[API] submitMandapam error:', err);
    return {
      success: false,
      error: err?.message || 'Network error occurred while submitting.',
    };
  }
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
