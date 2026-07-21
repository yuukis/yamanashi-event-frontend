export type ApiEvent = {
  uid: string;
  title: string;
  catch?: string | null;
  description?: string | null;
  hash_tag?: string | null;
  event_url: string;
  started_at: string;
  ended_at: string;
  updated_at: string;
  open_status: string;
  owner_name?: string | null;
  place?: string | null;
  address?: string | null;
  group_key?: string | null;
  group_name?: string | null;
  group_url?: string | null;
  keywords?: string[] | null;
  image_url?: string | null;
  source?: 'connpass' | 'icalendar' | 'archive' | null;
};

export type ApiGroup = {
  key: string;
  title: string;
  sub_title?: string | null;
  image_url?: string | null;
  member_users_count?: number | null;
  archive_source?: string | null;
  archive_url?: string | null;
};

export type ApiGroupDetail = ApiGroup & {
  url?: string | null;
  description?: string | null;
  website_url?: string | null;
  x_username?: string | null;
  facebook_url?: string | null;
};

export type EventWithGroup = ApiEvent & {
  group_image_url?: string | null;
  archive_source?: string | null;
  archive_url?: string | null;
  is_registered_group?: boolean;
};

export type ApiGroupActivity = {
  key: string;
  name?: string | null;
  image_url?: string | null;
  url?: string | null;
  event_count: number;
};

export type ApiYearSummary = {
  year: number;
  event_count: number;
  groups: ApiGroupActivity[];
};

export type ApiHeatmapBucket = {
  period: string;
  count: number;
};

export type ApiEventsSummary = {
  from_year: number;
  to_year: number;
  granularity: string;
  years: ApiYearSummary[];
  heatmap: ApiHeatmapBucket[];
};
