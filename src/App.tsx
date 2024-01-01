import './style.css';
import {
  Container,
  Box,
  Stack,
  HStack,
  StackDivider,
  Spacer,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Button
} from '@chakra-ui/react';
import {
  Hash,
  GeoAlt,
  Person,
  ChevronRight,
  Calendar2EventFill
} from '@chakra-icons/bootstrap';

function App() {
  return (
    <Box bg={'gray.100'} w={'100vw'} minH={'100vh'}>
      <Container maxW={'800px'} w={'100%'}>
        <Box p={'4'} mb={'8'}>
          <Heading size={'md'}>
            やまなし IT勉強会イベントカレンダー
          </Heading>
        </Box>
        <Stack spacing={'4'}>
          <Card variant={'outline'}>
            <CardHeader>
              <Stack direction={'row'} spacing={'2'}>
                <Calendar2EventFill />
                <Heading size={'sm'}>
                  直近開催イベント
                </Heading>
              </Stack>
            </CardHeader>
            
            <CardBody>
              <Stack divider={<StackDivider />}>
                <Box p={'2'}>
                  <HStack>
                    <Box w={'20%'} textAlign={'center'}>
                      <HStack spacing={'0'} justifyContent={'center'}>
                        <Text fontSize={'3rem'} fontWeight={'bold'} letterSpacing={'0.1rem'}>
                          12
                        </Text>
                        <Text fontSize={'3rem'} fontWeight={'light'} letterSpacing={'0.1rem'}>
                          /2
                        </Text>
                      </HStack>
                      <Text fontSize={'lg'}>(土) 15:00-</Text>
                    </Box>
                    <Box w={'80%'}>
                      <Heading fontSize={'1rem'}>
                        おいでなって！ビルド山梨
                      </Heading>
                      <Text fontSize={'sm'}>ビルド山梨</Text>
                      <Stack p={'2'}>
                        <HStack alignItems={'flex-start'}>
                          <GeoAlt />
                          <Text fontSize={'sm'}>山梨県甲府市中央4丁目3-20<br />コットンクラブ</Text>
                        </HStack>
                        <HStack>
                          <Person />
                          <Text fontSize={'sm'}>YoshikazuNagai</Text>
                        </HStack>
                      </Stack>
                    </Box>
                  </HStack>
                </Box>
                <Box p={'2'}>
                  <HStack>
                    <Box w={'20%'} textAlign={'center'}>
                      <HStack spacing={'0'} justifyContent={'center'}>
                        <Text fontSize={'3rem'} fontWeight={'bold'} letterSpacing={'0.1rem'}>
                          1
                        </Text>
                        <Text fontSize={'3rem'} fontWeight={'light'} letterSpacing={'0.1rem'}>
                          /28
                        </Text>
                      </HStack>
                      <Text fontSize={'lg'}>(日) 13:00-</Text>
                    </Box>
                    <Box w={'80%'}>
                      <Heading fontSize={'1rem'}>
                        [Shingen.py] ワイン産地を支える! Pythonで山梨の気象データ分析とWeb公開
                      </Heading>
                      <Text fontSize={'sm'}>この勉強会はAIによって生成されました</Text>
                      <HStack mt={'2'}>
                        <Stack p={'2'}>
                          <HStack>
                            <Hash />
                            <Text fontSize={'sm'}>Python</Text>
                            <Text fontSize={'sm'}>Django</Text>
                            <Text fontSize={'sm'}>Numpy</Text>
                            <Text fontSize={'sm'}>ワイン</Text>
                          </HStack>
                          <HStack alignItems={'flex-start'}>
                            <GeoAlt />
                            <Text fontSize={'sm'}>山梨県甲府市北口2丁目8番1号<br />山梨県立図書館 交流ルーム 102 号室</Text>
                          </HStack>
                          <HStack>
                            <Person />
                            <Button size={'xs'}>shingen.py</Button>
                          </HStack>
                        </Stack>
                        <Spacer />
                        <Button size={'lg'} colorScheme='red' alignSelf={'flex-end'}>
                          <HStack>
                            <ChevronRight />
                            <Text letterSpacing={'0.2rem'}>詳細</Text>
                          </HStack>
                        </Button>
                      </HStack>
                    </Box>
                  </HStack>
                </Box>
              </Stack>
            </CardBody>
          </Card>

          <Card variant={'outline'}>
            <CardHeader>
              <Heading size={'sm'}>
                終了したイベント
              </Heading>
            </CardHeader>
            
            <CardBody>
              <Stack divider={<StackDivider />}>
                <Box p={'2'}>
                  <HStack>
                    <Box w={'20%'} textAlign={'center'}>
                      <HStack spacing={'0'} justifyContent={'center'}>
                        <Text fontSize={'3rem'} fontWeight={'bold'} letterSpacing={'0.1rem'}>
                          11
                        </Text>
                        <Text fontSize={'3rem'} fontWeight={'light'} letterSpacing={'0.1rem'}>
                          /23
                        </Text>
                      </HStack>
                      <Text fontSize={'lg'}>(木) 20:00-</Text>
                    </Box>
                    <Box w={'80%'}>
                      <Heading fontSize={'1rem'}>
                        第23回 富士もくもく会（オンライン）
                      </Heading>
                      <HStack mt={'2'}>
                        <Stack p={'2'}>
                          <HStack>
                            <Person />
                            <Button size={'xs'}>富士もくもく会</Button>
                          </HStack>
                        </Stack>
                        <Spacer />
                        <Button size={'lg'} colorScheme='red' alignSelf={'flex-end'}>
                          <HStack>
                            <ChevronRight />
                            <Text letterSpacing={'0.2rem'}>詳細</Text>
                          </HStack>
                        </Button>
                      </HStack>
                    </Box>
                  </HStack>
                </Box>
              </Stack>
            </CardBody>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}

export default App;
