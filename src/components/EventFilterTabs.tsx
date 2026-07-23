import { Tabs, TabList, Tab, TabPanels, TabPanel, Icon } from '@chakra-ui/react';
import { FiUsers, FiTag, FiMapPin } from 'react-icons/fi';
import { GroupSelector, type GroupSelectorItem } from './GroupSelector';
import { ChipBar } from './ChipBar';
import { AREA_LABELS, type AreaKey } from '../utils/eventAreas';

type EventFilterTabsProps = {
  selectedGroup: string | null;
  selectedKeyword: string | null;
  selectedArea: AreaKey | null;
  onGroupSelect: (key: string | null) => void;
  onKeywordSelect: (keyword: string | null) => void;
  onAreaSelect: (area: string | null) => void;
  groupSelectorItems: GroupSelectorItem[];
  keywordCounts: [string, number][];
  areaCounts: [AreaKey, number][];
  isLoading: boolean;
  errorMessage: string;
  showGroupBadges: boolean;
};

export function EventFilterTabs({
  selectedGroup,
  selectedKeyword,
  selectedArea,
  onGroupSelect,
  onKeywordSelect,
  onAreaSelect,
  groupSelectorItems,
  keywordCounts,
  areaCounts,
  isLoading,
  errorMessage,
  showGroupBadges,
}: EventFilterTabsProps) {
  return (
    <Tabs key={selectedArea ? 'area' : selectedKeyword ? 'keyword' : 'community'}
          variant={'line'} size={'sm'}
          defaultIndex={selectedArea ? 2 : selectedKeyword ? 1 : 0}
          >
      <TabList px={{base: '4', md: '0'}}>
        <Tab _selected={{ color: 'impact.700', borderColor: 'impact.500' }}>
          <Icon as={FiUsers} display={{base: 'none', md: 'inline'}} mr={'2'} />
          コミュニティで絞る
        </Tab>
        <Tab _selected={{ color: 'primary.800', borderColor: 'primary.500' }}>
          <Icon as={FiTag} display={{base: 'none', md: 'inline'}} mr={'2'} />
          キーワードで絞る
        </Tab>
        <Tab _selected={{ color: 'secondary.900', borderColor: 'secondary.700' }}>
          <Icon as={FiMapPin} display={{base: 'none', md: 'inline'}} mr={'2'} />
          エリアで絞る
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel px={0} pt={{base: '0', md: '3'}} pb={0}>
          <GroupSelector groups={groupSelectorItems}
                          selected={selectedGroup}
                          onSelect={onGroupSelect}
                          isLoading={isLoading}
                          showBadges={showGroupBadges}
                          />
        </TabPanel>
        <TabPanel px={0} pt={{base: '0', md: '3'}} pb={0}>
          {!isLoading && !errorMessage && (
            <ChipBar items={keywordCounts.map(([keyword]) => ({ value: keyword, label: keyword }))}
                     selected={selectedKeyword}
                     onSelect={onKeywordSelect}
                     />
          )}
        </TabPanel>
        <TabPanel px={0} pt={{base: '0', md: '3'}} pb={0}>
          {!isLoading && !errorMessage && (
            <ChipBar items={areaCounts.map(([area, count]) => ({
                              value: area,
                              label: `${AREA_LABELS[area]} (${count})`,
                              disabled: count === 0 && selectedArea !== area,
                            }))}
                     selected={selectedArea}
                     onSelect={onAreaSelect}
                     />
          )}
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
