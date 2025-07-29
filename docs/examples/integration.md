---
id: integration
title: Frontend Integration
sidebar_label: Frontend Integration
---

# Frontend Integration

This guide covers integrating Sol-Airlift into your frontend application.

## Setup

### Install Dependencies

```bash
npm install airlift-solana-sdk @solana/web3.js @solana/wallet-adapter-react
```

### Initialize Client

```tsx
import { AirliftClient } from 'airlift-solana-sdk';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

function useAirlift() {
  const { connection } = useConnection();
  const wallet = useWallet();
  
  const client = useMemo(() => {
    if (!wallet.publicKey) return null;
    
    return new AirliftClient(
      connection,
      wallet as any,
      null, // Admin keypair not needed for users
      "Mainnet"
    );
  }, [connection, wallet]);
  
  return client;
}
```

## React Components

### Transfer Form Component

```tsx
import React, { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

interface TransferFormProps {
  client: AirliftClient;
  tokenMint: PublicKey;
}

export function TransferForm({ client, tokenMint }: TransferFormProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('ethereum');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(null);

  const handleGetQuote = async () => {
    setLoading(true);
    try {
      const tokenConfig = await client.getTokenConfig(tokenMint);
      const feeConfig = await client.getFeeConfigForToken(tokenMint);
      
      let quoteResult;
      if (tokenConfig.tokenType === 'OFT') {
        quoteResult = await client.quoteLZ(
          // ... parameters
        );
      } else {
        quoteResult = await client.quoteNtt(
          // ... parameters
        );
      }
      
      setQuote(quoteResult);
    } catch (error) {
      console.error('Quote failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!quote) return;
    
    setLoading(true);
    try {
      const tx = await client.sendLz(
        // ... parameters from quote
      );
      
      console.log('Transfer successful:', tx);
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transfer-form">
      <input
        type="text"
        placeholder="Recipient address (0x...)"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      
      <select
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
      >
        <option value="ethereum">Ethereum</option>
        <option value="arbitrum">Arbitrum</option>
        <option value="optimism">Optimism</option>
      </select>
      
      {!quote ? (
        <button onClick={handleGetQuote} disabled={loading}>
          Get Quote
        </button>
      ) : (
        <div>
          <div>Bridge Fee: {quote.bridgeFee} SOL</div>
          <div>Airlift Fee: {quote.airliftFee} SOL</div>
          <button onClick={handleTransfer} disabled={loading}>
            Confirm Transfer
          </button>
        </div>
      )}
    </div>
  );
}
```

### Token Selector Component

```tsx
interface Token {
  mint: string;
  symbol: string;
  name: string;
  icon: string;
  type: 'NTT' | 'OFT';
}

export function TokenSelector({ onSelect }: { onSelect: (token: Token) => void }) {
  const [tokens, setTokens] = useState<Token[]>([]);
  
  useEffect(() => {
    // Load supported tokens
    fetch('/api/tokens')
      .then(res => res.json())
      .then(setTokens);
  }, []);
  
  return (
    <div className="token-selector">
      {tokens.map(token => (
        <div
          key={token.mint}
          className="token-item"
          onClick={() => onSelect(token)}
        >
          <img src={token.icon} alt={token.symbol} />
          <div>
            <div>{token.symbol}</div>
            <div>{token.name}</div>
          </div>
          <span className="badge">{token.type}</span>
        </div>
      ))}
    </div>
  );
}
```

## State Management

### Using Context

```tsx
import { createContext, useContext, ReactNode } from 'react';

interface AirliftContextType {
  client: AirliftClient | null;
  selectedToken: Token | null;
  setSelectedToken: (token: Token) => void;
  supportedChains: Chain[];
}

const AirliftContext = createContext<AirliftContextType>({
  client: null,
  selectedToken: null,
  setSelectedToken: () => {},
  supportedChains: [],
});

export function AirliftProvider({ children }: { children: ReactNode }) {
  const client = useAirlift();
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  
  const supportedChains = useMemo(() => {
    if (!selectedToken) return [];
    
    // Get chains based on token type
    return getTokenChains(selectedToken);
  }, [selectedToken]);
  
  return (
    <AirliftContext.Provider value={{
      client,
      selectedToken,
      setSelectedToken,
      supportedChains,
    }}>
      {children}
    </AirliftContext.Provider>
  );
}

export const useAirliftContext = () => useContext(AirliftContext);
```

