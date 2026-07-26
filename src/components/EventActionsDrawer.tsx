import {
  Button,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  VStack,
} from '@chakra-ui/react';
import { FaXTwitter } from 'react-icons/fa6';
import { FiArchive, FiExternalLink, FiMap } from 'react-icons/fi';
import { People, Star, StarFill } from '@chakra-icons/bootstrap';
import { ShareButton } from './ShareButtons';
import { buildGroupPagePath } from '../utils/groupPage';
import type { EventWithGroup } from '../types/events';

type EventActionsDrawerProps = {
  event: EventWithGroup;
  isOpen: boolean;
  onClose: () => void;
  resetState: () => void;
  isMarked: boolean;
  attendanceMarkLabel: string;
  onMarkClick: () => void;
  nativeShareLabel: string;
  hasGroupPage: boolean;
  hasAddress: boolean;
  eventMapUrl: string;
  eventXSearchUrl: string;
  xSearchLabel: string;
  isArchiveEvent: boolean;
};

// モバイルの「その他」下から出てくるメニュー(標準/コンパクト/グリッド共通)。
export function EventActionsDrawer({
  event,
  isOpen,
  onClose,
  resetState,
  isMarked,
  attendanceMarkLabel,
  onMarkClick,
  nativeShareLabel,
  hasGroupPage,
  hasAddress,
  eventMapUrl,
  eventXSearchUrl,
  xSearchLabel,
  isArchiveEvent,
}: EventActionsDrawerProps) {
  return (
    <Drawer placement="bottom"
            isOpen={isOpen}
            onClose={() => {
              resetState();
              onClose();
            }}
            >
      <DrawerOverlay />
      <DrawerContent pb={6}
                     borderTopRadius="xl"
                     animation="slide-up"
                     >
        <DrawerHeader textAlign="center"
                      borderBottomWidth="1px"
                      >
          { event.title }
        </DrawerHeader>
        <DrawerBody>
          <VStack spacing={2}>
            <Button w="full"
                    leftIcon={isMarked ? <StarFill /> : <Star />}
                    colorScheme={isMarked ? 'yellow' : 'gray'}
                    onClick={onMarkClick}
                    >
              { attendanceMarkLabel }
            </Button>
            <ShareButton event={event} onAfterAction={onClose} label={nativeShareLabel} />
            <Button w="full"
                    leftIcon={<FiExternalLink />}
                    onClick={() => {
                      window.open(event.event_url);
                      onClose();
                    }}
                    >
              情報提供元のページを開く
            </Button>
            {hasGroupPage && (
              <Button w="full"
                      leftIcon={<People />}
                      onClick={() => {
                        window.open(buildGroupPagePath(event.group_key!), '_self');
                        onClose();
                      }}
                      >
                コミュニティページを見る
              </Button>
            )}
            {hasAddress && (
              <Button w="full"
                      leftIcon={<FiMap />}
                      onClick={() => {
                        window.open(eventMapUrl);
                        onClose();
                      }}
                      >
                マップで会場を見る
              </Button>
            )}
            <Button w="full"
                    leftIcon={<FaXTwitter />}
                    onClick={() => {
                      window.open(eventXSearchUrl);
                      onClose();
                    }}
                    >
              { xSearchLabel }
            </Button>
            {isArchiveEvent && event.archive_url && (
              <Button w="full"
                      leftIcon={<FiArchive />}
                      onClick={() => {
                        window.open(event.archive_url!);
                        onClose();
                      }}
                      >
                アーカイブ元を開く
              </Button>
            )}
            <Button w="full"
                    colorScheme="red"
                    onClick={onClose}
                    >
              キャンセル
            </Button>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
