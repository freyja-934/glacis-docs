import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: 'Overview',
      collapsed: false,
      items: [
        'overview/introduction',
        'overview/architecture',
      ],
    },
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/prerequisites',
        'getting-started/quick-start',
        'getting-started/environment-setup',
      ],
    },
    {
      type: 'category',
      label: 'Token Management',
      items: [
        'token-management/overview',
        'token-management/ntt-setup',
        'token-management/layerzero-setup',
        'token-management/fee-configuration',
      ],
    },
    {
      type: 'category',
      label: 'SDK',
      items: [
        'sdk/overview',
        'sdk/api-reference',
        'sdk/transfer-guide',
        'sdk/quote-generation',
      ],
    },
    {
      type: 'category',
      label: 'Address Lookup Tables',
      items: [
        'lut/creating-luts',
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      items: [
        'examples/scripts',
        'examples/integration',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      items: [
        'tokens/supported-tokens',
        'troubleshooting/common-issues',
      ],
    },
  ],
};

export default sidebars;
