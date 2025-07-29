import React, { useEffect, useMemo, useState } from 'react';
import styles from './TokenSearch.module.css';

interface TokenConfig {
  symbol: string;
  standard: 'LayerZeroV2OFT' | 'NTTV1' | 'NTTV2';
  decimals: number;
  solana: {
    token: string;
    version?: string;
    type?: string;
    oftProgramId?: string;
    manager?: string;
  };
  contracts: Record<string, any>;
  homeChainId?: string;
}

interface ChainInfo {
  id: string;
  name: string;
}

const CHAIN_NAMES: Record<string, string> = {
  '1': 'Ethereum',
  '10': 'Optimism',
  '56': 'BSC',
  '137': 'Polygon',
  '8453': 'Base',
  '42161': 'Arbitrum',
  '43114': 'Avalanche',
  '5000': 'Mantle',
  '14': 'Flare',
  '101': 'Solana',
  '34443': 'Mode',
  '59144': 'Linea',
  '534352': 'Scroll',
  '1151111081099710': 'Solana'
};

const TokenSearch: React.FC = () => {
  const [tokens, setTokens] = useState<TokenConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<string>('all');
  const [versionFilter, setVersionFilter] = useState<string>('all');
  const [expandedToken, setExpandedToken] = useState<string | null>(null);

  // Comprehensive token data from Sol-Airlift configuration
  useEffect(() => {
    const mockTokens: TokenConfig[] = [
      // LayerZero OFT Tokens
      {
        symbol: 'WIF',
        standard: 'LayerZeroV2OFT',
        decimals: 6,
        solana: {
          token: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
          oftProgramId: 'HRPXLCqspQocTjfcX4rvAPaY9q6Gwb1rrD3xXWrfJWdW',
          version: 'v1',
          type: 'Adapter'
        },
        contracts: {
          '1151111081099710': 'HRPXLCqspQocTjfcX4rvAPaY9q6Gwb1rrD3xXWrfJWdW'
        }
      },
      {
        symbol: 'WAGMI',
        standard: 'LayerZeroV2OFT',
        decimals: 9,
        solana: {
          token: 'Hb4m5r21uoA1rWiNFBJgWN8W52QYbw6UV9jAQDbGNsqH',
          oftProgramId: '7svzFZxfmnPEhWroenza6eqqCDZvDyXgVDUtFp1r4rm4',
          version: 'v2',
          type: 'Native'
        },
        contracts: {
          '1': '0x92cc36d66e9d739d50673d1f27929a371fb83a67',
          '1151111081099710': '7svzFZxfmnPEhWroenza6eqqCDZvDyXgVDUtFp1r4rm4'
        }
      },
      {
        symbol: 'ALT',
        standard: 'LayerZeroV2OFT',
        decimals: 9,
        solana: {
          token: 'GVkbuvfYEXGJfUZwnVoyzzby3RsatA2Cr56BPp79JUbg',
          oftProgramId: 'CeEVLEGhkrLVqWKSYJimDjiTiSGqSAQortwLzaLihm9M',
          version: 'v2',
          type: 'Native'
        },
        contracts: {
          '1': '0x8457ca5040ad67fdebbcc8edce889a335bc0fbfb',
          '1151111081099710': 'CeEVLEGhkrLVqWKSYJimDjiTiSGqSAQortwLzaLihm9M'
        }
      },
      {
        symbol: 'SBC',
        standard: 'LayerZeroV2OFT',
        decimals: 9,
        solana: {
          token: 'DBAzBUXaLj1qANCseUPZz4sp9F8d2sc78C4vKjhbTGMA',
          oftProgramId: 'FBLPCK5w3wxpfxsdZfBcRfQCSXcC9x2cmocYHb5K6EZc',
          version: 'v2',
          type: 'Native'
        },
        contracts: {
          '1': '0xf9fb20b8e097904f0ab7d12e9dbee88f2dcd0f16',
          '1151111081099710': 'FBLPCK5w3wxpfxsdZfBcRfQCSXcC9x2cmocYHb5K6EZc'
        }
      },
      {
        symbol: 'LILY',
        standard: 'LayerZeroV2OFT',
        decimals: 9,
        solana: {
          token: 'Co5WwGeZfpfqGE1tUyAp1SBjcmumoY9sNN99MXRbX98K',
          oftProgramId: 'LiLYm6Hbew7mXyaRsqg8U5dCguFzwsp4QLDzjAnyAy7',
          version: 'v2',
          type: 'Native'
        },
        contracts: {
          '1': '0x7ce89243cc0d9e746609c57845eccbd9bb4b7315',
          '1151111081099710': 'LiLYm6Hbew7mXyaRsqg8U5dCguFzwsp4QLDzjAnyAy7'
        }
      },
      {
        symbol: 'ORA',
        standard: 'LayerZeroV2OFT',
        decimals: 9,
        solana: {
          token: 'BPYhCMNao2XG4UR771LurHrwUg3rcp76jmg4XFfAacvg',
          oftProgramId: '12UJoD4VRHneWXoy1j4k3KTACP8ZYX55sS4sbwzuk8KF',
          version: 'v2',
          type: 'Native'
        },
        contracts: {
          '1': '0x33333333fede34409fb7f67c6585047e1f653333',
          '1151111081099710': '12UJoD4VRHneWXoy1j4k3KTACP8ZYX55sS4sbwzuk8KF'
        }
      },
      {
        symbol: 'VIRTUAL',
        standard: 'LayerZeroV2OFT',
        decimals: 9,
        solana: {
          token: '3iQL8BFS2vE7mww4ehAqQHAsbmRNCrPxizWAT2Zfyr9y',
          oftProgramId: '68CFnYVZYu4Q4AACuKZenwruvXd5dDj8UoXyyxQmm9We',
          version: 'v2',
          type: 'Native'
        },
        contracts: {
          '8453': '0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b',
          '1151111081099710': '68CFnYVZYu4Q4AACuKZenwruvXd5dDj8UoXyyxQmm9We'
        }
      },
      {
        symbol: 'RECORD',
        standard: 'LayerZeroV2OFT',
        decimals: 6,
        solana: {
          token: 'nMRuwNqQsTt47yyQ5LqDtXgeegvyu5kNvCJQ369KKp5',
          oftProgramId: 'HRPXLCqspQocTjfcX4rvAPaY9q6Gwb1rrD3xXWrfJWdW',
          version: 'v1',
          type: 'Native'
        },
        contracts: {
          '8453': '0xe642657e4f43e6dcf0bd73ef24008394574dee28',
          '1151111081099710': 'HRPXLCqspQocTjfcX4rvAPaY9q6Gwb1rrD3xXWrfJWdW'
        }
      },
      {
        symbol: 'SP',
        standard: 'LayerZeroV2OFT',
        decimals: 9,
        solana: {
          token: 'E8zSHWdtgJ7pST1QPRDYkrKpnVJNoekZgETYm1yieT72',
          oftProgramId: '8k5EAWC9G6NHcVcsn6mUgqzYHgpB4kkAkAvaaEAUQLP5',
          version: 'v2',
          type: 'Native'
        },
        contracts: {
          '14': '0x3f710cbd0f4268719c6c2e5e078a4cafaeed7d45',
          '1151111081099710': '8k5EAWC9G6NHcVcsn6mUgqzYHgpB4kkAkAvaaEAUQLP5'
        }
      },
      {
        symbol: 'DTF',
        standard: 'LayerZeroV2OFT',
        decimals: 6,
        solana: {
          token: 'EmhVWGUa2Q9PN4QjzFjvuVyzFKg4s3ERwjKR9dQDpump',
          oftProgramId: 'HRPXLCqspQocTjfcX4rvAPaY9q6Gwb1rrD3xXWrfJWdW',
          version: 'v1',
          type: 'Adapter'
        },
        contracts: {
          '101': '0xe70e080c6F83EEABEEe6341A56Cfb2c94d7BD941',
          '1151111081099710': 'HRPXLCqspQocTjfcX4rvAPaY9q6Gwb1rrD3xXWrfJWdW'
        }
      },
      // NTT Tokens
      {
        symbol: 'W',
        standard: 'NTTV1',
        decimals: 6,
        solana: {
          token: '85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ',
          manager: 'NTtAaoDJhkeHeaVUHnyhwbPNAN6WgBpHkHBTc6d7vLK'
        },
        contracts: {
          '1': '0xb0ffa8000886e57f86dd5264b9582b2ad87b2b91',
          '10': '0xb0ffa8000886e57f86dd5264b9582b2ad87b2b91',
          '8453': '0xb0ffa8000886e57f86dd5264b9582b2ad87b2b91',
          '42161': '0xb0ffa8000886e57f86dd5264b9582b2ad87b2b91'
        }
      },
      {
        symbol: 'L3',
        standard: 'NTTV2',
        decimals: 9,
        solana: {
          token: '5k84VjAKoGPXa7ias1BNgKUrX7e61eMPWhZDqsiD4Bpe',
          manager: 'ntT5xGC7XEuR8Po9U3Umze12T9LBdaTCuEc9Cby6qPa'
        },
        contracts: {
          '1': '0x88909D489678dD17aA6D9609F89B0419Bf78FD9a',
          '10': '0x46777C76dBbE40fABB2AAB99E33CE20058e76C59',
          '56': '0x46777C76dBbE40fABB2AAB99E33CE20058e76C59',
          '137': '0x46777C76dBbE40fABB2AAB99E33CE20058e76C59',
          '8453': '0x46777C76dBbE40fABB2AAB99E33CE20058e76C59',
          '42161': '0x46777C76dBbE40fABB2AAB99E33CE20058e76C59'
        }
      },
      {
        symbol: 'AVAIL',
        standard: 'NTTV2',
        decimals: 9,
        solana: {
          token: 'CANeF11aEY9XNGbJmnQwTPvnnXoPfGKpPyLxZr2zVd9W',
          manager: 'nttbhNaJput6dP8hXV6fuuhRHyvKYy2GJYAs64s176G'
        },
        contracts: {
          '1': '0xEeB4d8400AEefafC1B2953e0094134A887C76Bd8',
          '56': '0x39702843A6733932ec7CE0dde404e5A6DBd8C989',
          '8453': '0xd89d90d26B48940FA8F58385Fe84625d468E057a'
        }
      },
      {
        symbol: 'PONKE',
        standard: 'NTTV2',
        decimals: 9,
        solana: {
          token: '5z3EqYQo9HiCEs3R84RCDMu2n7anpDMxRhdK8PSWmrRC',
          manager: 'NTTB7GBM1e559QnE2AtppjjuRmA9gHYMuqauLC2DiXn'
        },
        contracts: {
          '1': '0x4A0c64af541439898448659AEdcEC8E8e819FC53',
          '8453': '0x4A0c64af541439898448659AEdcEC8E8e819FC53'
        }
      },
      {
        symbol: 'BIO',
        standard: 'NTTV2',
        decimals: 9,
        solana: {
          token: 'bioJ9JTqW62MLz7UKHU69gtKhPpGi1BQhccj2kmSvUJ',
          manager: 'ntt11hdA4n1PupHhLyT1fsjg4YF9agVz3CTuzLRQs1H'
        },
        contracts: {
          '1': '0xcb1592591996765Ec0eFc1f92599A19767ee5ffA',
          '8453': '0x226A2FA2556C48245E57cd1cbA4C6c9e67077DD2'
        }
      },
      {
        symbol: 'RED',
        standard: 'NTTV2',
        decimals: 9,
        solana: {
          token: 'RED7iNewvwjeu9rdcugDqkPUm4fhGT7Dt9sYosFr6e7',
          manager: 'NTTLfv5maZDudMfd9gNjn99dcEgRMY3E5johLyE4Pm2'
        },
        contracts: {
          '1': '0xc43C6bfeDA065fE2c4c11765Bf838789bd0BB5dE',
          '8453': '0x4eB92702bA4cfbF80561BAd64D89C706Ac824960'
        }
      },
      {
        symbol: 'NEURON',
        standard: 'NTTV2',
        decimals: 9,
        solana: {
          token: 'neuRodi6Saw2cwDpud7FyAcjzqPBJDtr3fDTXE2Fu4j',
          manager: 'NTT7seDbSws7fyMS1R8gf8ZFreQgAnNJiVi8n1fAQNf'
        },
        contracts: {
          '1': '0xab814ce69E15F6B9660A3B184c0B0C97B9394A6b'
        }
      },
      {
        symbol: 'USDS',
        standard: 'NTTV2',
        decimals: 6,
        solana: {
          token: 'USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA',
          manager: 'STTUVCMPuNbk21y1J6nqEGXSQ8HKvFmFBKnCvKHTrWn'
        },
        contracts: {
          '1': '0xdc035d45d973e3ec169d2276ddab16f1e407384f'
        }
      },
      {
        symbol: 'PORTAL',
        standard: 'NTTV2',
        decimals: 9,
        solana: {
          token: 'FMQjDvT1GztVxdvYgMBEde4L54fftFGx9m5GmbqeJGM5',
          manager: 'ntT3RcLXQV8bMPiTwFNXvE9RTcxsmJLCH6DGtLXzfgV'
        },
        contracts: {
          '1': '0x1Bbe973BeF3a977Fc51CbED703E8ffDEfE001Fed'
        }
      },
      {
        symbol: 'JitoSOL',
        standard: 'NTTV1',
        decimals: 9,
        solana: {
          token: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
          manager: 'nTTJS9XtWhfHkPiLmddSmdMrCJAtJrSCjPwuns3fvu5'
        },
        contracts: {
          '42161': '0x83e1d2310ade410676b1733d16e89f91822fd5c3'
        }
      },
      {
        symbol: 'WSOL',
        standard: 'NTTV2',
        decimals: 9,
        solana: {
          token: 'So11111111111111111111111111111111111111112',
          manager: 'NttQ2dJzKK6EYVqUdVvtYXgTuGJC1PLuif7XiwZupMt'
        },
        contracts: {
          '43114': '0x634608ed64c61CA9e741F8095193c0bFa0FA19Cc'
        }
      }
    ];

    setTokens(mockTokens);
    setLoading(false);
  }, []);

  const filteredTokens = useMemo(() => {
    return tokens.filter(token => {
      const matchesSearch = token.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProtocol = protocolFilter === 'all' || 
        (protocolFilter === 'layerzero' && token.standard === 'LayerZeroV2OFT') ||
        (protocolFilter === 'ntt' && (token.standard === 'NTTV1' || token.standard === 'NTTV2'));
      const matchesVersion = versionFilter === 'all' ||
        (versionFilter === 'v1' && (token.standard === 'NTTV1' || token.solana.version === 'v1')) ||
        (versionFilter === 'v2' && (token.standard === 'NTTV2' || token.solana.version === 'v2'));
      
      return matchesSearch && matchesProtocol && matchesVersion;
    });
  }, [tokens, searchTerm, protocolFilter, versionFilter]);

  const getProtocolBadge = (standard: string) => {
    if (standard === 'LayerZeroV2OFT') {
      return <span className={styles.badgeLayerZero}>LayerZero OFT</span>;
    } else if (standard === 'NTTV1') {
      return <span className={styles.badgeNTT}>NTT v1</span>;
    } else if (standard === 'NTTV2') {
      return <span className={styles.badgeNTT}>NTT v2</span>;
    }
    return <span className={styles.badgeDefault}>{standard}</span>;
  };

  const getTypeBadge = (type?: string) => {
    if (!type) return null;
    return (
      <span className={type === 'Native' ? styles.badgeNative : styles.badgeAdapter}>
        {type}
      </span>
    );
  };

  const getSupportedChains = (contracts: Record<string, any>) => {
    return Object.keys(contracts)
      .filter(chainId => chainId !== '1151111081099710') // Exclude Solana testnet ID
      .map(chainId => CHAIN_NAMES[chainId] || `Chain ${chainId}`)
      .join(', ');
  };

  if (loading) {
    return <div className={styles.loading}>Loading tokens...</div>;
  }

  return (
    <div className={styles.tokenSearch}>
      <div className={styles.searchControls}>
        <input
          type="text"
          placeholder="Search tokens..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        
        <select
          value={protocolFilter}
          onChange={(e) => setProtocolFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Protocols</option>
          <option value="layerzero">LayerZero OFT</option>
          <option value="ntt">Wormhole NTT</option>
        </select>

        <select
          value={versionFilter}
          onChange={(e) => setVersionFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Versions</option>
          <option value="v1">Version 1</option>
          <option value="v2">Version 2</option>
        </select>
      </div>

      <div className={styles.tokenStats}>
        <span>Found {filteredTokens.length} tokens</span>
        <span>
          LayerZero: {filteredTokens.filter(t => t.standard === 'LayerZeroV2OFT').length} |
          NTT: {filteredTokens.filter(t => t.standard.startsWith('NTT')).length}
        </span>
      </div>

      <div className={styles.tokenGrid}>
        {filteredTokens.map((token) => (
          <div key={token.symbol} className={styles.tokenCard}>
            <div className={styles.tokenHeader}>
              <h3 className={styles.tokenSymbol}>{token.symbol}</h3>
              <div className={styles.tokenBadges}>
                {getProtocolBadge(token.standard)}
                {getTypeBadge(token.solana.type)}
              </div>
            </div>

            <div className={styles.tokenInfo}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Decimals:</span>
                <span>{token.decimals}</span>
              </div>
              
              <div className={styles.infoRow}>
                <span className={styles.label}>Supported Chains:</span>
                <span className={styles.chainsList}>
                  Solana, {getSupportedChains(token.contracts)}
                </span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.label}>Solana Token:</span>
                <code className={styles.address}>{token.solana.token}</code>
              </div>

              {token.standard === 'LayerZeroV2OFT' && (
                <div className={styles.infoRow}>
                  <span className={styles.label}>OFT Program:</span>
                  <code className={styles.address}>{token.solana.oftProgramId}</code>
                </div>
              )}

              {token.standard.startsWith('NTT') && (
                <div className={styles.infoRow}>
                  <span className={styles.label}>NTT Manager:</span>
                  <code className={styles.address}>{token.solana.manager}</code>
                </div>
              )}
            </div>

            <button
              className={styles.expandButton}
              onClick={() => setExpandedToken(
                expandedToken === token.symbol ? null : token.symbol
              )}
            >
              {expandedToken === token.symbol ? 'Hide Details' : 'Show Details'}
            </button>

            {expandedToken === token.symbol && (
              <div className={styles.tokenDetails}>
                <h4>Chain Contracts:</h4>
                <div className={styles.contractsList}>
                  {Object.entries(token.contracts).map(([chainId, address]) => (
                    <div key={chainId} className={styles.contractRow}>
                      <span className={styles.chainName}>
                        {CHAIN_NAMES[chainId] || `Chain ${chainId}`}:
                      </span>
                      <code className={styles.contractAddress}>{address}</code>
                    </div>
                  ))}
                </div>

                <div className={styles.integrationInfo}>
                  <h4>Integration Details:</h4>
                  <div className={styles.codeBlock}>
                    <pre>
{token.standard === 'LayerZeroV2OFT' ? 
`// LayerZero OFT Configuration
const quote = await client.quoteLZ(
  endpointId,
  userKeypair,
  recipientAddress,
  new PublicKey("${token.solana.oftProgramId}"),
  tokenEscrow,
  new PublicKey("${token.solana.token}"),
  destinationEid,
  amount,
  feeConfig
);` :
`// Wormhole NTT Configuration
const sendIxs = await client.getSendNttIxs(
  userPublicKey,
  new PublicKey("${token.solana.token}"),
  nttConfig,
  amount,
  recipientAddress,
  recipientChainId
);`}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredTokens.length === 0 && (
        <div className={styles.noResults}>
          <p>No tokens found matching your criteria.</p>
          <p>Try adjusting your search term or filters.</p>
        </div>
      )}
    </div>
  );
};

export default TokenSearch; 