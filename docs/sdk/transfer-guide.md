---
id: transfer-guide
title: Transfer Guide
sidebar_label: Transfer Guide
---

# Transfer Guide

This guide walks through performing cross-chain token transfers using the Sol-Airlift TypeScript SDK.

## Prerequisites

Before starting transfers, ensure you have:

1. **Initialized SDK Client**
   ```typescript
   import { AirliftClient } from '@glacis-labs/sol-airlift-sdk';
   const client = new AirliftClient(connection, wallet, admin, 'Mainnet');
   ```

2. **Token Configuration**
   - Token must be registered in Sol-Airlift
   - Fee configuration must exist
   - Address Lookup Table (LUT) must be available

3. **Sufficient Balances**
   - Token balance for transfer amount + fees
   - SOL balance for transaction fees (~0.01 SOL recommended)

## LayerZero OFT Transfers

### Step 1: Prepare Transfer Parameters

```typescript
import { EndpointId } from '@layerzerolabs/lz-definitions';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

// Token configuration (from your token config file)
const tokenConfig = {
  symbol: "USDC",
  decimals: 6,
  solana: {
    token: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    oftProgramId: "7a4WjyR8VZ7yZz5XJAKm39BUGn5iT9CKcv2pmG9tdXVH",
    tokenEscrow: "5PwFKdLahZT6hQos5fp5fBczMhvogPDPHKiAgABx8XRG"
  },
  gmpParameters: "0x00030100110100000000000000000000000000030d40"
};

// Transfer parameters
const amount = new BN(1000).mul(new BN(10).pow(new BN(tokenConfig.decimals))); // 1000 USDC
const destinationAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f7E3d2"; // Ethereum
const destinationChainId = 1; // Ethereum
const destinationEid = 30101; // Ethereum LayerZero endpoint
```

### Step 2: Get Transfer Quote

```typescript
// Get fee configuration
const feeConfig = await client.getFeeConfigForToken(
  new PublicKey(tokenConfig.solana.token)
);

if (!feeConfig) {
  throw new Error('Token not supported');
}

// Get quote
const quote = await client.quoteLZ(
  EndpointId.SOLANA_V2_MAINNET,
  wallet,
  destinationAddress,
  new PublicKey(tokenConfig.solana.oftProgramId),
  new PublicKey(tokenConfig.solana.tokenEscrow),
  new PublicKey(tokenConfig.solana.token),
  destinationEid,
  amount,
  feeConfig,
  tokenConfig.gmpParameters
);

console.log('Quote breakdown:');
console.log('- Bridge fee:', quote.feeCosts.bridgeFee.nativeFee.toString(), 'lamports');
console.log('- Airlift fee:', quote.feeCosts.airliftFee.nativeFee.toString(), 'lamports');
console.log('- Token fee:', quote.feeCosts.airliftFee.tokenFee.toString());
```

### Step 3: Build Transfer Instructions

```typescript
// Convert destination address to bytes
const recipientBytes = Array.from(
  Buffer.from(destinationAddress.slice(2), 'hex')
);

// Get transfer instructions
const transferInfo = await client.getSendLzIxsInner(
  EndpointId.SOLANA_V2_MAINNET,
  amount,
  wallet,
  recipientBytes,
  new Uint8Array(recipientBytes),
  destinationEid,
  destinationChainId,
  new PublicKey(tokenConfig.solana.token),
  userTokenAccount, // User's token account
  new PublicKey(tokenConfig.solana.oftProgramId),
  new PublicKey(tokenConfig.solana.tokenEscrow),
  TOKEN_PROGRAM_ID,
  tokenConfig.decimals,
  quote.feeCosts.bridgeFee.nativeFee
);
```

### Step 4: Execute Transfer

```typescript
import { Transaction, VersionedTransaction, TransactionMessage } from '@solana/web3.js';

// Get lookup table
const lutAddress = new PublicKey(LOOKUP_TABLE_ADDRESSES[tokenConfig.symbol]);
const lookupTableAccount = await connection.getAddressLookupTable(lutAddress);

// Build versioned transaction with LUT
const blockhash = await connection.getLatestBlockhash();
const message = new TransactionMessage({
  payerKey: wallet.publicKey,
  recentBlockhash: blockhash.blockhash,
  instructions: transferInfo.instructions,
}).compileToV0Message([lookupTableAccount.value]);

const transaction = new VersionedTransaction(message);
transaction.sign([wallet, ...transferInfo.signers]);

// Send transaction
const signature = await connection.sendTransaction(transaction, {
  skipPreflight: false,
  preflightCommitment: 'confirmed'
});

console.log('Transfer sent:', signature);
console.log('View on Solscan:', `https://solscan.io/tx/${signature}`);
console.log('Track on LayerZeroScan:', `https://layerzeroscan.com/tx/${signature}`);
```

## Wormhole NTT Transfers

### Step 1: Prepare NTT Parameters

```typescript
// NTT token configuration
const nttConfig = {
  symbol: "W",
  decimals: 6,
  solana: {
    token: "85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ",
    manager: "NTtAaoDJhkeHeaVUHnyhwbPNAN6WgBpHkHBTc6d7vLK",
    transceiver: "NTtAaoDJhkeHeaVUHnyhwbPNAN6WgBpHkHBTc6d7vLK",
    quoter: "Nqd6XqA8LbsCuG8MLWWuP865NV6jR1MbXeKxD4HLKDJ",
    tokenAuthority: "BngZwHuLDkLVEacKMv3sYTb6VYGdnjbLuMCXBr1j9NeZ"
  },
  contracts: {
    ethereum: {
      chainId: 1,
      address: "0x1234567890123456789012345678901234567890"
    }
  }
};

