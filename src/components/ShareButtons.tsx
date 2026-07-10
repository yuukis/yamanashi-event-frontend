import { HStack, IconButton, Button, useToast } from '@chakra-ui/react';
import type { IconType } from 'react-icons';
import { FaXTwitter, FaLine, FaFacebook, FaLink } from 'react-icons/fa6';
import {
  buildEventShareUrl,
  buildXShareUrl,
  buildLineShareUrl,
  buildFacebookShareUrl,
  buildShareClipboardText,
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
  { id: 'line', label: 'LINEでシェア', icon: FaLine, buildUrl: buildLineShareUrl },
  { id: 'facebook', label: 'Facebookでシェア', icon: FaFacebook, buildUrl: buildFacebookShareUrl },
];

const COPY_LABEL = 'リンクをコピー';

function toShareContext(event: EventWithGroup): ShareContext {
  return {
    title: event.title,
    url: buildEventShareUrl(event.uid),
    hashTag: event.hash_tag,
  };
}

export function ShareIconRow({ event }: { event: EventWithGroup }) {
  const ctx = toShareContext(event);
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
      <IconButton aria-label={COPY_LABEL}
                  icon={<FaLink />}
                  size={'xs'}
                  variant={'ghost'}
                  color={'gray.400'}
                  _hover={{ color: 'gray.600' }}
                  onClick={() => copyEventLink(ctx, toast)}
                  />
    </HStack>
  );
}

type ShareMenuButtonsProps = {
  event: EventWithGroup;
  onAfterAction?: () => void;
};

export function ShareMenuButtons({ event, onAfterAction }: ShareMenuButtonsProps) {
  const ctx = toShareContext(event);
  const toast = useToast();

  const handleCopy = () => copyEventLink(ctx, toast, onAfterAction);

  return (
    <>
      {SHARE_TARGETS.map(({ id, label, icon: Icon, buildUrl }) => (
        <Button key={id}
                w="full"
                leftIcon={<Icon />}
                onClick={() => {
                  window.open(buildUrl(ctx));
                  onAfterAction?.();
                }}
                >
          { label }
        </Button>
      ))}
      <Button w="full"
              leftIcon={<FaLink />}
              onClick={handleCopy}
              >
        { COPY_LABEL }
      </Button>
    </>
  );
}

function copyEventLink(ctx: ShareContext, toast: ReturnType<typeof useToast>, onAfterAction?: () => void): void {
  navigator.clipboard.writeText(buildShareClipboardText(ctx))
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
