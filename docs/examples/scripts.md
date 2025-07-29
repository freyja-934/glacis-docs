---
id: scripts
title: Example Scripts
sidebar_label: Example Scripts
---

# Example Scripts

This page contains practical scripts for common Sol-Airlift operations.

## Token Management Scripts

### List All Supported Tokens

```typescript
// scripts/list-tokens.ts
import { AirliftClient } from 'airlift-solana-sdk';
import { Connection, Keypair } from '@solana/web3.js';

async function listTokens() {
  const connection = new Connection(process.env.RPC_URL!);
  const adminKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(process.env.ADMIN_KEYPAIR!))
  );
  
  const client = new AirliftClient(
    connection,
    adminKeypair,
    adminKeypair,
    "Mainnet"
  );
  
  // Fetch all token configs
  const tokenConfigs = await client.getAllTokenConfigs();
  
  console.log('Supported Tokens:');
  console.log('================');
  
  for (const config of tokenConfigs) {
    console.log(`
Token: ${config.symbol}
Mint: ${config.mint}
Type: ${config.tokenType}
Status: ${config.isActive ? '✅ Active' : '❌ Inactive'}
    `);
  }
}

listTokens().catch(console.error);
```

### Add New Token

```typescript
// scripts/add-token.ts
import { AirliftClient } from 'airlift-solana-sdk';
import { PublicKey } from '@solana/web3.js';
import fs from 'fs';

async function addToken(configPath: string, tokenType: 'NTT' | 'OFT') {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const client = await initializeClient();
  
  try {
    if (tokenType === 'NTT') {
      await client.setTokenConfig(
        new PublicKey(config.solana.token),
        {
          manager: new PublicKey(config.solana.manager),
          transceiver: new PublicKey(config.solana.transceiver),
          quoter: new PublicKey(config.solana.quoter),
          tokenDecimals: config.solana.decimals,
        },
        "NTT"
      );
    } else {
      await client.setTokenConfig(
        new PublicKey(config.solana.token),
        {
          oftProgramId: new PublicKey(config.solana.oftProgramId),
          tokenEscrow: config.solana.tokenEscrow,
          tokenDecimals: config.solana.decimals,
        },
        "OFT"
      );
    }
    
    console.log(`✅ Token ${config.symbol} added successfully`);
  } catch (error) {
    console.error(`❌ Failed to add token: ${error.message}`);
  }
}

// Usage
const args = process.argv.slice(2);
addToken(args[0], args[1] as 'NTT' | 'OFT');
```

## Transfer Scripts

### Execute LayerZero Transfer

```typescript
// scripts/send-lz-transfer.ts
import { AirliftClient } from 'airlift-solana-sdk';
import { PublicKey, Keypair } from '@solana/web3.js';
import BN from 'bn.js';

async function sendLzTransfer(
  tokenSymbol: string,
  amount: string,
  recipient: string,
  destinationChain: string
) {
  const client = await initializeClient();
  const userKeypair = await loadUserKeypair();
  
  // Load token config
  const tokenConfig = await loadTokenConfig(tokenSymbol);
  const mint = new PublicKey(tokenConfig.solana.token);
  
  // Get destination endpoint
  const destinationEid = getEndpointId(destinationChain);
  
  // Get fee config
  const feeConfig = await client.getFeeConfigForToken(mint);
  
  // Get quote first
  const quote = await client.quoteLZ(
    EndpointId.SOLANA_V2_MAINNET,
    userKeypair,
    recipient,
    new PublicKey(tokenConfig.solana.oftProgramId),
    tokenConfig.solana.tokenEscrow,
    mint,
    destinationEid,
    new BN(amount),
    feeConfig,
    tokenConfig.gmpParameters
  );
  
  console.log('Quote received:');
  console.log(`- Bridge fee: ${quote.feeCosts.bridgeFee.nativeFee} lamports`);
  console.log(`- Airlift fee: ${quote.feeCosts.airliftFee.nativeFee} lamports`);
  console.log(`- Token fee: ${quote.feeCosts.airliftFee.tokenFee}`);
  
  // Execute transfer
  const tx = await client.sendLz(
    userKeypair,
    recipient,
    new PublicKey(tokenConfig.solana.oftProgramId),
    tokenConfig.solana.tokenEscrow,
    mint,
    destinationEid,
    new BN(amount),
    feeConfig,
    tokenConfig.gmpParameters,
    [await loadLUT(tokenSymbol, destinationChain)]
  );
  
  console.log(`✅ Transfer sent: ${tx}`);
  console.log(`Track on LayerZero Scan: https://layerzeroscan.com/tx/${tx}`);
}