// Transfer parameters
const amount = 100; // Human-readable amount
const destinationChain = "ethereum";
const destinationAddress = "0x9D3363d9e21bf5C3fF1da7E5322d559Db3b8a8bf";
```

### Step 2: Convert Parameters

```typescript
// Convert amount to smallest units
const totalAmount = new BN(amount).mul(
  new BN(10).pow(new BN(nttConfig.decimals))
);

// Get recipient chain ID
const recipientChainId = nttConfig.contracts[destinationChain].chainId;

// Convert address to bytes32
function ethAddressToBytes32(address: string): number[] {
  const cleanAddress = address.replace('0x', '');
  const padded = cleanAddress.padStart(64, '0');
  return Array.from(Buffer.from(padded, 'hex'));
}

const recipientAddress = ethAddressToBytes32(destinationAddress);
```

### Step 3: Build NTT Transfer

```typescript
// Get transfer instructions
const transferInfo = await client.getSendNttIxs(
  wallet.publicKey,
  new PublicKey(nttConfig.solana.token),
  nttConfig.solana,
  totalAmount,
  recipientAddress,
  recipientChainId,
  false // manual relay (false) or automatic (true)
);

console.log('NTT transfer prepared');
console.log('Instructions:', transferInfo.instructions.length);
console.log('Signers:', transferInfo.signers.length);
```

### Step 4: Execute NTT Transfer

```typescript
// Get LUT if available
const lutAddress = LOOKUP_TABLE_ADDRESSES[nttConfig.symbol];
const lookupTableAccount = lutAddress 
  ? await connection.getAddressLookupTable(new PublicKey(lutAddress))
  : null;

// Build transaction
const blockhash = await connection.getLatestBlockhash();
const message = new TransactionMessage({
  payerKey: wallet.publicKey,
  recentBlockhash: blockhash.blockhash,
  instructions: transferInfo.instructions,
}).compileToV0Message(
  transferInfo.luts.length 
    ? transferInfo.luts.map(lut => ({ /* LUT format */ }))
    : lookupTableAccount ? [lookupTableAccount.value] : []
);

const transaction = new VersionedTransaction(message);
transaction.sign([wallet, ...transferInfo.signers]);

// Send transaction
const signature = await connection.sendTransaction(transaction);

