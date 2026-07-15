import { Box, Button, Textarea, useToast } from '@chakra-ui/react';
import { FiCopy } from 'react-icons/fi';

type CopySnippetBlockProps = {
  code: string;
  label?: string;
};

export function CopySnippetBlock({ code, label = '埋め込み用スニペット' }: CopySnippetBlockProps) {
  const toast = useToast();

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(code);
      toast({ title: 'コピーしました', status: 'success', duration: 2000, isClosable: true });
    } catch {
      toast({ title: 'コピーに失敗しました', status: 'error', duration: 2000, isClosable: true });
    }
  };

  return (
    <Box position={'relative'}>
      <Textarea value={code}
                isReadOnly
                aria-label={label}
                spellCheck={false}
                fontFamily={'mono'}
                fontSize={'xs'}
                rows={code.split('\n').length}
                resize={'none'}
                bg={'gray.50'}
                pr={'24'}
                onFocus={(e) => e.target.select()}
                />
      <Button size={'xs'}
              position={'absolute'}
              top={'2'}
              right={'2'}
              leftIcon={<FiCopy />}
              onClick={handleCopy}
              >
        コピー
      </Button>
    </Box>
  );
}
