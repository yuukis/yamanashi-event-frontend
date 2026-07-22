import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, Container } from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { House } from '@chakra-icons/bootstrap';
import { StructuredData } from './StructuredData';
import { buildBreadcrumbJsonLd } from '../utils/structuredData';
import { SITE_URL } from '../utils/site';

export type PageBreadcrumbItem = {
  label: string;
  href: string;
};

const HOME_ITEM: PageBreadcrumbItem = { label: 'トップ', href: '/' };

export function PageBreadcrumb({ items }: { items: PageBreadcrumbItem[] }) {
  const allItems = [HOME_ITEM, ...items];
  const structuredData = buildBreadcrumbJsonLd(
    allItems.map((item) => ({ name: item.label, url: `${SITE_URL}${item.href}` })),
  );

  return (
    <>
      <StructuredData id={'structured-data-breadcrumb'} data={structuredData} />
      <Container maxW={'980px'} w={'100%'} px={{base: '4', md: '4'}} pt={{base: '3', md: '4'}}>
        <Breadcrumb spacing={'1'}
                    separator={<ChevronRightIcon color={'gray.400'} />}
                    fontSize={'xs'}
                    >
          {allItems.map((item, index) => {
            const isCurrentPage = index === allItems.length - 1;
            return (
              <BreadcrumbItem key={item.href} isCurrentPage={isCurrentPage}>
                <BreadcrumbLink href={item.href}
                                color={isCurrentPage ? 'gray.600' : 'gray.500'}
                                fontWeight={isCurrentPage ? 'medium' : 'normal'}
                                textDecoration={isCurrentPage ? 'none' : 'underline'}
                                _hover={{color: 'primary.800'}}
                                noOfLines={1}
                                >
                  {index === 0 ? (
                    <>
                      <House verticalAlign={'-2px'} mr={'1'} />
                      {item.label}
                    </>
                  ) : (
                    item.label
                  )}
                </BreadcrumbLink>
              </BreadcrumbItem>
            );
          })}
        </Breadcrumb>
      </Container>
    </>
  );
}