## Transaction Monitoring

### Transaction Status Component

```tsx
export function TransactionStatus({ signature }: { signature: string }) {
  const { connection } = useConnection();
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'failed'>('pending');
  const [confirmations, setConfirmations] = useState(0);
  
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { value } = await connection.getSignatureStatus(signature);
        
        if (value?.confirmationStatus === 'confirmed') {
          setStatus('confirmed');
          setConfirmations(value.confirmations || 0);
        } else if (value?.err) {
          setStatus('failed');
        }
      } catch (error) {
        console.error('Status check failed:', error);
      }
    };
    
    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, [signature, connection]);
  
  return (
    <div className={`tx-status ${status}`}>
      <div>Transaction: {signature.slice(0, 8)}...</div>
      <div>Status: {status}</div>
      {status === 'confirmed' && (
        <div>Confirmations: {confirmations}</div>
      )}
    </div>
  );
}
```

## Error Handling

### Error Boundary

```tsx
class AirliftErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Transfer Error</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### User-Friendly Error Messages

```tsx
function formatError(error: any): string {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    return 'Insufficient balance. Please add more SOL to your wallet.';
  }
  
  if (error.message?.includes('User rejected')) {
    return 'Transaction cancelled by user.';
  }
  
  if (error.message?.includes('Transaction too large')) {
    return 'Transaction size exceeded. Try a smaller amount.';
  }
  
  return 'Transfer failed. Please try again.';
}
```

## Complete Example App

```tsx
import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { AirliftProvider, useAirliftContext } from './contexts/AirliftContext';
import { TokenSelector } from './components/TokenSelector';
import { TransferForm } from './components/TransferForm';
import { TransactionHistory } from './components/TransactionHistory';

function App() {
  return (
    <AirliftProvider>
      <div className="app">
        <header>
          <h1>Sol-Airlift Bridge</h1>
          <WalletMultiButton />
        </header>
        
        <main>
          <BridgeInterface />
        </main>
      </div>
    </AirliftProvider>
  );
}

function BridgeInterface() {
  const { client, selectedToken, setSelectedToken } = useAirliftContext();
  const [activeTab, setActiveTab] = useState<'transfer' | 'history'>('transfer');
  
  if (!client) {
    return <div>Please connect your wallet</div>;
  }
  
  return (
    <div className="bridge-interface">
      <div className="tabs">
        <button
          className={activeTab === 'transfer' ? 'active' : ''}
          onClick={() => setActiveTab('transfer')}
        >
          Transfer
        </button>
        <button
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>
      
      {activeTab === 'transfer' ? (
        <>
          {!selectedToken ? (
            <TokenSelector onSelect={setSelectedToken} />
          ) : (
            <TransferForm
              client={client}
              tokenMint={new PublicKey(selectedToken.mint)}
            />
          )}
        </>
      ) : (
        <TransactionHistory />
      )}
    </div>
  );
}
```

## Styling

### Example CSS

```css
.bridge-interface {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background: #1a1a1a;
  border-radius: 12px;
}

.transfer-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.transfer-form input,
.transfer-form select {
  padding: 1rem;
  border: 1px solid #333;
  border-radius: 8px;
  background: #222;
  color: white;
  font-size: 16px;
}

.transfer-form button {
  padding: 1rem 2rem;
  background: #9945FF;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.transfer-form button:hover {
  opacity: 0.9;
}

.transfer-form button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.token-selector {
  display: grid;
  gap: 0.5rem;
}

.token-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #222;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.token-item:hover {
  background: #333;
}

.token-item img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.badge {
  margin-left: auto;
  padding: 0.25rem 0.5rem;
  background: #9945FF;
  border-radius: 4px;
  font-size: 12px;
}
```

## Best Practices

1. **Loading States**: Always show loading indicators during async operations
2. **Error Messages**: Provide clear, actionable error messages
3. **Transaction Confirmations**: Wait for sufficient confirmations before showing success
4. **Wallet State**: Handle wallet disconnection gracefully
5. **Mobile Support**: Ensure responsive design for mobile wallets
6. **Gas Estimation**: Show estimated fees before confirmation

## Next Steps

- [Example Scripts](./scripts) - More code examples
- [API Reference](../sdk/api-reference) - Complete SDK documentation
- [Troubleshooting](../troubleshooting/common-issues) - Common integration issues 