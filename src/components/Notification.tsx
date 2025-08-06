import { useState, useEffect } from "react";
import { useDisclosure } from "@chakra-ui/react";
import { BellFill, BellSlash } from '@chakra-icons/bootstrap';
import {
  Stack,
  Spacer,
  Text,
  Button,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverHeader,
  PopoverCloseButton,
  PopoverBody,
  PopoverFooter
} from '@chakra-ui/react';

export function NotificationButton() {

  const [isNotifyAvailable, setIsNotifyAvailable] = useState(false);
  const VAPID = import.meta.env.VITE_PUBLIC_VAPID_KEY as string;
  const API_URL = import.meta.env.VITE_SUBSCRIPTION_API_URL as string;
  const { isOpen, onOpen, onClose } = useDisclosure();

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

  return (
    <Popover isOpen={isOpen} onOpen={onOpen} onClose={onClose}>
      <PopoverTrigger>
        <IconButton
          aria-label='Notification'
          variant={'ghost'}
          icon={isNotifyAvailable ? <BellFill /> : <BellSlash />}
          onClick={onOpen}
        />
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverHeader>
          <Text fontSize={'sm'}>
            新着イベント通知（開発中）
          </Text>
        </PopoverHeader>
        <PopoverCloseButton />
        <PopoverBody>
          <Stack>
            <Text fontSize={'xs'}>
              新しくイベントが登録されたら通知します<br />
              （お使いの環境によっては、通知が正しく動作しない場合があります）
            </Text>
          </Stack>
        </PopoverBody>
        <PopoverFooter>
          <Button w={'100%'} variant={'ghost'} size={'sm'} onClick={handleNotifyButtonClick}>
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
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  );
}