// Helper functions
function getEndpointId(chain: string): number {
  const endpoints = {
    'ethereum': 30101,
    'arbitrum': 30110,
    'optimism': 30111,
    'polygon': 30109,
    'bsc': 30102,
  };
  
  return endpoints[chain] || throw new Error(`Unknown chain: ${chain}`);
}
```

### Execute NTT Transfer

```typescript
// scripts/send-ntt-transfer.ts
import { AirliftClient } from 'airlift-solana-sdk';
import { PublicKey, Keypair } from '@solana/web3.js';
import BN from 'bn.js';

async function sendNttTransfer(
  tokenSymbol: string,
  amount: string,
  recipient: string,
  destinationChain: string
) {
  const client = await initializeClient();
  const userKeypair = await loadUserKeypair();
  
  // Load token config
  const tokenConfig = await loadTokenConfig(tokenSymbol);
  const mint = new PublicKey(tokenConfig.solana.token);
  
  // Get chain ID
  const chainId = getChainId(destinationChain);
  
  // Get fee config
  const feeConfig = await client.getFeeConfigForToken(mint);
  
  // Get quote
  const quote = await client.quoteNtt(
    EndpointId.SOLANA_V2_MAINNET,
    userKeypair,
    recipient,
    mint,
    chainId,
    new BN(amount),
    feeConfig
  );
  
  console.log('Quote received:');
  console.log(`- Bridge fee: ${quote.feeCosts.bridgeFee.nativeFee} lamports`);
  console.log(`- Airlift fee: ${quote.feeCosts.airliftFee.nativeFee} lamports`);
  
  // Execute transfer
  const tx = await client.sendNtt(
    userKeypair,
    recipient,
    mint,
    chainId,
    new BN(amount),
    feeConfig,
    [await loadLUT(tokenSymbol, 'ntt')]
  );
  
  console.log(`✅ Transfer sent: ${tx}`);
  console.log(`Track on Wormhole: https://wormholescan.io/#/tx/${tx}`);
}

function getChainId(chain: string): number {
  const chains = {
    'ethereum': 1,
    'bsc': 56,
    'polygon': 137,
    'avalanche': 43114,
  };
  
  return chains[chain] || throw new Error(`Unknown chain: ${chain}`);
}
```

## Fee Management Scripts

### Update Token Fees

```typescript
// scripts/update-fees.ts
import { AirliftClient } from 'airlift-solana-sdk';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

async function updateTokenFees(
  tokenMint: string,
  nativeFee: number,
  tokenFee: number,
  isBps: boolean
) {
  const client = await initializeClient();
  
  const feeConfig = {
    valueAmount: new BN(nativeFee * 1e9), // Convert SOL to lamports
    tokenAmount: new BN(tokenFee),
    takeTokenBps: isBps,
    isZero: false,
  };
  
  try {
    await client.setTokenFee(
      new PublicKey(tokenMint),
      feeConfig
    );
    
    console.log('✅ Fees updated successfully:');
    console.log(`- Native fee: ${nativeFee} SOL`);
    console.log(`- Token fee: ${tokenFee} ${isBps ? 'BPS' : 'tokens'}`);
  } catch (error) {
    console.error('❌ Failed to update fees:', error);
  }
}

