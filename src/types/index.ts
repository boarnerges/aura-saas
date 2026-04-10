export interface Link {
  id: string;
  created_at: string;
  title: string;
  url: string;
  user_id: string;
  icon_name?: string;
}

export interface Profile {
  clerk_id: string;
  display_name: string;
  bio: string;
  theme: string;
  avatar_url: string | null;
  username: string;
}