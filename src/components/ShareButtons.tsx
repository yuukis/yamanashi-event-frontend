import { HStack, IconButton, Button, useToast } from '@chakra-ui/react';
import type { IconType } from 'react-icons';
import { FaXTwitter, FaLink } from 'react-icons/fa6';
import { FiShare2 } from 'react-icons/fi';
import {
  buildXShareUrl,
  toEventShareContext,
  isNativeShareSupported,
  shareEventViaNativeShare,
  type ShareContext,
} from '../utils/share';
import type { EventWithGroup } from '../types/events';

type ShareTarget = {
  id: string;
  label: string;
  icon: IconType;
  buildUrl: (ctx: ShareContext) => string;
};

const SHARE_TARGETS: ShareTarget[] = [
  { id: 'x', label: 'X(Twitter)でシェア', icon: FaXTwitter, buildUrl: buildXShareUrl },
];

const COPY_LABEL = 'リンクをコピー';
const NATIVE_SHARE_LABEL = '友達を誘う';

export function ShareIconRow({ event }: { event: EventWithGroup }) {
  const ctx = toEventShareContext(event);
  const toast = useToast();

  return (
    <HStack spacing={'1'} mt={'1'}>
      {SHARE_TARGETS.map(({ id, label, icon: Icon, buildUrl }) => (
        <IconButton key={id}
                    aria-label={label}
                    icon={<Icon />}
                    size={'xs'}
                    variant={'ghost'}
                    color={'gray.400'}
                    _hover={{ color: 'gray.600' }}
                    onClick={() => window.open(buildUrl(ctx))}
                    />
      ))}
      {isNativeShareSupported() && (
        <IconButton aria-label={NATIVE_SHARE_LABEL}
                    icon={<FiShare2 />}
                    size={'xs'}
                    variant={'ghost'}
                    color={'gray.400'}
                    _hover={{ color: 'gray.600' }}
                    onClick={() => shareEventViaNativeShare(event, toast)}
                    />
      )}
      <IconButton aria-label={COPY_LABEL}
                  icon={<FaLink />}
                  size={'xs'}
                  variant={'ghost'}
                  color={'gray.400'}
                  _hover={{ color: 'gray.600' }}
                  onClick={() => copyEventLink(ctx.url, toast)}
                  />
    </HStack>
  );
}

export function XShareButton({ event }: { event: EventWithGroup }) {
  const ctx = toEventShareContext(event);

  return (
    <Button w="full"
            leftIcon={<FaXTwitter />}
            onClick={() => window.open(buildXShareUrl(ctx))}
            >
      X(Twitter)でシェア
    </Button>
  );
}

type ShareButtonProps = {
  event: EventWithGroup;
  onAfterAction?: () => void;
};

export function ShareButton({ event, onAfterAction }: ShareButtonProps) {
  const toast = useToast();

  if (!isNativeShareSupported()) {
    return null;
  }

  return (
    <Button w="full"
            leftIcon={<FiShare2 />}
            onClick={() => shareEventViaNativeShare(event, toast, onAfterAction)}
            >
      { NATIVE_SHARE_LABEL }
    </Button>
  );
}

function copyEventLink(url: string, toast: ReturnType<typeof useToast>, onAfterAction?: () => void): void {
  if (!navigator.clipboard?.writeText) {
    toast({ title: 'コピーに失敗しました', status: 'error', duration: 2000, isClosable: true });
    onAfterAction?.();
    return;
  }

  navigator.clipboard.writeText(url)
    .then(() => {
      toast({ title: 'リンクをコピーしました', status: 'success', duration: 2000, isClosable: true });
    })
    .catch(() => {
      toast({ title: 'コピーに失敗しました', status: 'error', duration: 2000, isClosable: true });
    })
    .finally(() => {
      onAfterAction?.();
    });
}
