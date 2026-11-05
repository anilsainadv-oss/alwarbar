export interface ForumCategory {
  id: string;
  slug: string;
  name_en: string;
  name_hi: string;
  description_en?: string;
  description_hi?: string;
  icon: string;
  sort_order: number;
  post_count?: number;
}

export interface ForumPost {
  id: string;
  category_id: string;
  category_slug?: string;
  category_name_en?: string;
  category_name_hi?: string;
  user_id: string;
  author_name: string;
  author_enrollment?: string;
  author_verified?: boolean;
  title: string;
  content: string;
  language: 'hi' | 'en' | 'mixed';
  upvotes: number;
  replies_count: number;
  is_pinned: boolean;
  is_hidden: boolean;
  created_at: string;
}

export interface ForumReply {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string;
  author_enrollment?: string;
  author_verified?: boolean;
  content: string;
  is_accepted_answer: boolean;
  upvotes: number;
  created_at: string;
}

export interface ForumReport {
  id: string;
  post_id?: string;
  reply_id?: string;
  reporter_id: string;
  reporter_name?: string;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  item_title?: string;
  created_at: string;
}