console.log('NTT transfer sent:', signature);
console.log('View on Wormholescan:', `https://wormholescan.io/#/tx/${signature}`);
```

## Best Practices

### 1. Balance Validation

Always check balances before transfers:

```typescript
async function validateBalances(
  connection: Connection,
  wallet: Keypair,
  tokenAccount: PublicKey,
  amount: BN,
  fees: Quote
) {
  // Check token balance
  const tokenBalance = await connection.getTokenAccountBalance(tokenAccount);
  const tokenAmount = new BN(tokenBalance.value.amount);
  const requiredTokens = amount.add(fees.feeCosts.airliftFee.tokenFee);
  
  if (tokenAmount.lt(requiredTokens)) {
    throw new Error(`Insufficient token balance. Need ${requiredTokens}, have ${tokenAmount}`);
  }
  
  // Check SOL balance
  const solBalance = await connection.getBalance(wallet.publicKey);
  const requiredSol = fees.feeCosts.bridgeFee.nativeFee
    .add(fees.feeCosts.airliftFee.nativeFee)
    .add(new BN(5000)); // Transaction fee buffer
  
  if (new BN(solBalance).lt(requiredSol)) {
    throw new Error(`Insufficient SOL balance. Need ${requiredSol}, have ${solBalance}`);
  }
}
```

### 2. Error Handling

Implement comprehensive error handling:

```typescript
async function safeTransfer(/* parameters */) {
  try {
    // Validate token support
    const feeConfig = await client.getFeeConfigForToken(mint);
    if (!feeConfig) {
      throw new Error('Token not supported for transfers');
    }
    
    // Get quote
    const quote = await client.quoteLZ(/* ... */);
    
    // Validate balances
    await validateBalances(/* ... */);
    
    // Execute transfer
    const signature = await executeTransfer(/* ... */);
    
    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }
    
    return signature;
    
  } catch (error) {
    console.error('Transfer failed:', error);
    
    // Handle specific errors
    if (error.message.includes('insufficient')) {
      // Handle insufficient balance
    } else if (error.message.includes('Transaction too large')) {
      // Handle missing LUT
    } else if (error.message.includes('blockhash not found')) {
      // Retry with new blockhash
    }
    
    throw error;
  }
}
```

### 3. Transaction Monitoring

Monitor transaction status:

```typescript
async function monitorTransaction(
  connection: Connection,
  signature: string,
  timeout: number = 60000
) {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    const status = await connection.getSignatureStatus(signature);
    
    if (status.value?.confirmationStatus === 'confirmed') {
      console.log('Transaction confirmed');
      return status.value;
    }
    
    if (status.value?.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error('Transaction timeout');
}
```

### 4. Fee Optimization

Optimize fees for better user experience:

```typescript
// For LayerZero - use fixed fee if quotes are unreliable
const USE_FIXED_FEE = true;
const FIXED_FEE_LAMPORTS = new BN(10_000_000); // 0.01 SOL

const layerZeroFee = USE_FIXED_FEE 
  ? FIXED_FEE_LAMPORTS 
  : quote.feeCosts.bridgeFee.nativeFee;

// Always add buffer for transaction fees
const totalSolRequired = layerZeroFee
  .add(quote.feeCosts.airliftFee.nativeFee)
  .add(new BN(5000)); // Buffer for transaction fee
```

## Common Issues and Solutions

### Issue: "Transaction too large"

**Cause**: Missing or incorrect Address Lookup Table

**Solution**:
```typescript
// Ensure LUT is provided
const lutAddress = LOOKUP_TABLE_ADDRESSES[tokenSymbol];
if (!lutAddress) {
  throw new Error(`No LUT configured for ${tokenSymbol}`);
}

// Use versioned transaction with LUT
const lookupTableAccount = await connection.getAddressLookupTable(
  new PublicKey(lutAddress)
);
```

### Issue: "Program failed to complete"

**Cause**: Various reasons including insufficient fees, incorrect parameters

**Solution**:
```typescript
// Enable preflight checks
const signature = await connection.sendTransaction(transaction, {
  skipPreflight: false,
  preflightCommitment: 'confirmed',
  maxRetries: 3
});

// Check logs for detailed error
const logs = await connection.getTransaction(signature, {
  maxSupportedTransactionVersion: 0
});
console.log('Transaction logs:', logs?.meta?.logMessages);
```

### Issue: "Blockhash not found"

**Cause**: Transaction took too long to submit

**Solution**:
```typescript
// Get fresh blockhash right before sending
const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

// Set blockhash and send immediately
transaction.recentBlockhash = blockhash;
const signature = await connection.sendTransaction(transaction);

// Confirm with block height
await connection.confirmTransaction({
  signature,
  blockhash,
  lastValidBlockHeight
});
```

## Complete Example

Here's a complete example combining all best practices:

```typescript
import { AirliftClient } from '@glacis-labs/sol-airlift-sdk';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';

async function performCrossChainTransfer() {
  // Initialize
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const wallet = Keypair.fromSecretKey(/* your key */);
  const client = new AirliftClient(connection, wallet, null, 'Mainnet');
  
  // Token details
  const tokenConfig = /* your token config */;
  const mint = new PublicKey(tokenConfig.solana.token);
  const amount = new BN(1000).mul(new BN(10).pow(new BN(tokenConfig.decimals)));
  
  try {
    // 1. Validate token support
    const feeConfig = await client.getFeeConfigForToken(mint);
    if (!feeConfig) {
      throw new Error('Token not supported');
    }
    
    // 2. Get user token account
    const userTokenAccount = await getAssociatedTokenAddress(mint, wallet.publicKey);
    
    // 3. Get quote
    const quote = await client.quoteLZ(/* parameters */);
    
    // 4. Validate balances
    await validateBalances(connection, wallet, userTokenAccount, amount, quote);
    
    // 5. Build transfer
    const transferInfo = await client.getSendLzIxsInner(/* parameters */);
    
    // 6. Execute with LUT
    const signature = await executeWithLUT(
      connection,
      wallet,
      transferInfo,
      tokenConfig.symbol
    );
    
    // 7. Monitor confirmation
    await monitorTransaction(connection, signature);
    
    console.log('Transfer successful:', signature);
    return signature;
    
  } catch (error) {
    console.error('Transfer failed:', error);
    throw error;
  }
}
```

## Next Steps

- Review [Fee Configuration](../token-management/fee-configuration) for fee management
- Learn about [Address Lookup Tables](../lut/creating-luts) for transaction optimization
- Explore [Token Management](../token-management/overview) for adding new tokens 