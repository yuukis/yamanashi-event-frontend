import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  Box,
  Stack,
  HStack,
  Text,
  Button,
  IconButton,
  Input,
  Divider,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverHeader,
  PopoverCloseButton,
  PopoverBody,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { QRCodeSVG } from 'qrcode.react';
import { FiSmartphone, FiCopy, FiCheck } from 'react-icons/fi';
import { isLocalStorageAvailable, getMarkedEventsSnapshot, subscribeMarkedEvents } from '../utils/markedEventsStore';
import { createSyncCode, fetchSyncUids, mergeUidsAndNotify, SYNC_QUERY_PARAM } from '../utils/sync';
import { SITE_URL } from '../utils/site';

export function SyncButton() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [isLocalStorageOk] = useState(() => isLocalStorageAvailable());
  const markedEventsData = useSyncExternalStore(subscribeMarkedEvents, getMarkedEventsSnapshot);
  const markedCount = Object.keys(markedEventsData.records).length;

  const [isIssuing, setIsIssuing] = useState(false);
  const [issued, setIssued] = useState<{ code: string; expiresAt: string } | null>(null);
  const [issueError, setIssueError] = useState('');
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const copyFeedbackTimeoutRef = useRef<number | null>(null);

  const [redeemInput, setRedeemInput] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState('');

  useEffect(() => {
    return () => {
      if (copyFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(copyFeedbackTimeoutRef.current);
      }
    };
  }, []);

  const closePopover = () => {
    setIssued(null);
    setIssueError('');
    setIsCodeCopied(false);
    setRedeemInput('');
    setRedeemError('');
    if (copyFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(copyFeedbackTimeoutRef.current);
      copyFeedbackTimeoutRef.current = null;
    }
    onClose();
  };

  if (!isLocalStorageOk) {
    return null;
  }

  const handleIssue = async () => {
    setIsIssuing(true);
    setIssueError('');
    try {
      const uids = Object.keys(getMarkedEventsSnapshot().records);
      const result = await createSyncCode(uids);
      setIssued(result);
    } catch (err) {
      setIssueError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsIssuing(false);
    }
  };

  const handleCopyCode = () => {
    if (!issued || !navigator.clipboard?.writeText) {
      return;
    }
    navigator.clipboard.writeText(issued.code).then(() => {
      setIsCodeCopied(true);
      if (copyFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(copyFeedbackTimeoutRef.current);
      }
      copyFeedbackTimeoutRef.current = window.setTimeout(() => {
        setIsCodeCopied(false);
        copyFeedbackTimeoutRef.current = null;
      }, 1500);
    }).catch(() => {});
  };

  const handleRedeem = async () => {
    const code = redeemInput.trim();
    if (!code) {
      return;
    }
    setIsRedeeming(true);
    setRedeemError('');
    try {
      const uids = await fetchSyncUids(code);
      mergeUidsAndNotify(uids, toast);
      closePopover();
    } catch (err) {
      setRedeemError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRedeeming(false);
    }
  };

  const syncUrl = issued ? `${SITE_URL}/?${SYNC_QUERY_PARAM}=${encodeURIComponent(issued.code)}` : '';

  return (
    <Popover isOpen={isOpen} onOpen={onOpen} onClose={closePopover} placement={'bottom-end'}>
      <PopoverTrigger>
        <IconButton aria-label={'この端末の記録を引き継ぐ'} variant={'ghost'} icon={<FiSmartphone />} />
      </PopoverTrigger>
      <PopoverContent w={{ base: 'calc(100vw - 24px)', md: '360px' }}>
        <PopoverArrow />
        <PopoverHeader>
          <Text fontSize={'sm'}>他の端末と記録を引き継ぐ</Text>
        </PopoverHeader>
        <PopoverCloseButton />
        <PopoverBody>
          <Stack spacing={'4'}>
            <Stack spacing={'2'}>
              <Text fontSize={'xs'} fontWeight={'bold'} color={'gray.600'}>この端末の記録を送る</Text>
              {!issued ? (
                <>
                  <Text fontSize={'xs'} color={'gray.500'}>
                    「気になる」「行きたい」マーク({markedCount}件)を、コードまたはQRコードで他の端末に一度だけ引き継げます。
                  </Text>
                  {issueError && <Text fontSize={'xs'} color={'red.500'}>{issueError}</Text>}
                  <Button size={'sm'} onClick={handleIssue} isLoading={isIssuing} isDisabled={markedCount === 0}>
                    コードを発行する
                  </Button>
                  {markedCount === 0 && (
                    <Text fontSize={'xs'} color={'gray.400'}>引き継ぐ記録がありません</Text>
                  )}
                </>
              ) : (
                <Stack spacing={'3'} align={'center'}>
                  <Box bg={'white'} p={'3'} borderRadius={'md'} border={'1px solid'} borderColor={'gray.200'}>
                    <QRCodeSVG value={syncUrl} size={160} />
                  </Box>
                  <HStack>
                    <Text fontSize={'lg'} fontWeight={'bold'} letterSpacing={'wide'}>{issued.code}</Text>
                    <IconButton aria-label={'コードをコピー'}
                                icon={isCodeCopied ? <FiCheck /> : <FiCopy />}
                                size={'xs'}
                                variant={isCodeCopied ? 'solid' : 'outline'}
                                colorScheme={isCodeCopied ? 'green' : undefined}
                                onClick={handleCopyCode}
                                />
                  </HStack>
                  <Text fontSize={'xs'} color={'gray.500'} textAlign={'center'}>
                    別の端末のカメラでQRコードを読み取るか、コードを入力すると取り込まれます(10分間有効・一度のみ)
                  </Text>
                </Stack>
              )}
            </Stack>
            <Divider />
            <Stack spacing={'2'}>
              <Text fontSize={'xs'} fontWeight={'bold'} color={'gray.600'}>コードを受け取る</Text>
              <Text fontSize={'xs'} color={'gray.500'}>
                他の端末で発行したコードを入力すると、この端末に記録を取り込みます。
              </Text>
              {redeemError && <Text fontSize={'xs'} color={'red.500'}>{redeemError}</Text>}
              <HStack>
                <Input size={'sm'}
                       placeholder={'コードを入力'}
                       value={redeemInput}
                       onChange={(e) => setRedeemInput(e.target.value)}
                       maxLength={6}
                       />
                <Button size={'sm'} onClick={handleRedeem} isLoading={isRedeeming} isDisabled={!redeemInput.trim()}>
                  取り込む
                </Button>
              </HStack>
            </Stack>
          </Stack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
