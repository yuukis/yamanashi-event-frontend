import { useState, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useDisclosure } from "@chakra-ui/react";
import { BellFill, BellSlash, Trash3 } from '@chakra-icons/bootstrap';
import {
  Box,
  Stack,
  HStack,
  Spacer,
  Text,
  Button,
  IconButton,
  Divider,
  Link,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverHeader,
  PopoverCloseButton,
  PopoverBody,
  PopoverFooter
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { isIOS } from 'react-device-detect';
import { fetchEvents } from '../utils/api';
import { isFutureEvent } from '../utils/eventGroups';
import { sortByStartedAtAsc } from '../utils/eventSort';
import { subscribeNow, getNow } from '../utils/nowTicker';
import { getEventAnchorId } from '../utils/eventAnchors';
import { jumpToAnchor } from '../utils/hashScroll';
import {
  acknowledgeNewEventDot,
  dismissNewEvents,
  mergeTrackingData,
  selectNewEventUids,
  selectUnacknowledgedNewEventUids,
} from '../utils/newEventTracking';
import {
  isLocalStorageAvailable,
  subscribeTrackingData,
  getTrackingDataSnapshot,
  updateTrackingData,
} from '../utils/newEventTrackingStore';
import { X_ACCOUNT_URL } from '../utils/site';
import type { ApiEvent } from '../types/events';

const DAY_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土'];

function formatNewEventStartLabel(startedAt: string): string {
  const date = new Date(startedAt);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dow = DAY_OF_WEEK[date.getDay()];
  const hours = date.getHours();
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${month}/${day}(${dow}) ${hours}:${minutes}〜`;
}

export function NotificationButton() {

  const [isNotifyAvailable, setIsNotifyAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const VAPID = import.meta.env.VITE_PUBLIC_VAPID_KEY as string;
  const API_URL = import.meta.env.VITE_SUBSCRIPTION_API_URL as string;
  const { isOpen, onOpen: openDisclosure, onClose: closeDisclosure } = useDisclosure();

  const [isLocalStorageOk] = useState(() => isLocalStorageAvailable());
  const trackingData = useSyncExternalStore(subscribeTrackingData, getTrackingDataSnapshot);
  const now = useSyncExternalStore(subscribeNow, getNow);
  const [events, setEvents] = useState<ApiEvent[]>([]);

  const isUnmountedRef = useRef(false);

  useEffect(() => {
    isUnmountedRef.current = false;

    fetchEvents()
      .then((res) => {
        if (!isUnmountedRef.current) {
          setEvents(res.events);
        }
      })
      .catch(() => {
        // 新着一覧が空のまま表示されるだけなので、取得失敗時は何もしない
      });

    return () => {
      isUnmountedRef.current = true;
    };
  }, []);

  const candidateEvents = useMemo(() => events.filter(isFutureEvent), [events]);

  useEffect(() => {
    if (!isLocalStorageOk || candidateEvents.length === 0) {
      return;
    }

    // 60秒ごとのnowティックでは書き込みが走らないよう、依存配列にnowを
    // 含めない(candidateEvents/isLocalStorageOkが変わった時だけ実行)。
    updateTrackingData((previous) => mergeTrackingData(previous, candidateEvents, now));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateEvents, isLocalStorageOk]);

  const newEvents = useMemo(() => {
    const uids = selectNewEventUids(trackingData, candidateEvents, now);
    return candidateEvents.filter((event) => uids.has(event.uid)).sort(sortByStartedAtAsc);
  }, [trackingData, candidateEvents, now]);

  const unacknowledgedUids = useMemo(
    () => selectUnacknowledgedNewEventUids(trackingData, newEvents.map((event) => event.uid)),
    [trackingData, newEvents],
  );
  const hasDot = isLocalStorageOk && unacknowledgedUids.size > 0;

  const onOpen = () => {
    if (isLocalStorageOk && candidateEvents.length > 0) {
      updateTrackingData((previous) => mergeTrackingData(previous, candidateEvents, now));
    }
    openDisclosure();
  };

  // 開いた瞬間ではなく閉じたタイミングでacknowledgeし、ベル・項目の
  // ドットを消す(開いている間は見ている本人にドットを見せ続ける)。
  const onClose = () => {
    if (isLocalStorageOk && candidateEvents.length > 0) {
      updateTrackingData((previous) => {
        const newUids = [...selectNewEventUids(previous, candidateEvents, now)];
        return newUids.length > 0 ? acknowledgeNewEventDot(previous, newUids) : previous;
      });
    }
    closeDisclosure();
  };

  const handleClearNewEvents = () => {
    const uids = newEvents.map((event) => event.uid);
    if (uids.length === 0) {
      return;
    }
    updateTrackingData((previous) => acknowledgeNewEventDot(dismissNewEvents(previous, uids), uids));
  };

  const sendSubscriptionToServer = (subscription: PushSubscription) => {
    return fetch(`${API_URL}/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    }).then(function (response) {
      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }
      return response.json();
    });
  };

  const removeSubscriptionFromServer = (subscription: PushSubscription) => {
    return fetch(`${API_URL}/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });
  };

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const subscription = await registration.pushManager.getSubscription();
        setIsNotifyAvailable(!!subscription);
      });
    }
  }, []);

  const handleNotifyButtonClick = async () => {
    setIsLoading(true);
    try {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        alert('このブラウザは通知に対応していません');
        return;
      }

      if (!isNotifyAvailable) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('通知が許可されませんでした');
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID),
        });

        await sendSubscriptionToServer(subscription);
        setIsNotifyAvailable(true);
      } else {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await removeSubscriptionFromServer(subscription);
          await subscription.unsubscribe();
        }
        setIsNotifyAvailable(false);
      }
      onClose();

    } finally {
      setIsLoading(false);
    }
  };

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const isNotifyAvailableOnIOS = isIOS && (window.navigator as any).standalone;

  return (
    <Popover isOpen={isOpen} onOpen={onOpen} onClose={onClose} placement='bottom-end'>
      <PopoverTrigger>
        <IconButton
          aria-label={hasDot ? '新着イベントの通知があります' : 'Notification'}
          variant={'ghost'}
          icon={isNotifyAvailable ? <BellFill /> : <BellSlash />}
          position={'relative'}
          _after={hasDot ? {
            content: '""',
            position: 'absolute',
            top: '6px',
            right: '6px',
            w: '8px',
            h: '8px',
            borderRadius: 'full',
            bg: 'purple.500',
            border: '2px solid white',
          } : undefined}
        />
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverHeader>
          <HStack spacing={'2'} pr={'8'}>
            <Text fontSize={'sm'} flex={'1'}>
              新着イベント
            </Text>
            {isLocalStorageOk && (
              <IconButton aria-label='新着通知をクリア'
                          icon={<Trash3 />}
                          size={'xs'}
                          variant={'outline'}
                          isDisabled={newEvents.length === 0}
                          onClick={handleClearNewEvents}
                          />
            )}
          </HStack>
        </PopoverHeader>
        <PopoverCloseButton />
        <PopoverBody>
          <Stack spacing={'3'}>
            {isLocalStorageOk && (
              <Stack spacing={'1'} maxH={'240px'} overflowY={'auto'} overflowX={'hidden'}>
                {newEvents.length === 0 ? (
                  <Text fontSize={'xs'} color={'gray.500'} textAlign={'center'} py={'6'}>新着イベントはありません</Text>
                ) : (
                  newEvents.map((event) => (
                    <Button key={event.uid} variant={'ghost'} justifyContent={'flex-start'}
                            size={'sm'} h={'auto'} py={'1'} w={'full'}
                            whiteSpace={'normal'}
                            onClick={() => {
                              jumpToAnchor(getEventAnchorId(event.uid));
                              onClose();
                            }}
                            >
                      <Stack spacing={'0'} align={'flex-start'} w={'full'} minW={0}>
                        <Text fontSize={'xs'} color={'gray.500'}>{formatNewEventStartLabel(event.started_at)}</Text>
                        <Box position={'relative'} w={'full'}>
                          {unacknowledgedUids.has(event.uid) && (
                            // テキストの流れに含めずボタンの左パディング内に絶対
                            // 配置することで、有無によるタイトルの位置ずれを防ぐ。
                            <Box position={'absolute'} left={'-9px'} top={'7px'}
                                 w={'6px'} h={'6px'} borderRadius={'full'}
                                 bg={'purple.500'} aria-hidden
                                 data-testid={`new-event-dot-${event.uid}`}
                                 />
                          )}
                          <Text fontSize={'sm'} textAlign={'left'} wordBreak={'break-word'}>{event.title}</Text>
                        </Box>
                      </Stack>
                    </Button>
                  ))
                )}
              </Stack>
            )}
            {isLocalStorageOk && <Divider />}
            <Stack spacing={'1'}>
              <Text fontSize={'sm'} fontWeight={'bold'}>Webプッシュ通知</Text>
              <Text fontSize={'xs'}>
                新しくイベントが登録されたら通知します<br />
                （お使いの環境によっては、通知が正しく動作しない場合があります）
              </Text>
              <Text fontSize={'xs'} pt={'1'}>
                X(
                <Link color={'primary.800'} href={X_ACCOUNT_URL} isExternal>
                  @ymns_tech_event<ExternalLinkIcon mx={'2px'} />
                </Link>
                )でも新着イベントを配信しています。
              </Text>
            </Stack>
          </Stack>
        </PopoverBody>
        <PopoverFooter>
          {!isIOS || isNotifyAvailableOnIOS ? (
            <Button w={'100%'} variant={'ghost'} size={'sm'}
                    onClick={handleNotifyButtonClick}
                    isLoading={isLoading}
            >
              {isNotifyAvailable ? (
                <>
                  <BellSlash mr={'2'} />
                  <Text fontWeight={'normal'}>通知を解除する</Text>
                </>
              ) : (
                <>
                  <BellFill mr={'2'} />
                  <Text fontWeight={'normal'}>通知を受け取る</Text>
                </>
              )}
              <Spacer />
            </Button>
          ) : (
            <Text fontSize={'xs'} color={'red.500'}>
              ブラウザの共有メニューから「ホーム画面に追加」を行うと、通知が有効になります
            </Text>
          )}
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  );
}
