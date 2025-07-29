---
id: api-reference
title: API Reference
sidebar_label: API Reference
---

# API Reference

Complete reference for the Sol-Airlift TypeScript SDK methods and types.

## AirliftClient

The main client class for interacting with Sol-Airlift protocol.

### Constructor

```typescript
new AirliftClient(
  connection?: Connection,
  payer?: Keypair,
  admin?: Keypair,
  network?: "Testnet" | "Mainnet",
  nttPlatforms?: PlatformUtils<any>[]
)
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `connection` | `Connection` | No | Solana RPC connection |
| `payer` | `Keypair` | No | Keypair for transaction fees |
| `admin` | `Keypair` | No | Admin keypair for privileged operations |
| `network` | `"Testnet" \| "Mainnet"` | No | Network environment (default: "Mainnet") |
| `nttPlatforms` | `PlatformUtils<any>[]` | No | Additional Wormhole platforms |

#### Example

```typescript
const client = new AirliftClient(
  new Connection("https://api.mainnet-beta.solana.com"),
  payerKeypair,
  null,
  "Mainnet"
);
```

## Configuration Methods

### initializeGlobalConfig

Initialize the global configuration account for fees.

```typescript
async initializeGlobalConfig(
  valueAmount: BN,
  tokenAmount: BN,
  isZero: boolean,
  takeTokenBps: boolean,
  feeRecipients: PublicKey[]
): Promise<string>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `valueAmount` | `BN` | Fixed SOL fee in lamports |
| `tokenAmount` | `BN` | Fixed token fee |
| `isZero` | `boolean` | Whether fees are disabled |
| `takeTokenBps` | `boolean` | Whether to use basis points |
| `feeRecipients` | `PublicKey[]` | Array of fee recipient addresses |

#### Returns
- `Promise<string>`: Transaction signature

### initializeLayerZeroConfig

Initialize LayerZero configuration for OFT support.

```typescript
async initializeLayerZeroConfig(): Promise<string>
```

#### Returns
- `Promise<string>`: Transaction signature

### initializeNttConfig

Initialize Wormhole NTT configuration.

```typescript
async initializeNttConfig(): Promise<string>
```

#### Returns
- `Promise<string>`: Transaction signature

## Quote Methods

### quoteLZ

Get a quote for LayerZero OFT transfer.

```typescript
async quoteLZ(
  eid: EndpointId,
  payer: Keypair,
  destination: string,
  oftProgramId: PublicKey,
  tokenEscrow: PublicKey,
  mint: PublicKey,
  dstEid: number,
  totalAmount: BN,
  feeConfig: FeeConfig,
  gmpParameters?: string | Buffer
): Promise<Quote>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `eid` | `EndpointId` | Source endpoint ID |
| `payer` | `Keypair` | Payer keypair |
| `destination` | `string` | Destination address (e.g., "0x...") |
| `oftProgramId` | `PublicKey` | OFT program ID |
| `tokenEscrow` | `PublicKey` | Token escrow account |
| `mint` | `PublicKey` | Token mint address |
| `dstEid` | `number` | Destination endpoint ID |
| `totalAmount` | `BN` | Transfer amount |
| `feeConfig` | `FeeConfig` | Fee configuration |
| `gmpParameters` | `string \| Buffer` | Optional GMP parameters |

#### Returns

```typescript
interface Quote {
  feeCosts: {
    bridgeFee: {
      nativeFee: BN;  // LayerZero fee in lamports
      tokenFee: BN;   // LayerZero token fee
    };
    airliftFee: {
      nativeFee: BN;  // Airlift SOL fee
      tokenFee: BN;   // Airlift token fee
    };
  };
}
```

### quoteNtt

Get a quote for Wormhole NTT transfer.

```typescript
async quoteNtt(
  mint: PublicKey,
  nttConfig: NttSolanaConfig,
  amount: BN,
  recipientChain: ChainName
): Promise<Quote>
```

## Transfer Methods

### getSendLzIxsInner

Build LayerZero transfer instructions.

```typescript
async getSendLzIxsInner(
  eid: EndpointId,
  totalTransferAmount: BN,
  user: Keypair,
  recipientAddress: number[],
  to: Uint8Array,
  dstEid: number,
  chainId: number,
  mint: PublicKey,
  sourceTokenAddress: PublicKey,
  oftProgramId: PublicKey,
  tokenEscrow: PublicKey,
  tokenProgramId: PublicKey,
  decimals: number,
  nativeFee: BN
): Promise<TransactionInfo>
```

#### Returns

```typescript
interface TransactionInfo {
  instructions: TransactionInstruction[];
  signers: Keypair[];
  luts: PublicKey[];
}
```

### getSendNttIxs

Build Wormhole NTT transfer instructions.

```typescript
async getSendNttIxs(
  user: PublicKey,
  mint: PublicKey,
  nttConfig: NttSolanaConfig,
  totalAmount: BN,
  recipientAddress: number[],
  recipientChainId: number,
  automatic: boolean
): Promise<TransactionInfo>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `user` | `PublicKey` | User's public key |
| `mint` | `PublicKey` | Token mint |
| `nttConfig` | `NttSolanaConfig` | NTT configuration |
| `totalAmount` | `BN` | Transfer amount |
| `recipientAddress` | `number[]` | Recipient address as bytes |
| `recipientChainId` | `number` | Destination chain ID |
| `automatic` | `boolean` | Whether to use automatic relaying |

