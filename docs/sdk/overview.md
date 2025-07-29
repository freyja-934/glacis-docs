---
id: overview
title: TypeScript SDK Overview
sidebar_label: Overview
---

# TypeScript SDK Overview

The Sol-Airlift TypeScript SDK provides a comprehensive interface for interacting with the Sol-Airlift program.

## Installation

```bash
npm install airlift-solana-sdk
# or
yarn add airlift-solana-sdk
# or
pnpm add airlift-solana-sdk
```

## Quick Start

```typescript
import { AirliftClient } from 'airlift-solana-sdk';
import { Connection, Keypair } from '@solana/web3.js';

// Initialize client
const connection = new Connection('https://api.mainnet-beta.solana.com');
const userKeypair = Keypair.fromSecretKey(userSecretKey);
const adminKeypair = Keypair.fromSecretKey(adminSecretKey);

const client = new AirliftClient(
  connection,
  userKeypair,
  adminKeypair,
  "Mainnet" // or "Devnet"
);
```

## Core Features

### 1. Quote Generation

Get quotes for cross-chain transfers:

```typescript
// LayerZero quote
const lzQuote = await client.quoteLZ(
  EndpointId.SOLANA_V2_MAINNET,
  userKeypair,
  "0x742d35Cc6634C0532925a3b844Bc9e7595f7E3d2", // Recipient
  oftProgramId,
  tokenEscrow,
  mint,
  30101, // Ethereum endpoint
  new BN(1_000_000), // Amount
  feeConfig,
  gmpParameters
);

// Wormhole NTT quote
const nttQuote = await client.quoteNtt(
  EndpointId.SOLANA_V2_MAINNET,
  userKeypair,
  "0x742d35Cc6634C0532925a3b844Bc9e7595f7E3d2",
  mint,
  1, // Ethereum chain ID
  new BN(1_000_000),
  feeConfig
);
```

### 2. Token Transfers

Execute cross-chain transfers:

```typescript
// LayerZero transfer
const lzTx = await client.sendLz(
  userKeypair,
  "0x742d35Cc6634C0532925a3b844Bc9e7595f7E3d2",
  oftProgramId,
  tokenEscrow,
  mint,
  30101,
  new BN(1_000_000),
  feeConfig,
  gmpParameters,
  luts // Optional Address Lookup Tables
);

// Wormhole NTT transfer
const nttTx = await client.sendNtt(
  userKeypair,
  "0x742d35Cc6634C0532925a3b844Bc9e7595f7E3d2",
  mint,
  1,
  new BN(1_000_000),
  feeConfig,
  luts
);
```

### 3. Token Management

Configure and manage tokens:

```typescript
// Register new token
await client.setTokenConfig(
  mint,
  {
    manager: nttManager,
    transceiver: nttTransceiver,
    quoter: nttQuoter,
    tokenDecimals: 6,
  },
  "NTT"
);

// Get token configuration
const config = await client.getTokenConfig(mint);

// Check if token is supported
const isSupported = await client.isTokenSupported(mint);
```

### 4. Fee Management

Configure fee structures:

```typescript
// Set global fees
await client.setGlobalFees({
  valueAmount: new BN(1_000_000), // 0.001 SOL
  tokenAmount: new BN(20),         // 20 BPS
  takeTokenBps: true,
  isZero: false
});

// Set token-specific fees
await client.setTokenFee(mint, {
  valueAmount: new BN(500_000),
  tokenAmount: new BN(15),
  takeTokenBps: true,
  isZero: false
});

// Get fee configuration
const feeConfig = await client.getFeeConfigForToken(mint);
```

## Advanced Usage

### Using Address Lookup Tables

Optimize transaction size with LUTs:

