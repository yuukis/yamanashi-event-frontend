import { useEffect } from 'react';

type StructuredDataProps = {
  id: string;
  data: Record<string, unknown> | null;
};

export function StructuredData({ id, data }: StructuredDataProps) {
  const json = data ? JSON.stringify(data) : null;

  useEffect(() => {
    if (!json) {
      return;
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.text = json;
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [id, json]);

  return null;
}
