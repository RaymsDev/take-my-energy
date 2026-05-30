import { HealthAndBeautyBusiness, Service, WithContext } from 'schema-dts';
import { SITE_CONFIG } from '../configs';
import { Healthcare } from '../models/healthcare.model';

const principalPlace: Service['areaServed'] = {
  '@type': 'Place',
  name: '5 DE CŒUR - Magnétiseur & Bien-être',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '7 Rue Haute',
    addressLocality: '21270 Saint-Léger-Triey',
    postalCode: '21270',
    addressCountry: 'FR',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 47.3147725,
    longitude: 5.3613172,
  },
  hasMap: 'https://maps.app.goo.gl/D8ptQFEUPZfaFJ467',
};

export function createService(
  healthcares: Healthcare[],
  originUrl: string,
): WithContext<HealthAndBeautyBusiness> {
  return {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    name: '5 DE CŒUR',
    image: {
      '@type': 'ImageObject',
      url: `${originUrl}/assets/meta/landscape.webp`,
      image: `${originUrl}/assets/meta/landscape.webp`,
      width: {
        '@type': 'QuantitativeValue',
        value: 1200,
      },
      height: {
        '@type': 'QuantitativeValue',
        value: 628,
      },
    },
    description: 'Massage holistique, Bien-être & Soin énergétique.',
    priceRange: '€€',
    address: (principalPlace as any).address,
    areaServed: principalPlace,
    telephone: atob(SITE_CONFIG['PHONE']),
    email: atob(SITE_CONFIG['EMAIL']),
    url: originUrl,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Liste des services',
      itemListElement: healthcares
        .map((item) => {
          const product = item.products['Saint Léger Triey'];

          if (product === undefined || product.price === 'Sur devis') {
            return undefined;
          }

          return {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: item.title,
              description: item.description,
              image: `${originUrl}/${item.img}`,
              audience: {
                '@type': 'Audience',
                audienceType: item.audience,
              },
            },
            price: product.price.value,
            priceCurrency: product.price.currency,
            eligibleDuration: {
              '@type': 'QuantitativeValue',
              value: item.duration.value,
              unitText: item.duration.unitText,
            },
            areaServed: principalPlace,
          } as any;
        })
        .filter((item) => item !== undefined),
    },
  };
}