```typescript
import { AddressLookupTableAccount } from '@solana/web3.js';

// Fetch LUT
const lutAddress = new PublicKey("LUT_ADDRESS");
const lutAccount = await connection.getAddressLookupTable(lutAddress);

// Use in transfer
const tx = await client.sendLz(
  userKeypair,
  recipient,
  oftProgramId,
  tokenEscrow,
  mint,
  destinationEid,
  amount,
  feeConfig,
  gmpParameters,
  [lutAccount.value] // Pass LUT array
);
```

### Custom Transaction Options

```typescript
const options = {
  skipPreflight: false,
  preflightCommitment: 'confirmed',
  maxRetries: 3,
  confirmationTimeout: 60000,
};

const tx = await client.sendWithOptions(
  transferParams,
  options
);
```

### Error Handling

```typescript
try {
  const tx = await client.sendLz(...);
  console.log("Success:", tx);
} catch (error) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    console.error("Not enough SOL for fees");
  } else if (error.code === 'TOKEN_NOT_FOUND') {
    console.error("Token not registered");
  } else {
    console.error("Transfer failed:", error);
  }
}
```

## Client Configuration

### Network Selection

```typescript
// Mainnet
const mainnetClient = new AirliftClient(
  mainnetConnection,
  userKeypair,
  adminKeypair,
  "Mainnet"
);

// Devnet
const devnetClient = new AirliftClient(
  devnetConnection,
  userKeypair,
  adminKeypair,
  "Devnet"
);
```

### Custom RPC Configuration

```typescript
const connection = new Connection(
  "https://your-rpc-endpoint.com",
  {
    commitment: "confirmed",
    wsEndpoint: "wss://your-ws-endpoint.com",
    confirmTransactionInitialTimeout: 60000,
  }
);
```

## Helper Functions

### Fee Calculations

```typescript
// Calculate fees before transfer
const fees = await client.calculateFees(
  amount,
  tokenMint,
  destinationChain
);

console.log("Native fee:", fees.nativeFee.toString());
console.log("Token fee:", fees.tokenFee.toString());
console.log("Total cost:", fees.totalCost.toString());
```

### Quote Comparison

```typescript
// Compare quotes from different bridges
const quotes = await client.compareQuotes(
  mint,
  amount,
  destinationChain
);

const bestQuote = quotes.reduce((best, current) => 
  current.totalFee.lt(best.totalFee) ? current : best
);
```

## Types and Interfaces

### Core Types

```typescript
interface TokenConfig {
  tokenType: TokenType;
  mint: PublicKey;
  programId: PublicKey;
  configIndex?: number;
  mintIndex?: number;
}

interface FeeConfig {
  valueAmount: BN;
  tokenAmount: BN;
  takeTokenBps: boolean;
  isZero: boolean;
}

interface Quote {
  feeCosts: {
    bridgeFee: {
      nativeFee: BN;
      tokenFee: BN;
    };
    airliftFee: {
      nativeFee: BN;
      tokenFee: BN;
    };
  };
  totalFee: BN;
}
```

### Event Types

```typescript
client.on('transferInitiated', (event) => {
  console.log("Transfer started:", event.signature);
});

client.on('transferCompleted', (event) => {
  console.log("Transfer completed:", event.signature);
});

client.on('error', (error) => {
  console.error("Error occurred:", error);
});
```

## Best Practices

1. **Always use try-catch** for async operations
2. **Validate inputs** before sending transactions
3. **Use appropriate commitment levels** for confirmations
4. **Implement retry logic** for network issues
5. **Monitor gas prices** on destination chains
6. **Keep SDK updated** to latest version

## Migration Guide

### From v1 to v2

```typescript
// v1
const client = new SolAirlift(connection, wallet);

// v2
const client = new AirliftClient(
  connection,
  userKeypair,
  adminKeypair,
  "Mainnet"
);
```

## Next Steps

- [API Reference](./api-reference) - Complete API documentation
- [Transfer Guide](./transfer-guide) - Detailed transfer instructions
- [Quote Generation](./quote-generation) - Advanced quote features
- [Examples](../examples/scripts) - Code examples and scripts 