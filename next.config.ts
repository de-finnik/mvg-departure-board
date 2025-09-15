import type { NextConfig } from "next";

export default {
  async redirects() {
    return [
      {
        source: '/glh',
        destination: '/board?station=de%3A09162%3A430&amount=5&theme=dark&include=U*%3A*&exclude=U6%3AFr%C3%B6ttmaning',
        permanent: false, // true -> 308 (permanent), false -> 307 (temporary)
      },
      {
        source: '/glh-light',
        destination: '/board?station=de%3A09162%3A430&amount=5&theme=light&include=U*%3A*&exclude=U6%3AFr%C3%B6ttmaning',
        permanent: false, // true -> 308 (permanent), false -> 307 (temporary)
      },
      {
        source: '/glh-bus',
        destination: '/board?station=de%3A09162%3A445&amount=5&theme=dark&include=&exclude=*%3AKieferngarten',
        permanent: false, // true -> 308 (permanent), false -> 307 (temporary)
      },
      {
        source: '/glh-bus-light',
        destination: '/board?station=de%3A09162%3A445&amount=5&theme=light&include=&exclude=*%3AKieferngarten',
        permanent: false, // true -> 308 (permanent), false -> 307 (temporary)
      },
      {
        source: '/gf',
        destination: '//board?station=de%3A09184%3A460&amount=5&theme=dark&include=U*%3A*&exclude=',
        permanent: false, // true -> 308 (permanent), false -> 307 (temporary)
      },
      {
        source: '/gf-light',
        destination: '//board?station=de%3A09184%3A460&amount=5&theme=light&include=U*%3A*&exclude=',
        permanent: false, // true -> 308 (permanent), false -> 307 (temporary)
      },
    ];
  },
};
