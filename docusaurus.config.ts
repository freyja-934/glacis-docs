import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Sol-Airlift Documentation',
  tagline: 'Cross-chain token transfers on Solana with LayerZero OFT and Wormhole NTT',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://glacislabs.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/glacis-docs/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'glacislabs', // Usually your GitHub org/user name.
  projectName: 'glacis-docs', // Usually your repo name.

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },

  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/glacislabs/glacis-docs/tree/main/docs/',
          routeBasePath: '/', // Docs at root URL
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  // plugins: [
  //   // optional redirect plugin
  //   [
  //     '@docusaurus/plugin-client-redirects',
  //     {
  //       redirects: [
  //         {
  //           from: '/index.html',
  //           to: '/overview/introduction',
  //         },
  //       ],
  //       createRedirects(existingPath) {
  //         if (existingPath === '/overview/introduction') {
  //           return ['/'];
  //         }
  //         return undefined;
  //       },
  //     },
  //   ],
  // ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/sol-airlift-social-card.jpg',
    navbar: {
      title: 'SOL Airlift',
      logo: {
        alt: 'Sol-Airlift Logo',
        src: 'img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/glacislabs/glacis-docs',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/getting-started/prerequisites',
            },
            {
              label: 'Token Management',
              to: '/token-management/ntt-setup',
            },
            {
              label: 'Bridges',
              to: '/overview/architecture',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'LayerZero Docs',
              href: 'https://docs.layerzero.network',
            },
            {
              label: 'Wormhole Docs',
              href: 'https://docs.wormhole.com',
            },
            {
              label: 'Solana Docs',
              href: 'https://docs.solana.com',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/glacislabs/sol-airlift',
            },
            {
              label: 'Glacis Labs',
              href: 'https://glacislabs.com',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Glacis Labs. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['rust', 'toml', 'bash', 'json'],
    },
    mermaid: {
      theme: {
        light: 'default',
        dark: 'dark'
      },
    },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
