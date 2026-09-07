export interface Category {
  id: number;
  name: string;
  websites_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface Website {
  id: number;
  name: string;
  url: string;
  description: string | null;
  favicon: string | null;
  is_favorite: boolean;
  category_id: number;
  category?: Category;
  created_at?: string;
  updated_at?: string;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
}

export interface Statistics {
  total_websites: number;
  total_categories: number;
  total_favorites: number;
  top_category: { name: string; count: number } | null;
}

export interface Activity {
  id: number;
  type: string;
  subject_type: string;
  subject_id: number | null;
  subject_name: string;
  description: string;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface WebsiteFilters {
  search?: string;
  category_id?: number | null;
  is_favorite?: boolean | null;
  sort?: string;
  dir?: string;
  page?: number;
  per_page?: number;
}