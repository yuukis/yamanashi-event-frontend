export type ApiEvent = {
  uid: string;
  event_id: number | null;
  title: string;
  catch?: string | null;
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
};

export type ApiGroup = {
  key: string;
  title: string;
  image_url?: string | null;
  archive_source?: string | null;
  archive_url?: string | null;
};

export type EventWithGroup = ApiEvent & {
  group_image_url?: string | null;
  archive_source?: string | null;
  archive_url?: string | null;
};