// Usage
updateTokenFees(
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  0.001,  // 0.001 SOL
  20,     // 20 BPS (0.2%)
  true    // Use BPS
);
```

### Generate Fee Report

```typescript
// scripts/fee-report.ts
async function generateFeeReport() {
  const client = await initializeClient();
  const tokens = await client.getAllTokenConfigs();
  
  console.log('Fee Configuration Report');
  console.log('=======================\n');
  
  for (const token of tokens) {
    const feeConfig = await client.getFeeConfigForToken(token.mint);
    
    console.log(`${token.symbol} (${token.mint.toString().slice(0, 8)}...)`);
    console.log(`- Native fee: ${feeConfig.valueAmount.toNumber() / 1e9} SOL`);
    
    if (feeConfig.takeTokenBps) {
      console.log(`- Token fee: ${feeConfig.tokenAmount.toNumber()} BPS`);
    } else {
      console.log(`- Token fee: ${feeConfig.tokenAmount.toNumber()} tokens`);
    }
    
    console.log(`- Zero fees: ${feeConfig.isZero ? 'Yes' : 'No'}`);
    console.log('---\n');
  }
}
```

## LUT Management Scripts

### Create Custom LUT

```typescript
// scripts/create-custom-lut.ts
import {
  AddressLookupTableProgram,
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

async function createCustomLUT(
  accounts: PublicKey[],
  label: string
): Promise<PublicKey> {
  const connection = new Connection(process.env.RPC_URL!);
  const payer = await loadPayerKeypair();
  
  // Create LUT
  const slot = await connection.getSlot();
  const [createIx, lutAddress] = AddressLookupTableProgram.createLookupTable({
    authority: payer.publicKey,
    payer: payer.publicKey,
    recentSlot: slot - 1,
  });
  
  // Add accounts
  const extendIx = AddressLookupTableProgram.extendLookupTable({
    payer: payer.publicKey,
    authority: payer.publicKey,
    lookupTable: lutAddress,
    addresses: accounts,
  });
  
  // Build and send transaction
  const message = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    instructions: [createIx, extendIx],
  }).compileToV0Message();
  
  const tx = new VersionedTransaction(message);
  tx.sign([payer]);
  
  const signature = await connection.sendTransaction(tx);
  await connection.confirmTransaction(signature);
  
  console.log(`✅ LUT created: ${lutAddress.toString()}`);
  console.log(`Label: ${label}`);
  console.log(`Accounts: ${accounts.length}`);
  
  // Save LUT info
  await saveLUTInfo(lutAddress, label, accounts);
  
  return lutAddress;
}
```

### Analyze Transaction Size

```typescript
// scripts/analyze-tx-size.ts
async function analyzeTransactionSize(
  tokenSymbol: string,
  destinationChain: string
) {
  const client = await initializeClient();
  const tokenConfig = await loadTokenConfig(tokenSymbol);
  
  // Build test transaction
  const tx = await buildTestTransaction(
    client,
    tokenConfig,
    destinationChain
  );
  
  // Analyze without LUT
  const baseSize = tx.serialize().length;
  console.log(`Transaction size without LUT: ${baseSize} bytes`);
  
  // Try with different LUTs
  const luts = await loadAvailableLUTs(tokenSymbol);
  
  for (const lut of luts) {
    const message = tx.compileMessage([lut]);
    const size = message.serialize().length;
    const reduction = baseSize - size;
    const percentage = (reduction / baseSize * 100).toFixed(1);
    
    console.log(`\nWith LUT ${lut.key.toString().slice(0, 8)}...`);
    console.log(`- Size: ${size} bytes`);
    console.log(`- Reduction: ${reduction} bytes (${percentage}%)`);
  }
  
  // Recommendation
  if (baseSize > 1232) {
    console.log('\n⚠️  Transaction exceeds size limit!');
    console.log('Recommendation: Use LUT or split transaction');
  }
}
```

## Monitoring Scripts

### Monitor Transfer Status

```typescript
// scripts/monitor-transfer.ts
async function monitorTransfer(signature: string, bridgeType: 'lz' | 'ntt') {
  const connection = new Connection(process.env.RPC_URL!);
  
  console.log(`Monitoring transfer: ${signature}`);
  console.log('=====================================\n');
  
  // Monitor Solana confirmation
  let confirmed = false;
  while (!confirmed) {
    const status = await connection.getSignatureStatus(signature);
    
    if (status.value?.confirmationStatus === 'finalized') {
      confirmed = true;
      console.log('✅ Solana transaction finalized');
    } else {
      console.log(`⏳ Status: ${status.value?.confirmationStatus || 'pending'}`);
      await sleep(5000);
    }
  }
  
  // Get transaction details
  const tx = await connection.getParsedTransaction(signature, 'finalized');
  
  if (bridgeType === 'lz') {
    // Extract LayerZero nonce
    const nonce = extractLzNonce(tx);
    console.log(`\nLayerZero nonce: ${nonce}`);
    console.log(`Track on LayerZero Scan: https://layerzeroscan.com/tx/${signature}`);
  } else {
    // Extract Wormhole sequence
    const sequence = extractWhSequence(tx);
    console.log(`\nWormhole sequence: ${sequence}`);
    console.log(`Track on Wormhole Scan: https://wormholescan.io/#/tx/${signature}`);
  }
}
```

### Health Check Script

```typescript
// scripts/health-check.ts
async function healthCheck() {
  console.log('Sol-Airlift Health Check');
  console.log('=======================\n');
  
  const client = await initializeClient();
  
  // Check program
  try {
    const programAccount = await connection.getAccountInfo(AIRLIFT_PROGRAM_ID);
    console.log('✅ Program deployed');
    console.log(`   Size: ${programAccount.data.length} bytes`);
  } catch {
    console.log('❌ Program not found');
  }
  
  // Check global config
  try {
    const globalConfig = await client.getGlobalConfig();
    console.log('✅ Global config initialized');
    console.log(`   Admin: ${globalConfig.admin.toString()}`);
  } catch {
    console.log('❌ Global config not initialized');
  }
  
  // Check bridge endpoints
  console.log('\nBridge Endpoints:');
  
  // LayerZero
  try {
    const lzEndpoint = await connection.getAccountInfo(LZ_ENDPOINT);
    console.log('✅ LayerZero endpoint active');
  } catch {
    console.log('❌ LayerZero endpoint not found');
  }
  
  // Wormhole
  try {
    const whBridge = await connection.getAccountInfo(WORMHOLE_BRIDGE);
    console.log('✅ Wormhole bridge active');
  } catch {
    console.log('❌ Wormhole bridge not found');
  }
  
  // Token count
  const tokens = await client.getAllTokenConfigs();
  console.log(`\n📊 Registered tokens: ${tokens.length}`);
}
```

## Utility Functions

### Common Helpers

```typescript
// scripts/utils/helpers.ts
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