## Fee Methods

### getFeeConfigForToken

Get fee configuration for a specific token.

```typescript
async getFeeConfigForToken(mint: PublicKey): Promise<FeeConfig | null>
```

#### Parameters
- `mint`: Token mint address

#### Returns

```typescript
interface FeeConfig {
  valueAmount: BN;    // Fixed SOL fee
  tokenAmount: BN;    // Fixed token fee
  takeTokenBps: number; // Basis points (0.01% = 1)
  isZero: boolean;    // Whether fees are disabled
}
```

### calculateAirliftFees

Calculate Airlift fees for a transfer amount.

```typescript
function calculateAirliftFees(
  amount: BN,
  feeConfig: FeeConfig
): {
  valueFee: BN;
  tokenFee: BN;
}
```

## Utility Methods

### accountForOftDust

Calculate dust amount for OFT transfers.

```typescript
async accountForOftDust(
  mint: PublicKey,
  oftProgram: PublicKey,
  tokenEscrow: PublicKey,
  amount: BN,
  lzOftConfig: any
): Promise<BN>
```

## Types

### EndpointId

LayerZero endpoint identifiers:

```typescript
enum EndpointId {
  SOLANA_V2_MAINNET = 40168,
  SOLANA_V2_TESTNET = 40168,
  // ... other chains
}
```

### FeeConfig

```typescript
interface FeeConfig {
  valueAmount: BN;      // Fixed SOL fee in lamports
  tokenAmount: BN;      // Fixed token fee
  takeTokenBps: number; // Percentage fee in basis points
  isZero: boolean;      // Whether fees are disabled
}
```

### TransactionInfo

```typescript
interface TransactionInfo {
  instructions: TransactionInstruction[];
  signers: Keypair[];
  luts: PublicKey[];  // Address lookup tables
}
```

### Quote

```typescript
interface Quote {
  feeCosts: {
    bridgeFee: {
      nativeFee: BN;  // Bridge protocol fee (SOL)
      tokenFee: BN;   // Bridge protocol fee (tokens)
    };
    airliftFee: {
      nativeFee: BN;  // Airlift platform fee (SOL)
      tokenFee: BN;   // Airlift platform fee (tokens)
    };
  };
}
```

### NttSolanaConfig

```typescript
interface NttSolanaConfig {
  manager: string;         // NTT manager program
  transceiver: string;     // Wormhole transceiver
  quoter: string;          // Quote program
  token: string;           // Token mint
  tokenAuthority: string;  // Token authority
  // Additional fields...
}
```

## Error Handling

The SDK throws descriptive errors for common issues:

```typescript
try {
  const quote = await client.quoteLZ(...);
} catch (error) {
  if (error.message === "Admin keypair must be provided") {
    // Handle missing admin
  } else if (error.message === "Token config not found") {
    // Handle unsupported token
  }
}
```

### Common Errors

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Admin keypair must be provided" | Admin operation without admin keypair | Provide admin keypair in constructor |
| "Token config not found" | Token not registered | Add token configuration |
| "Insufficient balance" | Not enough tokens or SOL | Fund the account |
| "Transaction too large" | Missing address lookup table | Use provided LUTs |

## Complete Example

```typescript
import { AirliftClient } from '@glacis-labs/sol-airlift-sdk';
import { Connection, Keypair, Transaction } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

async function transferToken() {
  // Initialize client
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const wallet = Keypair.fromSecretKey(/* your key */);
  const client = new AirliftClient(connection, wallet, null, 'Mainnet');

  // Token details
  const mint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC
  const amount = new BN(1_000_000_000); // 1000 USDC

  // Get fee config
  const feeConfig = await client.getFeeConfigForToken(mint);
  if (!feeConfig) {
    throw new Error('Token not supported');
  }

  // Get quote
  const quote = await client.quoteLZ(
    EndpointId.SOLANA_V2_MAINNET,
    wallet,
    '0x742d35Cc6634C0532925a3b844Bc9e7595f7E3d2', // Ethereum address
    oftProgramId,
    tokenEscrow,
    mint,
    30101, // Ethereum endpoint
    amount,
    feeConfig
  );

  console.log('Total fee:', quote.feeCosts.bridgeFee.nativeFee.add(
    quote.feeCosts.airliftFee.nativeFee
  ).toString(), 'lamports');

  // Build transfer
  const transferInfo = await client.getSendLzIxsInner(
    // ... parameters
  );

  // Send transaction
  const tx = new Transaction().add(...transferInfo.instructions);
  const signature = await connection.sendTransaction(
    tx,
    [wallet, ...transferInfo.signers]
  );
  
  console.log('Transfer sent:', signature);
}
```

## See Also

- [SDK Overview](./overview)
- [Transfer Guide](./transfer-guide)
- [Quote Generation](./quote-generation)
- [Token Management](../token-management/overview) 