export async function initializeClient(): Promise<AirliftClient> {
  const connection = new Connection(
    process.env.RPC_URL || 'https://api.mainnet-beta.solana.com'
  );
  
  const adminKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(
      fs.readFileSync(process.env.ADMIN_KEYPAIR_PATH!, 'utf-8')
    ))
  );
  
  return new AirliftClient(
    connection,
    adminKeypair,
    adminKeypair,
    process.env.NETWORK as 'Mainnet' | 'Devnet' || 'Mainnet'
  );
}

export async function loadTokenConfig(symbol: string): Promise<any> {
  const configPath = path.join(
    __dirname,
    `../../config/tokens/${symbol}.json`
  );
  
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

export async function loadLUT(
  token: string,
  destination: string
): Promise<AddressLookupTableAccount> {
  const lutPath = path.join(
    __dirname,
    `../../luts/${token}-${destination}.json`
  );
  
  const lutData = JSON.parse(fs.readFileSync(lutPath, 'utf-8'));
  const connection = new Connection(process.env.RPC_URL!);
  
  const lut = await connection.getAddressLookupTable(
    new PublicKey(lutData.address)
  );
  
  if (!lut.value) {
    throw new Error(`LUT not found: ${lutData.address}`);
  }
  
  return lut.value;
}

export function formatAmount(
  amount: BN,
  decimals: number
): string {
  const divisor = new BN(10).pow(new BN(decimals));
  const whole = amount.div(divisor);
  const remainder = amount.mod(divisor);
  
  return `${whole}.${remainder.toString().padStart(decimals, '0')}`;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

## Usage Examples

```bash
# List all tokens
ts-node scripts/list-tokens.ts

# Add new token
ts-node scripts/add-token.ts ../config/tokens/NEW_TOKEN.json OFT

# Send LayerZero transfer
ts-node scripts/send-lz-transfer.ts USDC 1000000 0x742d35Cc... ethereum

# Send NTT transfer
ts-node scripts/send-ntt-transfer.ts USDT 5000000 0x742d35Cc... bsc

# Update fees
ts-node scripts/update-fees.ts

# Create custom LUT
ts-node scripts/create-custom-lut.ts --accounts acc1,acc2,acc3 --label "USDC-Ethereum"

# Monitor transfer
ts-node scripts/monitor-transfer.ts 5xY7n... lz

# Health check
ts-node scripts/health-check.ts
```

## Next Steps

- [Frontend Integration](./integration) - Build a UI
- [API Reference](../sdk/api-reference) - Complete SDK docs
- [Troubleshooting](../troubleshooting/common-issues) - Debug issues 